var logger = require('winston');

logger.level = process.env.LOGGING_LEVEL || 'info';

module.exports = logger;