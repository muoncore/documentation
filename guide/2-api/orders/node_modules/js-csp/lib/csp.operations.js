"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = [mapcat].map(_regenerator2.default.mark);

var Box = require("./impl/channels").Box;

var csp = require("./csp.core"),
    go = csp.go,
    take = csp.take,
    put = csp.put,
    takeAsync = csp.takeAsync,
    putAsync = csp.putAsync,
    alts = csp.alts,
    chan = csp.chan,
    CLOSED = csp.CLOSED;

function mapFrom(f, ch) {
  return {
    is_closed: function is_closed() {
      return ch.is_closed();
    },
    close: function close() {
      ch.close();
    },
    _put: function _put(value, handler) {
      return ch._put(value, handler);
    },
    _take: function _take(handler) {
      var result = ch._take({
        is_active: function is_active() {
          return handler.is_active();
        },
        commit: function commit() {
          var take_cb = handler.commit();
          return function (value) {
            return take_cb(value === CLOSED ? CLOSED : f(value));
          };
        }
      });
      if (result) {
        var value = result.value;
        return new Box(value === CLOSED ? CLOSED : f(value));
      } else {
        return null;
      }
    }
  };
}

function mapInto(f, ch) {
  return {
    is_closed: function is_closed() {
      return ch.is_closed();
    },
    close: function close() {
      ch.close();
    },
    _put: function _put(value, handler) {
      return ch._put(f(value), handler);
    },
    _take: function _take(handler) {
      return ch._take(handler);
    }
  };
}

function filterFrom(p, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(_regenerator2.default.mark(function _callee() {
    var value;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!true) {
              _context.next = 12;
              break;
            }

            _context.next = 3;
            return take(ch);

          case 3:
            value = _context.sent;

            if (!(value === CLOSED)) {
              _context.next = 7;
              break;
            }

            out.close();
            return _context.abrupt("break", 12);

          case 7:
            if (!p(value)) {
              _context.next = 10;
              break;
            }

            _context.next = 10;
            return put(out, value);

          case 10:
            _context.next = 0;
            break;

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return out;
}

function filterInto(p, ch) {
  return {
    is_closed: function is_closed() {
      return ch.is_closed();
    },
    close: function close() {
      ch.close();
    },
    _put: function _put(value, handler) {
      if (p(value)) {
        return ch._put(value, handler);
      } else {
        return new Box(!ch.is_closed());
      }
    },
    _take: function _take(handler) {
      return ch._take(handler);
    }
  };
}

function removeFrom(p, ch) {
  return filterFrom(function (value) {
    return !p(value);
  }, ch);
}

function removeInto(p, ch) {
  return filterInto(function (value) {
    return !p(value);
  }, ch);
}

function mapcat(f, src, dst) {
  var value, seq, length, i;
  return _regenerator2.default.wrap(function mapcat$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!true) {
            _context2.next = 22;
            break;
          }

          _context2.next = 3;
          return take(src);

        case 3:
          value = _context2.sent;

          if (!(value === CLOSED)) {
            _context2.next = 9;
            break;
          }

          dst.close();
          return _context2.abrupt("break", 22);

        case 9:
          seq = f(value);
          length = seq.length;
          i = 0;

        case 12:
          if (!(i < length)) {
            _context2.next = 18;
            break;
          }

          _context2.next = 15;
          return put(dst, seq[i]);

        case 15:
          i++;
          _context2.next = 12;
          break;

        case 18:
          if (!dst.is_closed()) {
            _context2.next = 20;
            break;
          }

          return _context2.abrupt("break", 22);

        case 20:
          _context2.next = 0;
          break;

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked[0], this);
}

function mapcatFrom(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(mapcat, [f, ch, out]);
  return out;
}

function mapcatInto(f, ch, bufferOrN) {
  var src = chan(bufferOrN);
  go(mapcat, [f, src, ch]);
  return src;
}

function pipe(src, dst, keepOpen) {
  go(_regenerator2.default.mark(function _callee2() {
    var value;
    return _regenerator2.default.wrap(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!true) {
              _context3.next = 13;
              break;
            }

            _context3.next = 3;
            return take(src);

          case 3:
            value = _context3.sent;

            if (!(value === CLOSED)) {
              _context3.next = 7;
              break;
            }

            if (!keepOpen) {
              dst.close();
            }
            return _context3.abrupt("break", 13);

          case 7:
            _context3.next = 9;
            return put(dst, value);

          case 9:
            if (_context3.sent) {
              _context3.next = 11;
              break;
            }

            return _context3.abrupt("break", 13);

          case 11:
            _context3.next = 0;
            break;

          case 13:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee2, this);
  }));
  return dst;
}

