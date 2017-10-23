var cron = require("node-cron");
var runSpeedTest = require("./speedtest.js");
var moment = require("moment");

var cronstr = process.env.CRON_STRING;

if(!cron.validate(cronstr)) {
	cronstr = "0/15 * * * *";
}

cron.schedule(cronstr, () => {
	runSpeedTest();
});

console.log(`\ncron job started successfully ${moment().format('MMMM Do YYYY, h:mm:ss a')}\n\n`);
