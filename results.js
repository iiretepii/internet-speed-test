var fs = require('fs');
var logger = require('winston');
var getLogResults = require('./parse-log.js');
var moment = require("moment");

logger.level = process.env.LOGGING_LEVEL || 'info';

var percent

// added 25% buffer
var expectedDownload = (parseFloat(process.env.EXPECTED_DOWNLOAD) || 75) * (1 - 0.25);
var expectedUpload = (parseFloat(process.env.EXPECTED_UPLOAD) || 10) * (1 - 0.25);

var getAnalysisObjects = () => {
	var analysisObj = {};
	var results = getLogResults();
	for(var key in results[0].speeds) {
		analysisObj[key] = {
			times: [],
			speeds: [],
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

var linearRegression = (y,x) => {
	var lr = {};
	var n = y.length;
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var sum_yy = 0;

	for (var i = 0; i < y.length; i++) {
		sum_x += x[i];
		sum_y += y[i];
		sum_xy += (x[i]*y[i]);
		sum_xx += (x[i]*x[i]);
		sum_yy += (y[i]*y[i]);
	}

	lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
	lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
	lr['r2'] = Math.pow(
		(n*sum_xy - sum_x*sum_y)
		/
		Math.sqrt(
			(n*sum_xx-sum_x*sum_x)
			*
			(n*sum_yy-sum_y*sum_y)
		),
		2
	);

	return lr;
}

var feedAnalysisObj = (key, analysisRow, result, timestamp) => {
	analysisRow.speeds.push(result);
	analysisRow.times.push(getTimeNumber(timestamp));
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

var firstTime;
var minTime;
var maxTime;

var getTimeNumber = (dateTime) => {
	if(minTime == undefined || dateTime < minTime) {
		minTime = dateTime+'';
		logger.debug(`setting minTime ${formatDateTime(minTime)}`);
	}
	if(maxTime == undefined || dateTime > maxTime) {
		maxTime = dateTime+'';
		logger.debug(`setting maxTime ${formatDateTime(maxTime)}`);
	}
	var time = moment(dateTime).unix() / 60;
	if(!firstTime) {
		firstTime = time + 0;
	}
	time = firstTime - time;
	return time+0;
}

var getDuration = (timeUnit) => {
	return moment(maxTime).diff(moment(minTime),timeUnit);
}

var getTestDuration = () => {
	var durationUnits = ['days','hours','minutes','seconds'];
	var duration;
	var durationObj = {
		time: 0,
		unit: 'days'
	};
	for (var i = 0; i < durationUnits.length; i++) {
		duration = getDuration(durationUnits[i]);
		logger.debug(`duration ${duration} ${durationUnits[i]}`)
		if(duration > 0) {
			durationObj.time = duration;
			durationObj.unit = durationUnits[i];
			break;
		}
	}
	return durationObj;
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
	var logArray;
	var divider = '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~';
	var testDuration = getTestDuration();
	var resultsDebugArray = [
		'final results:',
		`\n${divider}\nTested ${numberOfTests} times over ${testDuration.time} ${testDuration.unit}\n${divider}`
	];
	var lr;
	for(var key in analysisObj) {
		lr = linearRegression(analysisObj[key].times,analysisObj[key].speeds);
		logArray = [
			`${key.toUpperCase()}`,
			`avg: ${getAvg(analysisObj[key])} Mb/s`,
			`min: ${analysisObj[key].min.toFixed(2)} Mb/s (${formatDateTime(analysisObj[key].maxDate)})`,
			`max: ${analysisObj[key].max.toFixed(2)} Mb/s (${formatDateTime(analysisObj[key].minDate)})`,
			`slope: ${lr.slope.toFixed(4)}`,
			`r2: ${lr.r2.toFixed(5)}`
		];
		if(key === 'download') {
			logArray.push(`# times download below expected: ${analysisObj[key].downloadUnder}`);
		} else if(key === 'upload') {
			logArray.push(`# times upload below expected: ${analysisObj[key].uploadUnder}`);
		}
		resultsDebugArray.push(logArray.join('\n'));
	}
	logArray = null;
	logger.log('info',`${resultsDebugArray.join('\n\n')}\n\n${divider}`);
}

getAnalysis();
