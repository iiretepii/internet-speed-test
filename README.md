# internet-speed-test
Quick app to monitor internet speeds. It was written to monitor internet speeds at my apartment from a raspberry pi.

# running the app
There are only a few ways to run the app
1. Run one test `$ node test-speedtest.js`
2. Run cron job `$ node cron-job.js`
3. View results `$ node results.js`

# environment variables
* **EXPECTED_DOWNLOAD** - expected download speed in Mb/s
* **EXPECTED_UPLOAD** - expected upload speed in Mb/s
* **TEST_TYPE** - name the test that you're running
* **LOGGING_LEVEL** - winston logging level

# setting environment variables

## MacOSX/Linux
```
$ export EXPECTED_DOWNLOAD=1000
$ echo $EXPECTED_DOWNLOAD // -> 1000
```

## Windows
```
C:\internet-speed-test>set EXPECTED_DOWNLOAD
C:\internet-speed-test>echo %EXPECTED_DOWNLOAD%
```