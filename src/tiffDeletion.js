const config = require('config');
const { getLoggerInstance } = require('./logger');
const { promises } = require('fs');

class TiffDeletion {
  constructor() {
    this.logger = getLoggerInstance();
    this.batchSize = config.get('batch_size').tiffDeletion;
  }

  async delete(discreteArray) {
    const pathsArray = this.tiffsLocationParser(discreteArray);
    await this.deleteFromFs(pathsArray);
  }

  async deleteFromFs(pathsArray) {
    let chunkedArray = [];
    for (let i = 0; i < pathsArray.length; i += this.batchSize) {
      try {
        chunkedArray = pathsArray.slice(i, i + this.batchSize);
        this.logger.info(`Trying to delete files from FS (first file starts at ${chunkedArray[0]})`);
        this.logger.debug(chunkedArray.join(''));
        await this.deleteFiles(chunkedArray);
      } catch (err) {
        this.logger.error(
          `Could not delete files from FS in path: ['${chunkedArray.join('')}'], error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`
        );
      }
    }
  }

  async deleteFiles(pathsArray) {
    const promiseDeleteArray = pathsArray.map((path) => promises.unlink(path));
    return Promise.all(promiseDeleteArray);
  }

  tiffsLocationParser(discreteArray) {
    const fileURIsArray = discreteArray.map((discrete) => discrete.metadata.fileUris);
    const allURIs = fileURIsArray.flat(); // Flatten an array from [[[[1, 2]]]] to [1,2]
    return allURIs;
  }
}

module.exports = TiffDeletion;
