"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getErrorLineFromStack = getErrorLineFromStack;
exports.getErrorPositionFromStack = exports.getOriginalErrorPosition = exports.normalizeError = exports.serialize = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _util = _interopRequireDefault(require("util"));

var _sourceMap = require("source-map");

var serialize = function serialize(expr) {
  return _util.default.inspect(expr);
};
/**
 * This shit is just crazy. I can't even explain it anymore.
 *
 * @param err - An error object or mock error object
 * @param sourcemap - a sourcemap object
 * @param functionId - The name of the iife that executed the code.
 */


exports.serialize = serialize;

var normalizeError =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(err, sourcemap, functionId) {
    var name, originalLoc, message, _error, loc, error;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            name = err ? err.name : null;
            originalLoc = err ? err.loc : null; // Handle case where a literal is thrown or if there is no stack to parse
            // or if babel threw an error while parsing, resuling in no sourcemap

            if (!(functionId == null || err == null || err.stack == null || sourcemap == null)) {
              _context.next = 6;
              break;
            }

            // It's possible for err to not be an actual error object, so we use the Error toString
            // method to create the message.
            message = err != null && typeof err.message === 'string' ? Error.prototype.toString.call(err) : String(err);
            _error = {
              name: name,
              stack: null,
              loc: originalLoc,
              message: message,
              originalMessage: message
            };
            return _context.abrupt("return", _error);

          case 6:
            if (!err.loc) {
              _context.next = 10;
              break;
            }

            _context.t0 = err.loc;
            _context.next = 13;
            break;

          case 10:
            _context.next = 12;
            return getOriginalErrorPosition(err, sourcemap, functionId);

          case 12:
            _context.t0 = _context.sent;

          case 13:
            loc = _context.t0;
            error = {
              name: name,
              stack: err.stack,
              loc: loc,
              message: err.message,
              originalMessage: err.message
            };
            return _context.abrupt("return", error);

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function normalizeError(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
/**
 *
 * @param err - The runtime error object
 * @param sourcemap - The sourcemap from the transform
 * @param functionId - The id of the wrapped function used to execute the code
 */


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
                column: +errorPosition.column - 1
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

  return function getOriginalErrorPosition(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * Returns the line error for the function id regex
 * @param stack - an error stack
 * @param functionId - The name of the function, should be as unique as possible
 */


exports.getOriginalErrorPosition = getOriginalErrorPosition;

function getErrorLineFromStack(stack, functionId) {
  if (stack == null) {
    return null;
  }

  var lines = stack.split(/\r\n|[\r\n]/);
  var regExp = new RegExp(functionId);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (regExp.test(line)) {
      return line;
    }
  }

  return null;
}

var getErrorPositionFromStack = function getErrorPositionFromStack(lineText) {
  if (typeof lineText !== 'string') {
    return {
      line: null,
      column: null
    };
  }

  var match = lineText.match(/(\d+):(\d+)\)?$/);

  if (match == null || !(match.hasOwnProperty(1) && match.hasOwnProperty(2))) {
    return {
      line: null,
      column: null
    };
  }

  var line = Number(match[1]);
  var column = Number(match[2]);
  return {
    line: line,
    column: column
  };
};

exports.getErrorPositionFromStack = getErrorPositionFromStack;