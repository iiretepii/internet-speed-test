var cron = require("node-cron");
var runSpeedTest = require("./speedtest.js");

var cronstr = process.env.CRON_STRING;

if(!cron.validate(cronstr)) {
	cronstr = "0,30 * * * *";
}

cron.schedule(cronstr, () => {
	runSpeedTest();
});

console.log("\n~~~cron job successfully instantiated~~~\n\n");