function split(p, ch, trueBufferOrN, falseBufferOrN) {
  var tch = chan(trueBufferOrN);
  var fch = chan(falseBufferOrN);
  go(_regenerator2.default.mark(function _callee3() {
    var value;
    return _regenerator2.default.wrap(function _callee3$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!true) {
              _context4.next = 12;
              break;
            }

            _context4.next = 3;
            return take(ch);

          case 3:
            value = _context4.sent;

            if (!(value === CLOSED)) {
              _context4.next = 8;
              break;
            }

            tch.close();
            fch.close();
            return _context4.abrupt("break", 12);

          case 8:
            _context4.next = 10;
            return put(p(value) ? tch : fch, value);

          case 10:
            _context4.next = 0;
            break;

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee3, this);
  }));
  return [tch, fch];
}

function reduce(f, init, ch) {
  return go(_regenerator2.default.mark(function _callee4() {
    var result, value;
    return _regenerator2.default.wrap(function _callee4$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            result = init;

          case 1:
            if (!true) {
              _context5.next = 12;
              break;
            }

            _context5.next = 4;
            return take(ch);

          case 4:
            value = _context5.sent;

            if (!(value === CLOSED)) {
              _context5.next = 9;
              break;
            }

            return _context5.abrupt("return", result);

          case 9:
            result = f(result, value);

          case 10:
            _context5.next = 1;
            break;

          case 12:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee4, this);
  }), [], true);
}

function onto(ch, coll, keepOpen) {
  return go(_regenerator2.default.mark(function _callee5() {
    var length, i;
    return _regenerator2.default.wrap(function _callee5$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            length = coll.length;
            // FIX: Should be a generic looping interface (for...in?)

            i = 0;

          case 2:
            if (!(i < length)) {
              _context6.next = 8;
              break;
            }

            _context6.next = 5;
            return put(ch, coll[i]);

          case 5:
            i++;
            _context6.next = 2;
            break;

          case 8:
            if (!keepOpen) {
              ch.close();
            }

          case 9:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee5, this);
  }));
}

// TODO: Bounded?
function fromColl(coll) {
  var ch = chan(coll.length);
  onto(ch, coll);
  return ch;
}

function map(f, chs, bufferOrN) {
  var out = chan(bufferOrN);
  var length = chs.length;
  // Array holding 1 round of values
  var values = new Array(length);
  // TODO: Not sure why we need a size-1 buffer here
  var dchan = chan(1);
  // How many more items this round
  var dcount;
  // put callbacks for each channel
  var dcallbacks = new Array(length);
  for (var i = 0; i < length; i++) {
    dcallbacks[i] = function (i) {
      return function (value) {
        values[i] = value;
        dcount--;
        if (dcount === 0) {
          putAsync(dchan, values.slice(0));
        }
      };
    }(i);
  }
  go(_regenerator2.default.mark(function _callee6() {
    var i, values;
    return _regenerator2.default.wrap(function _callee6$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!true) {
              _context7.next = 18;
              break;
            }

            dcount = length;
            // We could just launch n goroutines here, but for effciency we
            // don't
            for (i = 0; i < length; i++) {
              try {
                takeAsync(chs[i], dcallbacks[i]);
              } catch (e) {
                // FIX: Hmm why catching here?
                dcount--;
              }
            }
            _context7.next = 5;
            return take(dchan);

          case 5:
            values = _context7.sent;
            i = 0;

          case 7:
            if (!(i < length)) {
              _context7.next = 14;
              break;
            }

            if (!(values[i] === CLOSED)) {
              _context7.next = 11;
              break;
            }

            out.close();
            return _context7.abrupt("return");

          case 11:
            i++;
            _context7.next = 7;
            break;

          case 14:
            _context7.next = 16;
            return put(out, f.apply(null, values));

          case 16:
            _context7.next = 0;
            break;

          case 18:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee6, this);
  }));
  return out;
}

