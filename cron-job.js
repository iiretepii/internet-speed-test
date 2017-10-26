var cron = require("node-cron");
var runSpeedTest = require("./speedtest.js");
var moment = require("moment");

var cronstr = "0,15,30,45 * * * *";

cron.schedule(cronstr, () => {
    runSpeedTest();
});

console.log(`\ncron job started successfully (${cronstr}) ${moment().format('MMMM Do YYYY, h:mm:ss a')}\n\n`);
