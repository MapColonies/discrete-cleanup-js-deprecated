const config = require('config');
const { getS3Instance } = require('./s3Client');
const { promises } = require('fs');
const { getLoggerInstance } = require('./logger');
const { SERVICE_PROVIDER } = require('./enums');

class TilesDeletion {
  constructor() {
    this.logger = getLoggerInstance();
    this.s3Client = getS3Instance();
    this.batchSize = config.get('batch_size').tilesDeletion;
    this.s3Config = config.get('s3');
  }

  async delete(discreteArray) {
    const pathsArray = this.tilesLocationParser(discreteArray);
    if (config.get('service_provider') === SERVICE_PROVIDER.S3) {
      await this.executeS3Loop(pathsArray);
    } else {
      await this.executeFsLoop(pathsArray);
    }
  }

  async executeS3Loop(s3PathsArray) {
    for (const s3Path of s3PathsArray) {
      await this.deleteS3WithBatch(s3Path);
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
    this.logger.info(`Listing objects with prefix ${Prefix} from bucket ${this.s3Config.bucket}`);
    this.logger.debug(`Objects deleted: ${this.s3Config.listObjectMaxKeys}`);
    const res = await this.s3Client
      .listObjectsV2({
        Bucket: this.s3Config.bucket,
        MaxKeys: this.batchSize,
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

  async executeFsLoop(pathsArray) {
    let chunkedArray = [];
    for (let i = 0; i < pathsArray.length; i += this.batchSize) {
      try {
        chunkedArray = pathsArray.slice(i, i + this.batchSize);
        this.logger.info(`Trying to delete directories from FS at paths: ['${chunkedArray.join(', ')}']`);
        await this.deleteDirectory(chunkedArray);
      } catch (err) {
        this.logger.error(
          `Could not delete directories from FS in path: ['${chunkedArray.join(', ')}'], error: ${JSON.stringify(
            err,
            Object.getOwnPropertyNames(err)
          )}`
        );
      }
    }
  }

  async deleteDirectory(pathsArray) {
    const promiseDeleteArray = pathsArray.map((path) => promises.rmdir(path, { recursive: true }));
    return Promise.all(promiseDeleteArray);
  }

  tilesLocationParser(discreteArray) {
    if (config.get('service_provider') === SERVICE_PROVIDER.S3) {
      return discreteArray.map((discrete) => `${discrete.id}/${discrete.version}`);
    } else {
      const fsTilesLocation = config.get('fs_tiles_location');
      const allURIs = discreteArray.map((discrete) => `${fsTilesLocation}/${discrete.id}/${discrete.version}`);
      return allURIs;
    }
  }
}

module.exports = TilesDeletion;
