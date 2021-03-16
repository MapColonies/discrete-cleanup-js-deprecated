const CleanupScript = require('./cleanup_script');
const { getLoggerInstance } = require('./logger');
const logger = getLoggerInstance();

new CleanupScript()
  .main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + error.message);
    process.exit(1);
  });
