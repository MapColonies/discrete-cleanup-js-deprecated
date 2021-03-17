const config = require('config');
const axios = require('axios');
const { promises } = require('fs');
const { getS3Instance } = require('./s3_client');
const { getLoggerInstance } = require('./logger');

class CleanupScript {
  constructor() {
    this.logger = getLoggerInstance();
    this.s3Client = getS3Instance();
  }

  executeDBRequest(method, url, data) {
    const dbConfig = config.get('db');
    const urlToExecute = `${dbConfig.url}/${url}`;
    this.logger.info(`Executing ${method.toUpperCase()} on ${urlToExecute}`);
    return axios({ method, url: urlToExecute, data });
  }

  async getSuccessNotCleanedTasks() {
    const result = await this.executeDBRequest('get', 'discrete?cleaned=false&status=Completed');
    return result.data;
  }

  async getFailedAndNotCleanedTasks() {
    const result = await this.executeDBRequest('get', 'discrete?cleaned=false&status=Failed');
    return result.data;
  }

  getURIsArray(discreteArray) {
    const fileURIsArray = discreteArray.map((discrete) => discrete.metadata.fileUris);
    const allURIs = fileURIsArray.flat(); // Flatten an array from [[[[1, 2]]]] to [1,2]
    return allURIs;
  }

  async deleteFiles(pathArray) {
    const promiseDeleteArray = pathArray.map((path) => promises.unlink(path));
    return Promise.all(promiseDeleteArray);
  }

  async deleteFsChunks(urisArray) {
    const chunkSize = config.get('batchSize').fsDeletion;
    let chunkedArray = [];
    for (let i = 0; i < urisArray.length; i += chunkSize) {
      try {
        chunkedArray = urisArray.slice(i, i + chunkSize);
        this.logger.info(`Trying to delete files from FS (first file starts at ${chunkedArray[0]})`);
        this.logger.debug(chunkedArray.join(''));
        await this.deleteFiles(chunkedArray);
      } catch (err) {
        this.logger.error(`Could not delete files from FS in path: ['${chunkedArray.join('')}']`);
      }
    }
  }

  async deleteOriginalFiles(notCleaned) {
    const allURIs = await this.getURIsArray(notCleaned);
    await this.deleteFsChunks(allURIs);
  }

  async s3MainDeleteLoop(notCleaned) {
    for (const discrete of notCleaned) {
      const { id, version } = discrete;
      await this.deleteS3WithBatch(`${id}/${version}`);
    }
  }

  async deleteS3WithBatch(Prefix) {
    let { itemsToDelete, ContinuationToken } = await this.parseItemsFromS3(Prefix);

    while (itemsToDelete.length !== 0) {
      await this.deleteFromS3(itemsToDelete);
      const prepareItems = await this.parseItemsFromS3(Prefix, ContinuationToken);
      itemsToDelete = prepareItems.itemsToDelete;
      ContinuationToken = prepareItems.ContinuationToken;
    }
  }

  async parseItemsFromS3(Prefix, ContinuationToken) {
    const s3 = config.get('s3');
    const BATCH_SIZE = config.get('batchSize').s3Deletion;
    this.logger.info(`Listing objects with prefix ${Prefix} from bucket ${s3.bucket}`);
    this.logger.debug(`Objects deleted: ${s3.listObjectMaxKeys}`);
    const res = await this.s3Client
      .listObjectsV2({
        Bucket: s3.bucket,
        MaxKeys: BATCH_SIZE,
        Prefix,
        ContinuationToken
      })
      .promise();
    const itemsToDelete = res.Contents.map((content) => {
      return { Key: content.Key };
    });
    return {
      itemsToDelete,
      ContinuationToken: res.NextContinuationToken
    };
  }

  async deleteFromS3(Objects) {
    const bucket = config.get('s3').bucket;
    this.logger.info(`Deleting objects from bucket ${bucket}`);
    this.logger.debug(JSON.stringify(Objects));
    return this.s3Client.deleteObjects({ Bucket: bucket, Delete: { Objects } }).promise();
  }

  async deleteMapProxyLayer(discreteLayers) {
    const mapproxyUrl = config.get('mapproxy_api').url;
    const mapProxyLayersToDelete = [];
    for (const discrete of discreteLayers) {
      mapProxyLayersToDelete.push(axios.delete(`${mapproxyUrl}/layer/${discrete.id}-${discrete.version}`));
    }
    this.logger.info(
      `Deleting layers [${discreteLayers.map((discrete) => `${discrete.id}-${discrete.version}`)}] from mapproxy in path [${mapproxyUrl}]`
    );
    await Promise.all(mapProxyLayersToDelete);
  }

  async markAsCompleted(notCleaned) {
    const updateArray = [];
    for (const discrete of notCleaned) {
      updateArray.push(this.executeDBRequest('put', `discrete/${discrete.id}/${discrete.version}`, { cleaned: true }));
    }
    await Promise.all(updateArray);
  }

  async main() {
    const notCleanedAndSuccess = await this.getSuccessNotCleanedTasks();
    const notCleanedAndFailed = await this.getFailedAndNotCleanedTasks();
    const BATCH_SIZE = config.get('batchSize').discreteLayers;

    for (let i = 0; i < notCleanedAndFailed.length; i += BATCH_SIZE) {
      const currentBatch = notCleanedAndFailed.slice(i, i + BATCH_SIZE);
      await this.deleteOriginalFiles(currentBatch);
      await this.s3MainDeleteLoop(currentBatch);
      await this.deleteMapProxyLayer(currentBatch);
      await this.markAsCompleted(currentBatch);
    }

    for (let i = 0; i < notCleanedAndSuccess.length; i += BATCH_SIZE) {
      const currentBatch = notCleanedAndSuccess.slice(i, i + BATCH_SIZE);
      await this.deleteOriginalFiles(currentBatch);
      await this.markAsCompleted(currentBatch);
    }
  }
}

module.exports = CleanupScript;
