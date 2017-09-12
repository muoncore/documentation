consoleplus = require('../logging/console-plus.js');
var consoleio = require('../logging/consoleio.js');
var expect = require('expect.js');
var sinon = require('sinon');
var assert = require('assert');
var Logger = require('../logging/logger.js');

var logStub;
var logType;

process.env['LEVEL'] = 'trace';

describe('test tradingplaces authentication', function() {



    before(function(){
        logStub = sinon.stub(consoleio, "log", function(string) {
            //console.log('sinon stub consoleio.log() called=true ');
            process.stdout.write(string + "\n");
            var expectedString = '[' + logType + '] in logging-test.js';
            //console.log('expectedString=' + expectedString);
            var expectedOutput = string.indexOf(expectedString) > -1;
            if (logType != 'rainbow') assert(expectedOutput);
        });
    })

    afterEach(function(){
        if (logStub) logStub.reset();
    })

    after(function(){
        if (logStub) logStub.restore();
    })


    it('console plus prints using default path filter', function(done) {
        doLogging();
        expect(logStub.called).to.be(true);
        done();
    });


    it('console plus prints using override path filter', function(done) {
        process.env['TP_LOG_PATH'] = '/test';
        doLogging();
        expect(logStub.called).to.be(true);
        done();
    });

    it('console plus does not print using override path filter', function(done) {
        process.env['TP_LOG_PATH'] = '/nopath';
        doLogging();
        expect(logStub.called).to.be(false);
        done();
    });

    it('legacy log level as args method works too', function(done) {
        process.env['TP_LOG_PATH'] = '/test';
        doLogging();
        expect(logStub.called).to.be(true);
        done();
    });


});

function doLogging() {

    logType = 'rainbow';
    logger.rainbow('rainbow text');

    logType = 'error';
    logger.error('error text');

    logType = 'warn';
    logger.warn('warn text');

    logType = 'info';
    logger.info('info text');

    logType = 'debug';
    logger.debug('debug text');

    logType = 'trace';
    logger.trace('trace text');

}