function merge(chs, bufferOrN) {
  var out = chan(bufferOrN);
  var actives = chs.slice(0);
  go(_regenerator2.default.mark(function _callee7() {
    var r, value, i;
    return _regenerator2.default.wrap(function _callee7$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            if (!true) {
              _context8.next = 15;
              break;
            }

            if (!(actives.length === 0)) {
              _context8.next = 3;
              break;
            }

            return _context8.abrupt("break", 15);

          case 3:
            _context8.next = 5;
            return alts(actives);

          case 5:
            r = _context8.sent;
            value = r.value;

            if (!(value === CLOSED)) {
              _context8.next = 11;
              break;
            }

            // Remove closed channel
            i = actives.indexOf(r.channel);

            actives.splice(i, 1);
            return _context8.abrupt("continue", 0);

          case 11:
            _context8.next = 13;
            return put(out, value);

          case 13:
            _context8.next = 0;
            break;

          case 15:
            out.close();

          case 16:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee7, this);
  }));
  return out;
}

function into(coll, ch) {
  var result = coll.slice(0);
  return reduce(function (result, item) {
    result.push(item);
    return result;
  }, result, ch);
}

function takeN(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(_regenerator2.default.mark(function _callee8() {
    var i, value;
    return _regenerator2.default.wrap(function _callee8$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            i = 0;

          case 1:
            if (!(i < n)) {
              _context9.next = 12;
              break;
            }

            _context9.next = 4;
            return take(ch);

          case 4:
            value = _context9.sent;

            if (!(value === CLOSED)) {
              _context9.next = 7;
              break;
            }

            return _context9.abrupt("break", 12);

          case 7:
            _context9.next = 9;
            return put(out, value);

          case 9:
            i++;
            _context9.next = 1;
            break;

          case 12:
            out.close();

          case 13:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee8, this);
  }));
  return out;
}

var NOTHING = {};

function unique(ch, bufferOrN) {
  var out = chan(bufferOrN);
  var last = NOTHING;
  go(_regenerator2.default.mark(function _callee9() {
    var value;
    return _regenerator2.default.wrap(function _callee9$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            if (!true) {
              _context10.next = 13;
              break;
            }

            _context10.next = 3;
            return take(ch);

          case 3:
            value = _context10.sent;

            if (!(value === CLOSED)) {
              _context10.next = 6;
              break;
            }

            return _context10.abrupt("break", 13);

          case 6:
            if (!(value === last)) {
              _context10.next = 8;
              break;
            }

            return _context10.abrupt("continue", 0);

          case 8:
            last = value;
            _context10.next = 11;
            return put(out, value);

          case 11:
            _context10.next = 0;
            break;

          case 13:
            out.close();

          case 14:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee9, this);
  }));
  return out;
}

function partitionBy(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  var part = [];
  var last = NOTHING;
  go(_regenerator2.default.mark(function _callee10() {
    var value, newItem;
    return _regenerator2.default.wrap(function _callee10$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            if (!true) {
              _context11.next = 23;
              break;
            }

            _context11.next = 3;
            return take(ch);

          case 3:
            value = _context11.sent;

            if (!(value === CLOSED)) {
              _context11.next = 12;
              break;
            }

            if (!(part.length > 0)) {
              _context11.next = 8;
              break;
            }

            _context11.next = 8;
            return put(out, part);

          case 8:
            out.close();
            return _context11.abrupt("break", 23);

          case 12:
            newItem = f(value);

            if (!(newItem === last || last === NOTHING)) {
              _context11.next = 17;
              break;
            }

            part.push(value);
            _context11.next = 20;
            break;

          case 17:
            _context11.next = 19;
            return put(out, part);

          case 19:
            part = [value];

          case 20:
            last = newItem;

          case 21:
            _context11.next = 0;
            break;

          case 23:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee10, this);
  }));
  return out;
}

