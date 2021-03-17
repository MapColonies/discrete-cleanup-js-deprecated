const config = require('config');

let logger;

function getLoggerInstance() {
  if (!logger) {
    logger = getLogger();
  }
  return logger;
}

function getLogger() {
  const MCLogger = require('@map-colonies/mc-logger').MCLogger;
  const loggerConf = config.get('logger');
  const serviceConf = require('../package.json');
  logger = new MCLogger(loggerConf, serviceConf);
  return logger;
}

module.exports = { getLoggerInstance };
