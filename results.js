var fs = require('fs');
var moment = require("moment");
var logger = require('./logging-service').logger;
var getLogResults = require('./parse-log');

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
    logger.silly(`setting minTime ${formatDateTime(minTime)}`);
  }
  if(maxTime == undefined || dateTime > maxTime) {
    maxTime = dateTime+'';
    logger.silly(`setting maxTime ${formatDateTime(maxTime)}`);
  }
  var time = moment(dateTime).unix() / 60;
  if(!firstTime) {
    firstTime = time + 0;
  }
  time = firstTime - time;
  return time+0;
}

var getDuration = () => {
  return moment.duration(moment(maxTime).diff(moment(minTime)));
}

var getTestDuration = () => {
  logger.debug(`min time: ${formatDateTime(minTime)}`);
  logger.debug(`max time: ${formatDateTime(maxTime)}`);
  var duration = getDuration();
  var days = parseInt(duration.asDays());
  var hours = parseInt(duration.asHours()) - days*24;
  var minutes = parseInt(duration.asMinutes()) - days*24*60 - hours*60;
  var seconds = parseInt(duration.asSeconds()) - days*24*60*60 - hours*60*60 - minutes*60;
  var durationArray = [];
  if(days > 0) durationArray.push(`${days} ${plural(days,'day')}`);
  if(hours > 0) durationArray.push(`${hours} ${plural(hours,'hour')}`);
  if(minutes > 0) durationArray.push(`${minutes} ${plural(minutes,'minute')}`);
  if(seconds > 0) durationArray.push(`${seconds} ${plural(seconds,'second')}`);
  return durationArray.join(', ');
}

var plural = (num, str) => {
  return num === 1 ? str : str + 's';
}

var divider;

var getDivider = (overviewStr) => {
  if(!divider) {
    var dividerArray = [];
    for (var i = overviewStr.length - 1; i >= 0; i--) {
      dividerArray.push('~');
    }
    divider = dividerArray.join('');
  }
  return divider;
}

var getPercentage = (thisMany,thatMany) => {
  return parseInt((thisMany / thatMany)*100) +'%';
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
  var overviewStr = `Tested ${numberOfTests} ${plural(numberOfTests,'time')} over ${getTestDuration()}`;
  getDivider(overviewStr);
  overviewStr = `${getDivider()}\n${overviewStr}\n${getDivider()}`;
  var resultsDebugArray = [
    'final results:',
    overviewStr
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
      logArray.push(`# times download below expected: ${analysisObj[key].downloadUnder} (${getPercentage(analysisObj[key].downloadUnder, numberOfTests)})`);
    } else if(key === 'upload') {
      logArray.push(`# times upload below expected: ${analysisObj[key].uploadUnder} (${getPercentage(analysisObj[key].uploadUnder, numberOfTests)})`);
    }
    resultsDebugArray.push(logArray.join('\n'));
  }
  logArray = null;
  logger.log('info',`${resultsDebugArray.join('\n\n')}\n\n${getDivider()}`);
}

module.exports = () => {
  getAnalysis();
}
