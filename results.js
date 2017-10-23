var fs = require('fs');
var logger = require('winston');
var getLogResults = require('./parseLog.js');

var getAnalysisObjects = () => {
	var analysisObj = {};
	var results = getLogResults();
	for(var key in results[0].speeds) {
		analysisObj[key] = {
			min: null, 
			minDate: '', 
			max: null, 
			maxDate: '', 
			total: 0, 
			num: results.length + 0
		}
	}
	return analysisObj;
};

var feedAnalysisObj = (key, analysisRow, result, timestamp) => {
	if(key.indexOf('original') > -1) {
		result = result * 8 / 1000000;
	}
	if(analysisRow.min === null || result < analysisRow.min) {
		analysisRow.min = result+0;
		analysisRow.minDate = timestamp;
	}
	if(analysisRow.max === null || result > analysisRow.max) {
		analysisRow.max = result+0;
		analysisRow.maxDate = timestamp;
	}
	analysisRow.total = result + analysisRow.total;
}

var getAvg = (analysisObjRow) => {
	return (analysisObjRow.total / analysisObjRow.num).toFixed(2);
}

var getAnalysis = () => {
	var results = getLogResults();
	var analysisObj = getAnalysisObjects();
	var numberOfTests = results.length;
	for (var i = numberOfTests - 1; i >= 0; i--) {
		for(var key in analysisObj) {
			feedAnalysisObj(
				key,
				analysisObj[key], 
				results[i].speeds[key], 
				results[i].timestamp
			);

		}
	}
	for(var key in analysisObj) {
		logger.log('info',`${key.toUpperCase()}\navg: ${getAvg(analysisObj[key])} Mb/s\n${analysisObj[key].min.toFixed(2)} Mb/s -> ${analysisObj[key].max.toFixed(2)} Mb/s\n`);
	}
}

getAnalysis();
