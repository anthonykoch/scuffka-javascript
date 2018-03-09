"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getErrorLineFromStack = getErrorLineFromStack;
exports.getErrorPositionFromStack = getErrorPositionFromStack;
exports.getOriginalErrorPosition = exports.normalizeError = exports.serialize = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _util = _interopRequireDefault(require("util"));

var _bowser = _interopRequireDefault(require("bowser"));

var _sourceMap = require("source-map");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

var serialize = function serialize(expr) {
  return _util.default.inspect(expr);
};
/**
 * This shit is just crazy. I can't even explain it anymore.
 *
 * @param  {Error} err - An error object or mock error object
 * @param  {SourceMap} sourcemap - a sourcemap object
 * @param  {String} functionId - The name of the iife that executed the code.
 * @param  {String} env - The env the code was executed in
 * @return {Error}
 */


exports.serialize = serialize;

var normalizeError =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(err, sourcemap, functionId, env) {
    var message, _error, loc, error;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(err == null || err.stack == null || sourcemap == null)) {
              _context.next = 4;
              break;
            }

            // It's possible for err to not be an actual error object, so we use the Error toString
            // method to create the message.
            message = err != null && typeof err.message === 'string' ? Error.prototype.toString.call(err) : String(err);
            _error = {
              stack: null,
              loc: err.loc || null,
              message: message,
              originalMessage: message
            };
            return _context.abrupt("return", _error);

          case 4:
            if (!err.loc) {
              _context.next = 8;
              break;
            }

            _context.t0 = err.loc;
            _context.next = 11;
            break;

          case 8:
            _context.next = 10;
            return getOriginalErrorPosition(err, sourcemap, functionId, env);

          case 10:
            _context.t0 = _context.sent;

          case 11:
            loc = _context.t0;
            error = {
              name: err.name,
              stack: err.stack,
              loc: loc,
              message: err.message,
              originalMessage: err.message
            };
            return _context.abrupt("return", error);

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function normalizeError(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

exports.normalizeError = normalizeError;

var getOriginalErrorPosition =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(err, sourcemap, functionId, env) {
    var errorLineText, errorPosition;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // assert(typeof sourcemap === 'string', 'sourcemap should be a string')
            (0, _assert.default)(typeof functionId === 'string', 'functionId should be a string');
            (0, _assert.default)(typeof env === 'string', 'env should be a string');
            errorLineText = getErrorLineFromStack(err.stack, functionId, env);
            errorPosition = getErrorPositionFromStack(errorLineText);

            if (!(errorPosition != null)) {
              _context2.next = 8;
              break;
            }

            _context2.next = 7;
            return _sourceMap.SourceMapConsumer.with(sourcemap, null, function (consumer) {
              var pos = consumer.originalPositionFor({
                line: 1,
                column: errorPosition.column - 1
              });
              return pos;
            });

          case 7:
            return _context2.abrupt("return", _context2.sent);

          case 8:
            return _context2.abrupt("return", null);

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getOriginalErrorPosition(_x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * Returns the line error for the function id regex
 * @param  {String} stack - an error stack
 * @param  {String} functionId - The name of the function, should be as unique as possible
 * @return {String|null}
 */


exports.getOriginalErrorPosition = getOriginalErrorPosition;

function getErrorLineFromStack(stack, functionId, env) {
  var lines = stack.split(/\r\n|[\r\n]/);
  var regExp = new RegExp(functionId);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]; // if (env === 'node' && /eval/.test(line) && /anonymous/.test(line))

    if (regExp.test(line)) {
      return line;
    }
  }

  return null;
}

function getErrorPositionFromStack(lineText) {
  var lineOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var columnOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (typeof lineText !== 'string') {
    return null;
  }

  var match = lineText.match(/(\d+):(\d+)\)?$/);

  if (match == null || !(match.hasOwnProperty(1) && match.hasOwnProperty(2))) {
    return null;
  }

  var line = Number(match[1]) - lineOffset;
  var column = Number(match[2]) - columnOffset;

  if (Number.isNaN(line)) {
    return null;
  }

  return {
    line: line,
    column: column
  };
}