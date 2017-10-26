var fs = require('fs');
var logger = require('./logging-service');

var logResults;

var getLogResults = () => {
	if(!logResults || logResults.length < 1) {
		logResults = [];
		logger.silly(`test results log location: ${__dirname}/test-results.log`);
		var logText = fs.readFileSync(`${__dirname}/test-results.log`, "UTF-8");
		var logEntries = logText.split("\n");
		logger.verbose(`Number of log entries to parse: ${logEntries.length}`);
		var parsedEntry;
		var startTime = new Date().getMilliseconds();
		for (var i = logEntries.length - 1; i >= 0; i--) {
			if(logEntries[i]) {
				logResults.push(JSON.parse(logEntries[i]));
			}
		}
		logger.verbose(`it took ${(new Date()).getMilliseconds() - startTime}ms to parse ${logResults.length} log entries`);
	} else {
		logger.silly('log entries already parsed');
	}
	return logResults;
};

module.exports = () => {
	return getLogResults();
}
