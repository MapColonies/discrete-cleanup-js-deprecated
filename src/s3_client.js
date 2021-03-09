const S3 = require('aws-sdk/clients/s3');
const config = require('config');
let s3Client;

function getS3Client() {
  if (!s3Client) {
    const s3Config = config.get('s3');
    const clientConfig = {
      apiVersion: s3Config.apiVersion,
      endpoint: s3Config.endpoint,
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      maxRetries: s3Config.maxRetries,
      sslEnabled: s3Config.sslEnabled,
      s3ForcePathStyle: true,
    };
    s3Client = new S3(clientConfig);
  }
  return s3Client;
}

module.exports = getS3Client();
