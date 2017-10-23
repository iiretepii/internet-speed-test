var winston = require("winston");
var speedtest = require("speedtest-net");

var testType = process.env.TEST_TYPE || "wired";

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename: 'test-results.log',
      level: 'info'
    })
  ]
});

var runSpeedTest = () => {
  speedtest().on('data', data => {
    console.log('Speedtest successfully completed :)');
    logger.log('info',data);
  })
  .on('testserver', server => {
    console.log(`Server: ${server.name} (${server.bestPing.toFixed(0)}ms)`);
  })
  .on('downloadspeed', speed => {
    console.log(`download speed: ${(speed).toFixed(2)} Mb/s`);
  })
  .on('uploadspeed', speed => {
    console.log(`upload speed: ${(speed).toFixed(2)} Mb/s`);
  })
  .on('done', dataOverload => {
    // data overload includes too much
  })
  .on('error', err => {
    console.log('The speed test has encountered a terrible error', err);
  });
}

module.exports = function() {
  runSpeedTest();
}