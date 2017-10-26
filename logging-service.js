var winston = require('winston');

var loggingLevels = [
  'error',
  'warn',
  'info',
  'verbose',
  'debug',
  'silly'
];

if(process.env.LOGGING_LEVEL && loggingLevels.indexOf(process.env.LOGGING_LEVEL) > -1) {
  winston.level = process.env.LOGGING_LEVEL;
} else {
  winston.level = 'info';
}

module.exports = {
  logger: winston,
  resultsLog: new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        filename: 'test-results.log',
        level: 'info'
      })
    ]
  })
}