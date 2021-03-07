const logger = require('./logger');

async function main() {
  // TODO: add logic
}

main()
  .then(() => logger.info('Successfully completed cleanup job'))
  .catch((error) => {
    logger.error('An error occured: ' + error.message);
    process.exit(1);
  });
