const config = require('config');
const MockData = require('../mocks/data');
const logger = require('../../src/logger');
jest.spyOn(logger, 'getLoggerInstance').mockReturnValue({
  debug: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
});
const CleanupScript = require('../../src/cleanup_script');

describe('Cleanup Script', () => {
  let cleanupScript;

  beforeEach(() => {
    cleanupScript = new CleanupScript();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should return a URIs array', () => {
    const urisArray = cleanupScript.getURIsArray(MockData.discreteArray);
    expect(urisArray).toBeInstanceOf(Array);
  });

  it('Should delete files from FS according to batch', async () => {
    const batchSize = config.get('batchSize').fsDeletion;
    const deleteFilesMock = jest.fn().mockReturnValue(undefined);
    cleanupScript.deleteFiles = deleteFilesMock;
    await cleanupScript.deleteChunks(MockData.urisArray);

    for (let i = 0; i < MockData.urisArray.length; i += batchSize) {
      expect(deleteFilesMock).toHaveBeenCalledWith(MockData.urisArray.slice(i, i + batchSize));
    }

    expect(deleteFilesMock).toHaveBeenCalledTimes(MockData.urisArray.length / batchSize);
  });

  it('Should process next S3 delete batch with correcet continuation token', async () => {
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
    cleanupScript.parseItemsFromS3 = prepareItemsMock;

    const deleteFromS3Mock = jest.fn().mockReturnValue(undefined);
    cleanupScript.deleteFromS3 = deleteFromS3Mock;
    await cleanupScript.deleteS3WithBatch(MockData.Prefix);

    expect(cleanupScript.parseItemsFromS3).toHaveBeenCalledWith(MockData.Prefix, 123456);
  });
});
