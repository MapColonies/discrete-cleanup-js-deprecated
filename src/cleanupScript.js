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
    try {
      await Promise.allSettled(mapProxyLayersToDelete).then((results) => {
        results.filter((result) => result.status === 'rejected')
          .forEach((result) => {
            if (result && result.reason && result.reason.response && result.reason.response.status !== StatusCodes.NOT_FOUND) {
              this.logger.log('error', `Could not delete layer from mapproxy [${JSON.stringify(result)}]`);
              const discreteIndex = results.findIndex((currentResult) => {
                return currentResult === result;
              });
              const discrete = discreteLayers[discreteIndex];
              failedDiscreteLayers.push(discrete);
            }
          });
      });
    } catch (err) {
      throw err;
    }
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
    const tilesDeletionInstance = new TilesDeletion();
    const notCleanedAndSuccess = await this.getSuccessNotCleanedTasks();
    const notCleanedAndFailed = await this.getFailedAndNotCleanedTasks();
    const BATCH_SIZE = config.get('batch_size');

    for (let i = 0; i < notCleanedAndFailed.length; i += BATCH_SIZE.discreteLayers) {
      const currentBatch = notCleanedAndFailed.slice(i, i + BATCH_SIZE.discreteLayers);
      await tiffDeletionInstance.delete(currentBatch);
      await tilesDeletionInstance.delete(currentBatch);
      const failedDiscreteLayers = await this.deleteMapProxyLayer(currentBatch);
      const completedDiscretes = currentBatch.filter((discreteFromBatch) => {
        return !failedDiscreteLayers.find((discreteFromFailed) => {
          return discreteFromBatch.id === discreteFromFailed.id;
        });
      });
      await this.markAsCompleted(completedDiscretes);
    }

    for (let i = 0; i < notCleanedAndSuccess.length; i += BATCH_SIZE.discreteLayers) {
      const currentBatch = notCleanedAndSuccess.slice(i, i + BATCH_SIZE.discreteLayers);
      await tiffDeletionInstance.delete(currentBatch);
      await this.markAsCompleted(currentBatch);
    }
  }
}

module.exports = CleanupScript;
