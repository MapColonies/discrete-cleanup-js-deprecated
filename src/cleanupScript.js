const config = require('config');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { getS3Instance } = require('./s3Client');
const { getLoggerInstance } = require('./logger');
const TilesDeletion = require('./tilesDeletion');
const TiffDeletion = require('./tiffDeletion');

const JOB_TYPE = 'Discrete-Tiling';

class CleanupScript {
  constructor() {
    this.logger = getLoggerInstance();
    this.s3Client = getS3Instance();
    this.tilesDeletionInstance = new TilesDeletion();
  }

  executeDBRequest(method, url, data) {
    const dbConfig = config.get('db');
    const urlToExecute = `${dbConfig.url}/${url}`;
    this.logger.log('info', `Executing ${method.toUpperCase()} on ${urlToExecute}`);
    return axios({ method, url: urlToExecute, data });
  }

  async getSuccessNotCleanedTasks() {
    const result = await this.executeDBRequest('get', `jobs?isCleaned=false&status=Completed&type=${JOB_TYPE}`);
    return result.data ? result.data : [];
  }

  async getFailedAndNotCleanedTasks() {
    const result = await this.executeDBRequest('get', `jobs?isCleaned=false&status=Failed&type=${JOB_TYPE}`);
    return result.data ? result.data : [];
  }

  async deleteMapProxyLayer(discreteLayers) {
    const mapproxyUrl = config.get('mapproxy_api').url;
    const failedDiscreteLayers = [];
    const mapProxyLayersToDelete = [];
    for (const discrete of discreteLayers) {
      mapProxyLayersToDelete.push(axios.delete(`${mapproxyUrl}/layer/${discrete.resourceId}-${discrete.version}`));
    }
    this.logger.log(
      'info',
      `Deleting layers [${discreteLayers.map((discrete) => `${discrete.resourceId}-${discrete.version}`)}] from mapproxy in path [${mapproxyUrl}]`
    );

    await Promise.allSettled(mapProxyLayersToDelete).then((results) => {
      results.forEach((result, index) => {
        if (
          result &&
          result.status === 'rejected' &&
          result.reason &&
          result.reason.response &&
          result.reason.response.status !== StatusCodes.NOT_FOUND
        ) {
          this.logger.log('error', `Could not delete layer from mapproxy [${result.message}]`);
          failedDiscreteLayers.push(discreteLayers[index]);
        }
      });
    });
    return failedDiscreteLayers;
  }

  async markAsCompleted(notCleaned) {
    const updateArray = [];
    for (const discrete of notCleaned) {
      updateArray.push(this.executeDBRequest('put', `jobs/${discrete.id}`, { isCleaned: true }));
    }
    await Promise.all(updateArray);
  }

  async main() {
    const tiffDeletionInstance = new TiffDeletion();
    const BATCH_SIZE = config.get('batch_size');

    await this.cleanFailedTasks(tiffDeletionInstance, BATCH_SIZE);
    await this.CleanSuccessfulTasks(tiffDeletionInstance, BATCH_SIZE);
  }

  async CleanSuccessfulTasks(tiffDeletionInstance, BATCH_SIZE) {
    const notCleanedAndSuccess = await this.getSuccessNotCleanedTasks();
    for (let i = 0; i < notCleanedAndSuccess.length; i += BATCH_SIZE.discreteLayers) {
      const currentBatch = notCleanedAndSuccess.slice(i, i + BATCH_SIZE.discreteLayers);
      await tiffDeletionInstance.delete(currentBatch);
      await this.markAsCompleted(currentBatch);
    }
  }

  async cleanFailedTasks(tiffDeletionInstance, batchSize) {
    const FAILED_CLEANUP_DELAY = config.get('failed_cleanup_delay_days');
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() - FAILED_CLEANUP_DELAY);
    const notCleanedAndFailed = await this.getFailedAndNotCleanedTasks();

    for (let i = 0; i < notCleanedAndFailed.length; i += batchSize.discreteLayers) {
      const currentBatch = notCleanedAndFailed.slice(i, i + batchSize.discreteLayers);
      const expiredBatch = this.filterExpiredFailedTasks(currentBatch, deleteDate);
      await tiffDeletionInstance.delete(expiredBatch);
      await this.tilesDeletionInstance.delete(currentBatch);
      const failedDiscreteLayers = await this.deleteMapProxyLayer(currentBatch);
      const completedDiscretes = expiredBatch.filter((el) => !failedDiscreteLayers.includes(el));
      await this.markAsCompleted(completedDiscretes);
    }
  }

  filterExpiredFailedTasks(tasks, deleteDate) {
    const filteredTasks = [];
    for (let i = 0; i < tasks.length; i++) {
      const updateDate = new Date(tasks[i].updated);
      if (updateDate <= deleteDate) {
        filteredTasks.push(tasks[i]);
      }
    }
    return filteredTasks;
  }
}

module.exports = CleanupScript;
