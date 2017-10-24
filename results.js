var fs = require('fs');
var logger = require('winston');
var getLogResults = require('./parse-log.js');
var moment = require("moment");

var expectedDownload = parseFloat(process.env.EXPECTED_DOWNLOAD) || 75;
var expectedUpload = parseFloat(process.env.EXPECTED_UPLOAD) || 10;

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
			downloadUnder: 0,
			uploadUnder: 0,
			num: results.length + 0
		}
	}
	return analysisObj;
};

var feedAnalysisObj = (key, analysisRow, result, timestamp) => {
	if(key.indexOf('original') > -1) {
		result = result * 8 / 1000000;
	} else if(key === "download") {
		if(result < expectedDownload) {
			analysisRow.downloadUnder++;
		}
	} else if(key === "upload") {
		if(result < expectedUpload) {
			analysisRow.uploadUnder++;
		}
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

var formatDateTime = (dateTime) => {
	return moment(dateTime).format('MMMM Do YYYY, h:mm:ss a') || '';
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
	let logStr;
	for(var key in analysisObj) {
		logStr = `\n${key.toUpperCase()}`
			+ `\navg: ${getAvg(analysisObj[key])} Mb/s`
			+ `\nmin: ${analysisObj[key].min.toFixed(2)} Mb/s (${formatDateTime(analysisObj[key].maxDate)})` 
			+ `\nmax: ${analysisObj[key].max.toFixed(2)} Mb/s (${formatDateTime(analysisObj[key].minDate)})\n`;
		if(key === 'download') {
			logStr += `\n# times download under: ${analysisObj[key].downloadUnder}`;
		} else if(key === 'upload') {
			logStr += '\n# times uploadUnder: ${analysisObj[key].uploadUnder}'
		}
		logger.log('info', logStr);
	}
}

getAnalysis();
