let fs = require('fs');

let logResults;

let getLogResults = () => {
	if(!logResults || logResults.length < 1) {
		logResults = [];
		let logText = fs.readFileSync(__dirname + '/test-results.log', "UTF-8");
		let logEntries = logText.split("\n");
		let parsedEntry;
		for (var i = 0; i < logEntries.length; i++) {
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
