const logger = require('../../src/logger');
const CleanupScript = require('../../src/cleanupScript');

const filedJobs = [
  {
    id: '37451d7f-aaa3-4bc6-9e68-7cb5eae764b1',
    resourceId: 'demo_1',
    version: 'tiles',
    tasks: [],
    parameters: {
      fileNames: ['tile1.png', 'tile2.png', 'tile3.png'],
      originDirectory: 'fakeDir1/fakeDir2'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Failed',
    reason: '',
    isCleaned: true
  },
  {
    id: '8ca6057a-e464-4682-8f11-a9754a88171e',
    resourceId: 'demo_2',
    version: 'tiles',
    tasks: [],
    parameters: {
      fileNames: ['tile4.png', 'tile5.png', 'tile6.png'],
      originDirectory: 'fakeDir3/fakeDir4'
    },
    created: '2021-04-11T13:11:06.614Z',
    updated: '2021-04-11T13:11:06.614Z',
    status: 'Failed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'e429f88c-3c8c-49f7-9afe-aac6fc786467',
    resourceId: 'demo_3',
    version: 'tiles',
    tasks: [],
    parameters: {
      fileNames: ['tile7.png', 'tile8.png', 'tile9.png'],
      originDirectory: 'fakeDir5/fakeDir6'
    },
    created: '2021-04-11T12:10:06.614Z',
    updated: '2021-04-11T12:10:06.614Z',
    status: 'Failed',
    reason: '',
    isCleaned: true
  }
];

const batchSize = {
  discreteLayers: 100
};

describe('cleanup script', () => {
  const deleteTiffsMock = jest.fn();
  const tiffDeletionMock = {
    delete: deleteTiffsMock
  };
  const deleteTilesMock = jest.fn();
  const tileDeletionMock = {
    delete: deleteTilesMock
  };
  const nowMock = new Date('2021-04-25T13:10:06.614Z');
  const RealDate = Date;
  let dateMock;
  let cleanupScript;

  beforeEach(() => {
    jest.spyOn(logger, 'getLoggerInstance').mockReturnValue({
      log: jest.fn()
    });
    dateMock = jest.spyOn(global, 'Date');
    dateMock.mockImplementation((date) => {
      if (date !== undefined) {
        return new RealDate(date);
      } else {
        return nowMock;
      }
    });
    cleanupScript = new CleanupScript();
    cleanupScript.tilesDeletionInstance = tileDeletionMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('cleanFailedTasks', () => {
    it('failed job sources will be deleted only for expired failed jobs', async () => {
      jest.spyOn(cleanupScript, 'getFailedAndNotCleanedTasks').mockResolvedValue(filedJobs);
      const mapProxyMock = jest.spyOn(cleanupScript, 'deleteMapProxyLayer').mockResolvedValue([]);
      const completeMock = jest.spyOn(cleanupScript, 'markAsCompleted').mockResolvedValue(undefined);

      await cleanupScript.cleanFailedTasks(tiffDeletionMock, batchSize);

      const expiredJobs = [filedJobs[2]];
      expect(deleteTiffsMock).toHaveBeenCalledWith(expiredJobs);
      expect(deleteTilesMock).toHaveBeenCalledWith(filedJobs);
      expect(mapProxyMock).toHaveBeenCalledWith(filedJobs);
      expect(completeMock).toHaveBeenCalledWith(expiredJobs);
    });
  });
});
