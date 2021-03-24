const config = require('config');
const MockData = require('../mocks/data');
const logger = require('../../src/logger');
jest.spyOn(logger, 'getLoggerInstance').mockReturnValue({
  debug: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
});
const TiffDeletion = require('../../src/tiffDeletion');
const TilesDeletion = require('../../src/tilesDeletion');

describe('Cleanup Script', () => {
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
    const batchSize = config.get('batch_size').tiffDeletion;
    const tiffDeletion = new TiffDeletion();
    tiffDeletion.deleteDirs = jest.fn().mockReturnValue(undefined);
    await tiffDeletion.deleteFromFs(MockData.urisArray);

    for (let i = 0; i < MockData.urisArray.length; i += batchSize) {
      expect(tiffDeletion.deleteDirs).toHaveBeenCalledWith(MockData.urisArray.slice(i, i + batchSize));
    }

    expect(tiffDeletion.deleteDirs).toHaveBeenCalledTimes(MockData.urisArray.length / batchSize);
  });

  it('Should process next S3 delete batch with correcet continuation token', async () => {
    const tilesDeletion = new TilesDeletion();
    const prepareItemsMock = jest
      .fn()
      .mockReturnValueOnce({
        itemsToDelete: MockData.s3KeysArray,
        ContinuationToken: 123456
      })
      .mockReturnValue({
        itemsToDelete: [],
        ContinuationToken: 789
      });
    tilesDeletion.parseItemsFromS3 = prepareItemsMock;

    tilesDeletion.deleteFromS3 = jest.fn().mockReturnValue(undefined);
    await tilesDeletion.deleteS3WithBatch(MockData.Prefix);

    expect(tilesDeletion.parseItemsFromS3).toHaveBeenCalledWith(MockData.Prefix, 123456);
  });
});
