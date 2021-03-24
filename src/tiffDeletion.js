const config = require('config');
const { getLoggerInstance } = require('./logger');
const { promises } = require('fs');

class TiffDeletion {
  constructor() {
    this.logger = getLoggerInstance();
    this.batchSize = config.get('batch_size').tiffDirectoryDeletion;
  }

  async delete(discreteArray) {
    const pathsArray = this.tiffsLocationParser(discreteArray);
    await this.deleteFromFs(pathsArray);
  }

  async deleteFromFs(pathsArray) {
    let batchArray = [];
    for (let i = 0; i < pathsArray.length; i += this.batchSize) {
      batchArray = pathsArray.slice(i, i + this.batchSize);
      this.logger.log(`info`, `Deleting directories from FS in path: [${batchArray.join(',')}]`);
      await this.deleteDirs(batchArray);
    }
  }

  async deleteDirs(pathArray) {
    const promiseDeleteArray = pathArray.map((path) => promises.rmdir(path, { recursive: true }));
    return Promise.all(promiseDeleteArray);
  }

  tiffsLocationParser(discreteArray) {
    const fileURIsArray = discreteArray.map((discrete) => discrete.metadata.fileUris);
    const allURIs = fileURIsArray.flat(); // Flatten an array from [[[[1, 2]]]] to [1,2]
    return allURIs;
  }
}

module.exports = TiffDeletion;
