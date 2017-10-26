var cron = require("node-cron");
var runSpeedTest = require("./speedtest.js");
var moment = require("moment");
var logger = require("./logging-service").logger;
var cronstr = "0,15,30,45 * * * *";

cron.schedule(cronstr, () => {
  runSpeedTest();
});

logger.info(`cron job started successfully (${cronstr}) ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
