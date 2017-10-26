var resultsLog = require("./logging-service").resultsLog;
var logger = require("./logging-service").logger;
var speedtest = require("speedtest-net");
var moment = require("moment");

var testType = process.env.TEST_TYPE || "wired";

var hitServerOnce = false;

var runSpeedTest = () => {
  logger.info(moment().format('MMMM Do YYYY, h:mm:ss a'));
  logger.info(`Type: ${testType}`);
  speedtest().on('data', data => {
    logger.info(`ISP: ${data.client.isp}`);
    logger.info('Speed test complete. Results logged.\n');
    data.test_type = testType;
    resultsLog.info(data);
  })
  .on('testserver', server => {
    if(!hitServerOnce) {
      logger.info(`Server: ${server.sponsor} - ${server.name} - ${server.bestPing.toFixed(0)}ms`);
      hitServerOnce = true;
    }
  })
  .on('downloadspeed', speed => {
    logger.info(`download speed: ${(speed).toFixed(2)} Mb/s`);
  })
  .on('uploadspeed', speed => {
    logger.info(`upload speed: ${(speed).toFixed(2)} Mb/s`);
  })
  .on('done', dataOverload => {
    // data overload includes too much
  })
  .on('error', err => {
    logger.error('speed test hit an error', err);
  });
}

module.exports = function() {
  runSpeedTest();
}
