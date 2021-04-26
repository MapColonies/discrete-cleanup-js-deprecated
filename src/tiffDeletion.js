const config = require('config');
const { getLoggerInstance } = require('./logger');
const { promises } = require('fs');
const { join: joinPath } = require('path');

class TiffDeletion {
  constructor() {
    this.logger = getLoggerInstance();
    this.batchSize = config.get('batch_size').tiffDirectoryDeletion;
    this.mountDir = config.get('fs.sources_location');
  }

  async delete(discreteArray) {
    const directories = this.tiffsLocationParser(discreteArray);
    await this.deleteFromFs(directories);
  }

  async deleteFromFs(directories) {
    let batchArray = [];
    for (let i = 0; i < directories.length; i += this.batchSize) {
      batchArray = directories.slice(i, i + this.batchSize);
      this.logger.log('info', `Deleting directories from FS in path: [${batchArray.join(',')}]`);
      await this.deleteDirs(batchArray);
    }
  }

  async deleteDirs(directories) {
    const promiseDeleteArray = directories.map((directory) => promises.rmdir(directory, { recursive: true }));
    return Promise.all(promiseDeleteArray);
  }

  tiffsLocationParser(discreteArray) {
    const directories = discreteArray.map((discrete) => joinPath(this.mountDir, discrete.parameters.originDirectory));
    return directories;
  }
}

module.exports = TiffDeletion;
