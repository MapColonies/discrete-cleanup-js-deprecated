const config = require('config');
const axios = require('axios');
const logger = require('./logger');
const fsPromise = require('fs').promises;

async function getNotCleanedTasks() {
  const dbConfig = config.get('db');
  const notCleanedTasksURL = `${dbConfig.url}/discrete?cleaned=false`;
  logger.info(`Retrieving not cleaned tasks from DB in url ${notCleanedTasksURL}`);
  const result = await axios.get(notCleanedTasksURL);
  return result.data;
}

function getURIsArray(discreteArray) {
  const fileURIsARray = discreteArray.map((discrete) => discrete.metadata.fileUris);
  const allURIs = [];
  for (let uriArray of fileURIsARray) {
    for (let uri of uriArray) {
      allURIs.push(uri);
    }
  }
  return allURIs;
}

function deleteFiles(pathArray) {
  const promiseDeleteArray = pathArray.map((path) => fsPromise.unlink(path));
  return Promise.all(promiseDeleteArray);
}

async function deleteChunks(urisArray) {
  const chunkSize = config.get('batch_size');
  let chunkedArray = [];

  for (let i = 0; i < urisArray.length; i += chunkSize) {
    chunkedArray = urisArray.slice(i, i + chunkSize);
    logger.info(`Deleting files from FS in paths: ${chunkedArray.join(' | ')}`);
    await deleteFiles(chunkedArray);
  }
}

async function deleteOriginalFiles() {
  const notCleaned = await getNotCleanedTasks();
  const allURIs = await getURIsArray(notCleaned);
  await deleteChunks(allURIs);
}

async function main() {
  await deleteOriginalFiles();
}

main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + error.message);
    process.exit(1);
  });
