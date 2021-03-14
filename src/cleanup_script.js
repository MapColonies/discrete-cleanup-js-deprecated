const config = require('config');
const axios = require('axios');
const { promises } = require('fs');
const s3Client = require('./s3_client');
const logger = require('./logger');

function getDataFromDB(url) {
  const dbConfig = config.get('db');
  const urlToExecute = `${dbConfig.url}/${url}`;
  logger.info(`Retrieving not cleaned tasks from DB in url ${urlToExecute}`);
  return axios.get(urlToExecute);
}

async function getNotCleanedTasks() {
  const result = await getDataFromDB('discrete?cleaned=false');
  return result.data;
}

async function getFailedAndNotCleanedTasks() {
  const result = await getDataFromDB('discrete?cleaned=false&status=failed');
  return result.data;
}

function getURIsArray(discreteArray) {
  const fileURIsARray = discreteArray.map((discrete) => discrete.metadata.fileUris);
  const allURIs = [];
  for (const uriArray of fileURIsARray) {
    for (const uri of uriArray) {
      allURIs.push(uri);
    }
  }
  return allURIs;
}

function deleteFiles(pathArray) {
  const promiseDeleteArray = pathArray.map((path) => promises.unlink(path));
  return Promise.all(promiseDeleteArray);
}

async function deleteChunks(urisArray) {
  const chunkSize = config.get('batchSize').fsDeletion;
  let chunkedArray = [];
  for (let i = 0; i < urisArray.length; i += chunkSize) {
    try {
      chunkedArray = urisArray.slice(i, i + chunkSize);
      logger.info(`Trying to delete files from FS (first file starts at ${chunkedArray[0]})`);
      logger.debug(chunkedArray.join(''));
      await deleteFiles(chunkedArray);
    } catch (err) {
      logger.error(`Could not delete files from FS in path: ['${chunkedArray.join('')}']`);
    }
  }
}

async function deleteOriginalFiles(notCleaned) {
  const allURIs = await getURIsArray(notCleaned);
  await deleteChunks(allURIs);
}

async function s3MainDeleteLoop(notCleaned) {
  for (const discrete of notCleaned) {
    const { id, version } = discrete;
    await deleteS3WithBatch(`${id}/${version}`);
  }
}

async function deleteS3WithBatch(Prefix) {
  let { itemsToDelete, ContinuationToken } = await parseItemsFromS3(Prefix);

  while (itemsToDelete.length !== 0) {
    await deleteFromS3(itemsToDelete);
    const prepareItems = await parseItemsFromS3(Prefix, ContinuationToken);
    itemsToDelete = prepareItems.itemsToDelete;
    ContinuationToken = prepareItems.ContinuationToken;
  }
}

async function parseItemsFromS3(Prefix, ContinuationToken) {
  const s3 = config.get('s3');
  const BATCH_SIZE = config.get('batchSize').s3Deletion;
  logger.info(`Listing objects with prefix ${Prefix} from bucket ${s3.bucket}`);
  logger.debug(`Objects deleted: ${s3.listObjectMaxKeys}`);
  const res = await s3Client
    .listObjectsV2({
      Bucket: s3.bucket,
      MaxKeys: BATCH_SIZE,
      Prefix,
      ContinuationToken
    })
    .promise();
  const itemsToDelete = res.Contents.map((content) => {
    return { Key: content.Key };
  });
  return {
    itemsToDelete,
    ContinuationToken: res.NextContinuationToken
  };
}

async function deleteFromS3(Objects) {
  const bucket = config.get('s3').bucket;
  logger.info(`Deleting objects from bucket ${bucket}`);
  logger.debug(JSON.stringify(Objects));
  return s3Client.deleteObjects({ Bucket: bucket, Delete: { Objects } }).promise();
}

async function deleteMapProxyLayer(discreteLayers) {
  const mapproxyUrl = config.get('mapproxy_api').url;
  const mapProxyLayersToDelete = [];
  for (const discrete of discreteLayers) {
    mapProxyLayersToDelete.push(axios.delete(`${mapproxyUrl}/layer/${discrete.id}-${discrete.version}`));
  }
  logger.info(`Deleting layers [${discreteLayers.map((discrete) => `${discrete.id}-${discrete.version}`)}] from mapproxy in path [${mapproxyUrl}]`);
  await Promise.all(mapProxyLayersToDelete);
}

async function main() {
  const notCleaned = await getNotCleanedTasks();
  const notCleanedAndFailed = await getFailedAndNotCleanedTasks();
  const BATCH_SIZE = config.get('batchSize').discreteLayers;

  for (let i = 0; i < notCleaned.length; i += BATCH_SIZE) {
    const currentBatch = notCleaned.slice(i, i + BATCH_SIZE);
    await deleteOriginalFiles(currentBatch);
  }

  for (let i = 0; i < notCleanedAndFailed.length; i += BATCH_SIZE) {
    const currentBatch = notCleanedAndFailed.slice(i, i + BATCH_SIZE);
    await s3MainDeleteLoop(currentBatch);
    await deleteMapProxyLayer(currentBatch);
  }
}

main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + error.message);
    process.exit(1);
  });
