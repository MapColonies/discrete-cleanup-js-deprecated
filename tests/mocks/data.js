const discreteArray = [
  {
    id: '37451d7f-aaa3-4bc6-9e68-7cb5eae764b1',
    resourceId: 'demo_1',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        parameters: {
          minZoom: 0,
          maxZoom: 8
        },
        updateDate: '2021-03-15T08:06:29.117Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile1.png', 'tile2.png', 'tile3.png'],
      originDirectory: 'fakeDir1/fakeDir2'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: '8ca6057a-e464-4682-8f11-a9754a88171e',
    resourceId: 'demo_2',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        parameters: {
          minZoom: 0,
          maxZoom: 8
        },
        updateDate: '2021-03-15T08:06:29.117Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile4.png', 'tile5.png', 'tile6.png'],
      originDirectory: 'fakeDir3/fakeDir4'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'e429f88c-3c8c-49f7-9afe-aac6fc786467',
    resourceId: 'demo_3',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        parameters: {
          minZoom: 0,
          maxZoom: 8
        },
        updateDate: '2021-03-15T08:06:29.117Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile7.png', 'tile8.png', 'tile9.png'],
      originDirectory: 'fakeDir5/fakeDir6'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'edf1d872-2b8a-4556-a3d6-4bb3f198c00e',
    resourceId: 'demo_4',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        parameters: {
          minZoom: 0,
          maxZoom: 8
        },
        created: '2021-04-25T13:10:06.614Z',
        updated: '2021-04-25T13:10:06.614Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile10.png', 'tile11.png', 'tile12.png'],
      originDirectory: 'fakeDir7/fakeDir8'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'bab81024-eb0b-4362-a682-25d411f40d34',
    resourceId: 'demo_5',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        parameters: {
          minZoom: 0,
          maxZoom: 8
        },
        created: '2021-04-25T13:10:06.614Z',
        updated: '2021-04-25T13:10:06.614Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile13.png', 'tile14.png', 'tile15.png'],
      originDirectory: 'fakeDir9/fakeDir10'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'demo_6',
    version: 'tiles',
    tasks: [
      {
        id: 'a9ec652c-e3e8-479f-a14d-b504514ab4af',
        minZoom: 0,
        maxZoom: 8,
        updateDate: '2021-03-15T08:06:29.117Z',
        status: 'Pending',
        reason: '',
        attempts: 0
      }
    ],
    parameters: {
      fileNames: ['tile16.png', 'tile17.png', 'tile18.png'],
      originDirectory: 'fakeDir11/fakeDir12'
    },
    created: '2021-04-25T13:10:06.614Z',
    updated: '2021-04-25T13:10:06.614Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  }
];

const urisArray = [
  '/tiffs/fakeDir1/fakeDir2',
  '/tiffs/fakeDir3/fakeDir4',
  '/tiffs/fakeDir5/fakeDir6',
  '/tiffs/fakeDir7/fakeDir8',
  '/tiffs/fakeDir9/fakeDir10',
  '/tiffs/fakeDir11/fakeDir12'
];

const s3KeysArray = urisArray.map((uri) => {
  return { Key: uri };
});

const Prefix = 'fakePrefix';

module.exports = { discreteArray, urisArray, s3KeysArray, Prefix };
