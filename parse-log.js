var fs = require('fs');

var logResults;

var getLogResults = () => {
	if(!logResults || logResults.length < 1) {
		logResults = [];
		var logText = fs.readFileSync(__dirname + '/test-results.log', "UTF-8");
		var logEntries = logText.split("\n");
		var parsedEntry;
		for (var i = logEntries.length - 1; i >= 0; i--) {
			if(logEntries[i]) {
				parsedEntry = JSON.parse(logEntries[i]);
				logResults.push(parsedEntry);
			}
		}
	}
	return logResults;
};

module.exports = () => {
	return getLogResults();
}
