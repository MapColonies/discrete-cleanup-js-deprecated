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
    for (const path of pathsArray) {
      this.logger.info(`Deleting directories from FS in path: ${path}`);
      await promises.rmdir(path, { recursive: true });
    }
  }

  tiffsLocationParser(discreteArray) {
    const fileURIsArray = discreteArray.map((discrete) => discrete.metadata.fileUris);
    const allURIs = fileURIsArray.flat(); // Flatten an array from [[[[1, 2]]]] to [1,2]
    return allURIs;
  }
}

module.exports = TiffDeletion;
