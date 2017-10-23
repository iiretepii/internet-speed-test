var cron = require("node-cron");
var runSpeedTest = require("./speedtest.js");

cron.schedule("0,30 * * * *", () => {
	runSpeedTest();
});