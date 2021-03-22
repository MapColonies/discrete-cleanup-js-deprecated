const CleanupScript = require('./cleanupScript');
const { getLoggerInstance } = require('./logger');
const logger = getLoggerInstance();

let cleanupScript;
try {
  cleanupScript = new CleanupScript();
} catch (error) {
  logger.error('An error occured: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
  process.exit(1);
}

cleanupScript
  .main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  });
