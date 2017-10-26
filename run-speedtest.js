var runSpeedTest = require("./speedtest.js");
var logger = require("./logging-service").logger;

logger.info("Running one-off speedtest...");

runSpeedTest();