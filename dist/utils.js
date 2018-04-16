"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getErrorLineFromStack = getErrorLineFromStack;
exports.getErrorPositionFromStack = exports.getOriginalErrorPosition = exports.normalizeError = exports.serialize = void 0;

var _isNan = _interopRequireDefault(require("@babel/runtime/core-js/number/is-nan"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _assert = _interopRequireDefault(require("assert"));

var _util = _interopRequireDefault(require("util"));

var _sourceMap = require("source-map");

var _exec = require("./exec");

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
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(err, sourcemap, functionId, env) {
    var _message, _error, loc, error;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(err == null || err.stack == null || sourcemap == null)) {
              _context.next = 4;
              break;
            }

            // It's possible for err to not be an actual error object, so we use the Error toString
            // method to create the message.
            _message = err != null && typeof err.message === 'string' ? Error.prototype.toString.call(err) : String(err);
            _error = {
              stack: null,
              loc: err.loc || null,
              message: _message,
              originalMessage: _message
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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(err, sourcemap, functionId) {
    var errorLineText, errorPosition;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            errorLineText = getErrorLineFromStack(err.stack, functionId);
            errorPosition = getErrorPositionFromStack(errorLineText);

            if (!(errorPosition != null)) {
              _context2.next = 6;
              break;
            }

            _context2.next = 5;
            return _sourceMap.SourceMapConsumer.with(sourcemap, null, function (consumer) {
              var pos = consumer.originalPositionFor({
                line: 1,
                column: errorPosition.column - 1
              });
              return pos;
            });

          case 5:
            return _context2.abrupt("return", _context2.sent);

          case 6:
            return _context2.abrupt("return", null);

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getOriginalErrorPosition(_x5, _x6, _x7) {
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

function getErrorLineFromStack(stack, functionId) {
  var lines = stack.split(/\r\n|[\r\n]/);
  var regExp = new RegExp(functionId);

  for (var i = 0; i < lines.length; i++) {
    var _line = lines[i];

    if (regExp.test(_line)) {
      return _line;
    }
  }

  return null;
}

var getErrorPositionFromStack = function getErrorPositionFromStack(lineText) {
  var lineOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var columnOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (typeof lineText !== 'string') {
    return null;
  }

  var match = lineText.match(/(\d+):(\d+)\)?$/);

  if (match == null || !(match.hasOwnProperty(1) && match.hasOwnProperty(2))) {
    return null;
  }

  var line = Number(match[1]) + lineOffset;
  var column = Number(match[2]) + columnOffset;

  if ((0, _isNan.default)(line)) {
    return null;
  }

  return {
    line: line,
    column: column
  };
};

exports.getErrorPositionFromStack = getErrorPositionFromStack;