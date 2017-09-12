
require('./date.js');

require("callsite");


//var levels = winston.config.cli.levels;

   var levels = {
     silly: 0,
     input: 1,
     verbose: 2,
     prompt: 3,
     debug: 4,
     info: 5,
     data: 6,
     help: 7,
     warn: 8,
     error: 9,
     trace: -1
    };

var Logger = function(newName, maxLevel, outputFile, stdout) {

    var logger = this;

    logger.name = newName;

    logger.log = function(level, msg, anything) {
        logger.logPlus(level, msg, anything);
    }

    logger.info = function(msg, anything) {
        logger.logPlus('info', msg, anything);
    }

    logger.warn = function(msg, anything) {
        logger.logPlus('warn', msg, anything);
    }

    logger.debug = function(msg, anything) {
        logger.logPlus('debug', msg, anything);
    }

    logger.trace = function(msg, anything) {
        logger.logPlus('trace', msg, anything);
    }

    logger.error = function(msg, anything) {
        logger.logPlus('error', msg, anything);
    }

    logger.rainbow = function(msg, anything) {
        logger.logPlus('rainbow', msg, anything);
    }

    if (typeof GLOBAL !== 'undefined') {
        setupForNode(logger, newName, maxLevel, outputFile, stdout)
        logger.debug("Configured logging for Node.js runtime");
    } else {
        setupForBrowser(logger, newName, maxLevel, outputFile, stdout);
        logger.debug("Configured logging for Browser runtime");
    }

    return this;
};

function setupForBrowser(logger, newName, maxLevel, outputFile, stdout) {
    logger.logPlus = function(level, msg, anything) {
        if(levels[level.toLowerCase()] >=
            levels[maxLevel.toLowerCase()]) {
            if(anything == undefined || anything == null) {
                console.log("[" + level.toUpperCase() + "] " + msg);
            } else {
                console.log("[" + level.toUpperCase() + "] " + msg + "|" + anything);
            }
        }
    }
    window.logger = logger;
}

function setupForNode(logger, newName, maxLevel, outputFile, stdout) {
    GLOBAL.logger = logger;

    var winston = require('winston');
    var consoleplus = require('./console-plus.js');
    var fs = require("fs");
    var util = require("util");
    var stackTrace = require('stack-trace');
    var colors = require('colors');

    var loggerTransports = [];
    var bConsolePlus = (stdout == "consoleplus");

    if(stdout == "winston") {
        loggerTransports.push(new winston.transports.Console({
            timestamp: function() {
                return new Date(Date.now()).format('yyyy-mm-dd HH:MM:ss,l');
            },
            formatter: function(options) {
                return options.timestamp() + ' ' +
                    '[' + newName + '] ' +
                    options.level.toUpperCase() + ': ' +
                    (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ?
                    ' ['+ JSON.stringify(options.meta) + ']' : '' );
            },
            level: maxLevel,
            handleExceptions: false
        }));
    }
    if(outputFile != undefined && outputFile != null) {
        loggerTransports.push(new winston.transports.File({
            // TODO: Add name to the file log JSON!
            level: maxLevel,
            filename: outputFile,
            handleExceptions: false
        }))
    }
    logger._logger = new winston.Logger({
        transports: loggerTransports
    });

    logger.logPlus = function(level, msg, anything) {
        if(levels[level.toLowerCase()] >=
            levels[maxLevel.toLowerCase()]) {
            if(anything == undefined || anything == null) {
                if(consoleplus) {
                    consoleplus[level](msg);
                }
                logger._logger.log(level, msg);
            } else {
                if(consoleplus) {
                    consoleplus[level](msg, anything);
                }
                logger._logger.log(level, msg, anything);
            }
        }
    }

    logger._logger.setLevels(levels);
}

var level = process.env.LEVEL ? process.env.LEVEL : 'info';

module.exports = Logger('muon', level, '/tmp/muon.log', true, "console-plus");
