let cron = require("node-cron");
let runSpeedTest = require("./speedtest.js");

cron.schedule("0,30 * * * *", () => {
	runSpeedTest();
});