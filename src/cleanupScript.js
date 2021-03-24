const config = require('config');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { getS3Instance } = require('./s3Client');
const { getLoggerInstance } = require('./logger');
const TilesDeletion = require('./tilesDeletion');
const TiffDeletion = require('./tiffDeletion');

class CleanupScript {
  constructor() {
    this.logger = getLoggerInstance();
    this.s3Client = getS3Instance();
  }

  executeDBRequest(method, url, data) {
    const dbConfig = config.get('db');
    const urlToExecute = `${dbConfig.url}/${url}`;
    this.logger.log('info', `Executing ${method.toUpperCase()} on ${urlToExecute}`);
    return axios({ method, url: urlToExecute, data });
  }

  async getSuccessNotCleanedTasks() {
    const result = await this.executeDBRequest('get', 'discrete?isCleaned=false&status=Completed');
    return result.data;
  }

  async getFailedAndNotCleanedTasks() {
    const result = await this.executeDBRequest('get', 'discrete?isCleaned=false&status=Failed');
    return result.data;
  }

  async deleteMapProxyLayer(discreteLayers) {
    const mapproxyUrl = config.get('mapproxy_api').url;
    const mapProxyLayersToDelete = [];
    for (const discrete of discreteLayers) {
      mapProxyLayersToDelete.push(axios.delete(`${mapproxyUrl}/layer/${discrete.id}-${discrete.version}`));
    }
    this.logger.log(
      'info',
      `Deleting layers [${discreteLayers.map((discrete) => `${discrete.id}-${discrete.version}`)}] from mapproxy in path [${mapproxyUrl}]`
    );
    try {
      await Promise.all(mapProxyLayersToDelete);
    } catch (err) {
      if (err && err.response && err.response.status === StatusCodes.NOT_FOUND) {
        this.logger.log(
          'info',
          `Could not find layers [${discreteLayers.map((discrete) => `${discrete.id}-${discrete.version}`)}] from mapproxy in path [${mapproxyUrl}]`
        );
      } else {
        throw err;
      }
    }
  }

  async markAsCompleted(notCleaned) {
    const updateArray = [];
    for (const discrete of notCleaned) {
      updateArray.push(this.executeDBRequest('put', `discrete/${discrete.id}/${discrete.version}`, { isCleaned: true }));
    }
    await Promise.all(updateArray);
  }

  async main() {
    const tiffDeletionInstance = new TiffDeletion();
    const tilesDeletionInstance = new TilesDeletion();
    const notCleanedAndSuccess = await this.getSuccessNotCleanedTasks();
    const notCleanedAndFailed = await this.getFailedAndNotCleanedTasks();
    const BATCH_SIZE = config.get('batch_size');

    for (let i = 0; i < notCleanedAndFailed.length; i += BATCH_SIZE.discreteLayers) {
      const currentBatch = notCleanedAndFailed.slice(i, i + BATCH_SIZE.discreteLayers);
      await tiffDeletionInstance.delete(currentBatch);
      await tilesDeletionInstance.delete(currentBatch);
      await this.deleteMapProxyLayer(currentBatch);
      await this.markAsCompleted(currentBatch);
    }

    for (let i = 0; i < notCleanedAndSuccess.length; i += BATCH_SIZE.discreteLayers) {
      const currentBatch = notCleanedAndSuccess.slice(i, i + BATCH_SIZE.discreteLayers);
      await tiffDeletionInstance.delete(currentBatch);
      await this.markAsCompleted(currentBatch);
    }
  }
}

module.exports = CleanupScript;
