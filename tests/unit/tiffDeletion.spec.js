const path = require('path');
const config = require('config');
const MockData = require('../mocks/data');
const logger = require('../../src/logger');

jest.spyOn(logger, 'getLoggerInstance').mockReturnValue({
  log: jest.fn()
});
jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
const TiffDeletion = require('../../src/tiffDeletion');

describe('tiff deletion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Checks tiffs parser functionality', async () => {
    const tiffDeletionInstance = new TiffDeletion();
    tiffDeletionInstance.deleteFromFs = jest.fn().mockReturnValue(undefined);
    await tiffDeletionInstance.delete(MockData.discreteArray);

    expect(tiffDeletionInstance.deleteFromFs).toHaveBeenCalledWith(MockData.urisArray);
  });

  it('Should delete tiffs from FS according to batch', async () => {
    const batchSize = config.get('batch_size').tiffDirectoryDeletion;
    const tiffDeletion = new TiffDeletion();
    tiffDeletion.deleteDirs = jest.fn().mockReturnValue(undefined);
    await tiffDeletion.deleteFromFs(MockData.urisArray);

    for (let i = 0; i < MockData.urisArray.length; i += batchSize) {
      expect(tiffDeletion.deleteDirs).toHaveBeenCalledWith(MockData.urisArray.slice(i, i + batchSize));
    }

    expect(tiffDeletion.deleteDirs).toHaveBeenCalledTimes(MockData.urisArray.length / batchSize);
  });
});
