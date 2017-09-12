"use strict";

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var csp = require('./csp.core');

function pipelineInternal(n, to, from, close, taskFn) {
  if (n <= 0) {
    throw new Error('n must be positive');
  }

  var jobs = csp.chan(n);
  var results = csp.chan(n);

  for (var _ = 0; _ < n; _++) {
    csp.go(_regenerator2.default.mark(function _callee(taskFn, jobs, results) {
      var job;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!true) {
                _context.next = 9;
                break;
              }

              _context.next = 3;
              return csp.take(jobs);

            case 3:
              job = _context.sent;

              if (taskFn(job)) {
                _context.next = 7;
                break;
              }

              results.close();
              return _context.abrupt('break', 9);

            case 7:
              _context.next = 0;
              break;

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }), [taskFn, jobs, results]);
  }

  csp.go(_regenerator2.default.mark(function _callee2(jobs, from, results) {
    var v, p;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!true) {
              _context2.next = 16;
              break;
            }

            _context2.next = 3;
            return csp.take(from);

          case 3:
            v = _context2.sent;

            if (!(v === csp.CLOSED)) {
              _context2.next = 9;
              break;
            }

            jobs.close();
            return _context2.abrupt('break', 16);

          case 9:
            p = csp.chan(1);
            _context2.next = 12;
            return csp.put(jobs, [v, p]);

          case 12:
            _context2.next = 14;
            return csp.put(results, p);

          case 14:
            _context2.next = 0;
            break;

          case 16:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }), [jobs, from, results]);

  csp.go(_regenerator2.default.mark(function _callee3(results, close, to) {
    var p, res, v;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!true) {
              _context3.next = 26;
              break;
            }

            _context3.next = 3;
            return csp.take(results);

          case 3:
            p = _context3.sent;

            if (!(p === csp.CLOSED)) {
              _context3.next = 9;
              break;
            }

            if (close) {
              to.close();
            }
            return _context3.abrupt('break', 26);

          case 9:
            _context3.next = 11;
            return csp.take(p);

          case 11:
            res = _context3.sent;

          case 12:
            if (!true) {
              _context3.next = 24;
              break;
            }

            _context3.next = 15;
            return csp.take(res);

          case 15:
            v = _context3.sent;

            if (!(v !== csp.CLOSED)) {
              _context3.next = 21;
              break;
            }

            _context3.next = 19;
            return csp.put(to, v);

          case 19:
            _context3.next = 22;
            break;

          case 21:
            return _context3.abrupt('break', 24);

          case 22:
            _context3.next = 12;
            break;

          case 24:
            _context3.next = 0;
            break;

          case 26:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }), [results, close, to]);

  return to;
}

function pipeline(to, xf, from, keepOpen, exHandler) {

  function taskFn(job) {
    if (job === csp.CLOSED) {
      return null;
    } else {
      var v = job[0];
      var p = job[1];
      var res = csp.chan(1, xf, exHandler);

      csp.go(_regenerator2.default.mark(function _callee4(res, v) {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return csp.put(res, v);

              case 2:
                res.close();

              case 3:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }), [res, v]);

      csp.putAsync(p, res);

      return true;
    }
  }

  return pipelineInternal(1, to, from, !keepOpen, taskFn);
}

function pipelineAsync(n, to, af, from, keepOpen) {

  function taskFn(job) {
    if (job === csp.CLOSED) {
      return null;
    } else {
      var v = job[0];
      var p = job[1];
      var res = csp.chan(1);
      af(v, res);
      csp.putAsync(p, res);
      return true;
    }
  }

  return pipelineInternal(n, to, from, !keepOpen, taskFn);
}

module.exports = {
  pipeline: pipeline,
  pipelineAsync: pipelineAsync
};