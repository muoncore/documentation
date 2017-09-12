# sexylog
  node js colourful logging framework



## getting started

require sexylog in your nodejs app entry file (usually app.js) like so:

```
require('sexylog');
```

This makes the `logger` object available (yes, globally) anywhere in your code, like so:

```
(1) logger.trace("running logging test");
(2) logger.debug("running logging test");
(3) logger.info("running logging test");
(4) logger.warn("running logging test");
(5) logger.error("running logging test");
```

![alt text](https://github.com/fuzzy-logic/sexylog/raw/master/img/screenie1.png "Example Logging")


## Setting log level

currently sexylog is set via an environment variable named `LEVEL` at the command line.

NOTE: Logging levels are show in order of priority. If you set the variable to TRACE all log levels above this level will print out.
If you set the log level to WARN, only WARN and ERROR message will be printed, but nothing below these levels will print out.

Example:


```
export LEVEL=info
```

or

```
LEVEL=trace node app.js
```


## running tests

```
mocha test/logging-test.js
```