function partition(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(_regenerator2.default.mark(function _callee11() {
    var part, i, value;
    return _regenerator2.default.wrap(function _callee11$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            if (!true) {
              _context12.next = 21;
              break;
            }

            part = new Array(n);
            i = 0;

          case 3:
            if (!(i < n)) {
              _context12.next = 17;
              break;
            }

            _context12.next = 6;
            return take(ch);

          case 6:
            value = _context12.sent;

            if (!(value === CLOSED)) {
              _context12.next = 13;
              break;
            }

            if (!(i > 0)) {
              _context12.next = 11;
              break;
            }

            _context12.next = 11;
            return put(out, part.slice(0, i));

          case 11:
            out.close();
            return _context12.abrupt("return");

          case 13:
            part[i] = value;

          case 14:
            i++;
            _context12.next = 3;
            break;

          case 17:
            _context12.next = 19;
            return put(out, part);

          case 19:
            _context12.next = 0;
            break;

          case 21:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee11, this);
  }));
  return out;
}

// For channel identification
var genId = function () {
  var i = 0;
  return function () {
    i++;
    return "" + i;
  };
}();

var ID_ATTR = "__csp_channel_id";

// TODO: Do we need to check with hasOwnProperty?
function len(obj) {
  var count = 0;
  for (var p in obj) {
    count++;
  }
  return count;
}

function chanId(ch) {
  var id = ch[ID_ATTR];
  if (id === undefined) {
    id = ch[ID_ATTR] = genId();
  }
  return id;
}

var Mult = function Mult(ch) {
  this.taps = {};
  this.ch = ch;
};

var Tap = function Tap(channel, keepOpen) {
  this.channel = channel;
  this.keepOpen = keepOpen;
};

Mult.prototype.muxch = function () {
  return this.ch;
};

Mult.prototype.tap = function (ch, keepOpen) {
  var id = chanId(ch);
  this.taps[id] = new Tap(ch, keepOpen);
};

Mult.prototype.untap = function (ch) {
  delete this.taps[chanId(ch)];
};

Mult.prototype.untapAll = function () {
  this.taps = {};
};

function mult(ch) {
  var m = new Mult(ch);
  var dchan = chan(1);
  var dcount;
  function makeDoneCallback(tap) {
    return function (stillOpen) {
      dcount--;
      if (dcount === 0) {
        putAsync(dchan, true);
      }
      if (!stillOpen) {
        m.untap(tap.channel);
      }
    };
  }
  go(_regenerator2.default.mark(function _callee12() {
    var value, id, t, taps, initDcount;
    return _regenerator2.default.wrap(function _callee12$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            if (!true) {
              _context13.next = 17;
              break;
            }

            _context13.next = 3;
            return take(ch);

          case 3:
            value = _context13.sent;
            taps = m.taps;

            if (!(value === CLOSED)) {
              _context13.next = 9;
              break;
            }

            for (id in taps) {
              t = taps[id];
              if (!t.keepOpen) {
                t.channel.close();
              }
            }
            // TODO: Is this necessary?
            m.untapAll();
            return _context13.abrupt("break", 17);

          case 9:
            dcount = len(taps);
            // XXX: This is because putAsync can actually call back
            // immediately. Fix that
            initDcount = dcount;
            // Put value on tapping channels...

            for (id in taps) {
              t = taps[id];
              putAsync(t.channel, value, makeDoneCallback(t));
            }
            // ... waiting for all puts to complete

            if (!(initDcount > 0)) {
              _context13.next = 15;
              break;
            }

            _context13.next = 15;
            return take(dchan);

          case 15:
            _context13.next = 0;
            break;

          case 17:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee12, this);
  }));
  return m;
}

mult.tap = function tap(m, ch, keepOpen) {
  m.tap(ch, keepOpen);
  return ch;
};

mult.untap = function untap(m, ch) {
  m.untap(ch);
};

