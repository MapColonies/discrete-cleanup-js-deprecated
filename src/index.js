const CleanupScript = require('./cleanupScript');
const { getLoggerInstance } = require('./logger');
const logger = getLoggerInstance();
const config = require('config');
const { SERVICE_PROVIDER } = require('./enums');

function validateConfig() {
  const serviceProvider = config.get('tiles_service_provider');
  if (!Object.keys(SERVICE_PROVIDER).includes(serviceProvider)) {
    throw new Error('Unsupported tiles service provider: ' + serviceProvider);
  }
}

let cleanupScript;
try {
  validateConfig();
  cleanupScript = new CleanupScript();
} catch (error) {
  logger.log('error', 'An error occured: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
  process.exit(1);
}

cleanupScript
  .main()
  .then(() => logger.log('info', 'Successfully completed cleanup job'))
  .catch((error) => {
    logger.log('error', 'An error occured: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  });
