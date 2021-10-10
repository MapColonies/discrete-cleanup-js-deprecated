const path = require('path');
const MockData = require('../mocks/data');
const logger = require('../../src/logger');

jest.spyOn(logger, 'getLoggerInstance').mockReturnValue({
  log: jest.fn()
});
jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
const TilesDeletion = require('../../src/tilesDeletion');

describe('tile deletion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should process next S3 delete batch with correct continuation token', async () => {
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