mult.untapAll = function untapAll(m) {
  m.untapAll();
};

var Mix = function Mix(ch) {
  this.ch = ch;
  this.stateMap = {};
  this.change = chan();
  this.soloMode = mix.MUTE;
};

Mix.prototype._changed = function () {
  putAsync(this.change, true);
};

Mix.prototype._getAllState = function () {
  var allState = {};
  var stateMap = this.stateMap;
  var solos = [];
  var mutes = [];
  var pauses = [];
  var reads;
  for (var id in stateMap) {
    var chanData = stateMap[id];
    var state = chanData.state;
    var channel = chanData.channel;
    if (state[mix.SOLO]) {
      solos.push(channel);
    }
    // TODO
    if (state[mix.MUTE]) {
      mutes.push(channel);
    }
    if (state[mix.PAUSE]) {
      pauses.push(channel);
    }
  }
  var i, n;
  if (this.soloMode === mix.PAUSE && solos.length > 0) {
    n = solos.length;
    reads = new Array(n + 1);
    for (i = 0; i < n; i++) {
      reads[i] = solos[i];
    }
    reads[n] = this.change;
  } else {
    reads = [];
    for (id in stateMap) {
      chanData = stateMap[id];
      channel = chanData.channel;
      if (pauses.indexOf(channel) < 0) {
        reads.push(channel);
      }
    }
    reads.push(this.change);
  }

  return {
    solos: solos,
    mutes: mutes,
    reads: reads
  };
};

Mix.prototype.admix = function (ch) {
  this.stateMap[chanId(ch)] = {
    channel: ch,
    state: {}
  };
  this._changed();
};

Mix.prototype.unmix = function (ch) {
  delete this.stateMap[chanId(ch)];
  this._changed();
};

Mix.prototype.unmixAll = function () {
  this.stateMap = {};
  this._changed();
};

Mix.prototype.toggle = function (updateStateList) {
  // [[ch1, {}], [ch2, {solo: true}]];
  var length = updateStateList.length;
  for (var i = 0; i < length; i++) {
    var ch = updateStateList[i][0];
    var id = chanId(ch);
    var updateState = updateStateList[i][1];
    var chanData = this.stateMap[id];
    if (!chanData) {
      chanData = this.stateMap[id] = {
        channel: ch,
        state: {}
      };
    }
    for (var mode in updateState) {
      chanData.state[mode] = updateState[mode];
    }
  }
  this._changed();
};

Mix.prototype.setSoloMode = function (mode) {
  if (VALID_SOLO_MODES.indexOf(mode) < 0) {
    throw new Error("Mode must be one of: ", VALID_SOLO_MODES.join(", "));
  }
  this.soloMode = mode;
  this._changed();
};

function mix(out) {
  var m = new Mix(out);
  go(_regenerator2.default.mark(function _callee13() {
    var state, result, value, channel, solos, stillOpen;
    return _regenerator2.default.wrap(function _callee13$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            state = m._getAllState();

          case 1:
            if (!true) {
              _context14.next = 23;
              break;
            }

            _context14.next = 4;
            return alts(state.reads);

          case 4:
            result = _context14.sent;
            value = result.value;
            channel = result.channel;

            if (!(value === CLOSED)) {
              _context14.next = 11;
              break;
            }

            delete m.stateMap[chanId(channel)];
            state = m._getAllState();
            return _context14.abrupt("continue", 1);

          case 11:
            if (!(channel === m.change)) {
              _context14.next = 14;
              break;
            }

            state = m._getAllState();
            return _context14.abrupt("continue", 1);

          case 14:
            solos = state.solos;

            if (!(solos.indexOf(channel) > -1 || solos.length === 0 && !(state.mutes.indexOf(channel) > -1))) {
              _context14.next = 21;
              break;
            }

            _context14.next = 18;
            return put(out, value);

          case 18:
            stillOpen = _context14.sent;

            if (stillOpen) {
              _context14.next = 21;
              break;
            }

            return _context14.abrupt("break", 23);

          case 21:
            _context14.next = 1;
            break;

          case 23:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee13, this);
  }));
  return m;
}

