var winston = require("winston");
var speedtest = require("speedtest-net");
var moment = require("moment");

var testType = process.env.TEST_TYPE || "wired";

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename: 'test-results.log',
      level: 'info'
    })
  ]
});

var hitServerOnce = false;

var runSpeedTest = () => {
  console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
  console.log(`Type: ${testType}`);
  speedtest().on('data', data => {
    console.log(`ISP: ${data.client.isp}`);
    console.log('Speed test complete. Results logged.\n');
    data.test_type = testType;
    logger.log('info',data);
  })
  .on('testserver', server => {
    if(!hitServerOnce) {
      console.log(`Server: ${server.sponsor} - ${server.name} - ${server.bestPing.toFixed(0)}ms`);
      hitServerOnce = true;
    }
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
    console.log('speed test hit an error', err);
  });
}

module.exports = function() {
  runSpeedTest();
}
