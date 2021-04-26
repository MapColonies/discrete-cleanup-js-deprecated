const S3 = require('aws-sdk/clients/s3');
const config = require('config');
let s3Client;

function getS3Instance() {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

function createS3Client() {
  const clientConfig = getS3Config();
  s3Client = new S3(clientConfig);
  return s3Client;
}

function getS3Config() {
  const s3Config = config.get('s3');
  const clientConfig = {
    apiVersion: s3Config.apiVersion,
    endpoint: s3Config.endpoint,
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    maxRetries: s3Config.maxRetries,
    sslEnabled: s3Config.sslEnabled,
    s3ForcePathStyle: true
  };
  if (typeof s3Config.sslEnabled !== 'boolean') {
    clientConfig.sslEnabled = s3Config.sslEnabled !== 'false';
  }
  if (typeof s3Config.maxRetries !== 'number') {
    clientConfig.maxRetries = parseInt(s3Config.maxRetries);
  }
  return clientConfig;
}

module.exports = { getS3Instance };
