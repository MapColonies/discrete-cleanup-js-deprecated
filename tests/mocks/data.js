const discreteArray = [
  {
    id: 'demo_1',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'demo_2',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'demo_3',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'demo_4',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  },
  {
    id: 'demo_5',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
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
    metadata: {
      fileUris: ['/fakePath', '/fakePath2', '/fakePath3']
    },
    updateDate: '2021-03-15T09:14:29.749Z',
    status: 'Completed',
    reason: '',
    isCleaned: true
  }
];

const urisArray = ['/fakePath', '/fakePath2', '/fakePath3', '/fakePath4', '/fakePath5', '/fakePath6', '/fakePath7'];

const s3KeysArray = urisArray.map((uri) => {
  return { Key: uri };
});

const Prefix = 'fakePrefix';

module.exports = { discreteArray, urisArray, s3KeysArray, Prefix };
