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
  const chunkSize = config.get('batch_size');
  let chunkedArray = [];

  for (let i = 0; i < urisArray.length; i += chunkSize) {
    chunkedArray = urisArray.slice(i, i + chunkSize);
    logger.info(`Deleting files from FS in paths: ["${chunkedArray.join('", "')}"]`);
    await deleteFiles(chunkedArray);
  }
}

async function deleteOriginalFiles() {
  const notCleaned = await getNotCleanedTasks();
  const allURIs = await getURIsArray(notCleaned);
  await deleteChunks(allURIs);
}

async function s3MainDeleteLoop() {
  const discretes = await getItemsToDelete();
  for (const discrete of discretes) {
    const id = discrete.id;
    const version = discrete.version;
    await deleteS3WithBatch(`${id}/${version}`);
  }
}

async function getItemsToDelete() {
  const result = await getDataFromDB('discrete?cleaned=false&status=failed');
  return result.data;
}

async function deleteS3WithBatch(Prefix) {
  const BATCH_SIZE = config.get('s3').deleteBatchSize;
  let { prepareItemsToDeletion, ContinuationToken } = await parseItemsFromS3(Prefix);

  while (prepareItemsToDeletion.length !== 0) {
    const s3DeletePromiseArray = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      s3DeletePromiseArray.push(deleteFromS3(prepareItemsToDeletion));
    }

    await Promise.all(s3DeletePromiseArray);
    prepareItemsToDeletion = (await parseItemsFromS3(Prefix, ContinuationToken)).prepareItemsToDeletion;
  }
}

async function parseItemsFromS3(Prefix, ContinuationToken) {
  const s3 = config.get('s3');
  logger.info(`Listing ${s3.listObjectMaxKeys} objects from bucket ${s3.bucket}`);
  const res = await s3Client.listObjectsV2({ Bucket: s3.bucket, MaxKeys: s3.listObjectMaxKeys, Prefix, ContinuationToken }).promise();
  const prepareItemsToDeletion = res.Contents.map((content) => {
    return { Key: content.Key };
  });
  return { prepareItemsToDeletion, ContinuationToken: res.NextContinuationToken };
}

async function deleteFromS3(Objects) {
  const bucket = config.get('s3').bucket;
  logger.info(`Deleting ${JSON.stringify(Objects)} objects from bucket ${bucket}`);
  return s3Client.deleteObjects({ Bucket: bucket, Delete: { Objects } }).promise();
}

async function main() {
  await deleteOriginalFiles();
  await s3MainDeleteLoop();
}

main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + error.message);
    process.exit(1);
  });