mix.MUTE = "mute";
mix.PAUSE = "pause";
mix.SOLO = "solo";
var VALID_SOLO_MODES = [mix.MUTE, mix.PAUSE];

mix.add = function admix(m, ch) {
  m.admix(ch);
};

mix.remove = function unmix(m, ch) {
  m.unmix(ch);
};

mix.removeAll = function unmixAll(m) {
  m.unmixAll();
};

mix.toggle = function toggle(m, updateStateList) {
  m.toggle(updateStateList);
};

mix.setSoloMode = function setSoloMode(m, mode) {
  m.setSoloMode(mode);
};

function constantlyNull() {
  return null;
}

var Pub = function Pub(ch, topicFn, bufferFn) {
  this.ch = ch;
  this.topicFn = topicFn;
  this.bufferFn = bufferFn;
  this.mults = {};
};

Pub.prototype._ensureMult = function (topic) {
  var m = this.mults[topic];
  var bufferFn = this.bufferFn;
  if (!m) {
    m = this.mults[topic] = mult(chan(bufferFn(topic)));
  }
  return m;
};

Pub.prototype.sub = function (topic, ch, keepOpen) {
  var m = this._ensureMult(topic);
  return mult.tap(m, ch, keepOpen);
};

Pub.prototype.unsub = function (topic, ch) {
  var m = this.mults[topic];
  if (m) {
    mult.untap(m, ch);
  }
};

Pub.prototype.unsubAll = function (topic) {
  if (topic === undefined) {
    this.mults = {};
  } else {
    delete this.mults[topic];
  }
};

function pub(ch, topicFn, bufferFn) {
  bufferFn = bufferFn || constantlyNull;
  var p = new Pub(ch, topicFn, bufferFn);
  go(_regenerator2.default.mark(function _callee14() {
    var value, mults, topic, m, stillOpen;
    return _regenerator2.default.wrap(function _callee14$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            if (!true) {
              _context15.next = 17;
              break;
            }

            _context15.next = 3;
            return take(ch);

          case 3:
            value = _context15.sent;
            mults = p.mults;

            if (!(value === CLOSED)) {
              _context15.next = 8;
              break;
            }

            for (topic in mults) {
              mults[topic].muxch().close();
            }
            return _context15.abrupt("break", 17);

          case 8:
            // TODO: Somehow ensure/document that this must return a string
            // (otherwise use proper (hash)maps)
            topic = topicFn(value);
            m = mults[topic];

            if (!m) {
              _context15.next = 15;
              break;
            }

            _context15.next = 13;
            return put(m.muxch(), value);

          case 13:
            stillOpen = _context15.sent;

            if (!stillOpen) {
              delete mults[topic];
            }

          case 15:
            _context15.next = 0;
            break;

          case 17:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee14, this);
  }));
  return p;
}

pub.sub = function sub(p, topic, ch, keepOpen) {
  return p.sub(topic, ch, keepOpen);
};

pub.unsub = function unsub(p, topic, ch) {
  p.unsub(topic, ch);
};

pub.unsubAll = function unsubAll(p, topic) {
  p.unsubAll(topic);
};

module.exports = {
  mapFrom: mapFrom,
  mapInto: mapInto,
  filterFrom: filterFrom,
  filterInto: filterInto,
  removeFrom: removeFrom,
  removeInto: removeInto,
  mapcatFrom: mapcatFrom,
  mapcatInto: mapcatInto,

  pipe: pipe,
  split: split,
  reduce: reduce,
  onto: onto,
  fromColl: fromColl,

  map: map,
  merge: merge,
  into: into,
  take: takeN,
  unique: unique,
  partition: partition,
  partitionBy: partitionBy,

  mult: mult,
  mix: mix,
  pub: pub
};

// Possible "fluid" interfaces:

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc],
//   [into, []]
// )

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc, _],
//   [into, [], _]
// )

// wrap()
//   .fromColl([1, 2, 3, 4])
//   .mapFrom(inc)
//   .into([])
//   .unwrap();