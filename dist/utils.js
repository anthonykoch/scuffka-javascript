"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getErrorLineFromStack = getErrorLineFromStack;
exports.getErrorPositionFromStack = exports.getOriginalErrorPosition = exports.normalizeError = exports.serialize = void 0;

var _isFinite = _interopRequireDefault(require("@babel/runtime/core-js/number/is-finite"));

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _util = _interopRequireDefault(require("util"));

var _sourceMap = require("source-map");

var serialize = function serialize(expr) {
  return _util.default.inspect(expr);
};
/**
 * This shit is just crazy. I can't even explain it anymore
 *
 * TODO: Split into three separate functions that:
 *       1. handle runtime errors with a sourcemap
 *       2. handle runtime errors without a sourcemap
 *       3. Handles transform errors
 *
 * @param err - An error object or mock error object
 * @param sourcemap - a sourcemap object
 * @param functionId - The name of the iife that executed the code.
 */


exports.serialize = serialize;

var normalizeError = function normalizeError(err, sourcemap, functionId) {
  var name = err ? err.name : null;
  var originalLoc = err ? err.loc : null; // Handle case where a literal is thrown or if there is no stack to parse
  // or if babel threw an error while parsing, resuling in no sourcemap

  if (functionId == null || err == null || err.stack == null || sourcemap == null) {
    // It's possible for err to not be an actual error object, so we use the Error toString
    // method to create the message.
    var message = err != null && typeof err.message === 'string' ? Error.prototype.toString.call(err) : String(err);
    var _error = {
      name: name,
      stack: null,
      loc: originalLoc,
      message: message,
      originalMessage: message
    };
    return _promise.default.resolve(_error);
  }

  var error = {
    name: name,
    stack: err.stack,
    loc: err.loc,
    message: err.message,
    originalMessage: err.message
  };

  if (err.loc != undefined) {
    return _promise.default.resolve(error);
  }

  return getOriginalErrorPosition(err, sourcemap, functionId).then(function (loc) {
    if ((0, _isFinite.default)(loc.line) && (0, _isFinite.default)(loc.column)) {
      error.loc = loc;
    }

    return error;
  });
};
/**
 *
 * @param err - The runtime error object
 * @param sourcemap - The sourcemap from the transform
 * @param functionId - The id of the wrapped function used to execute the code
 */


exports.normalizeError = normalizeError;

var getOriginalErrorPosition = function getOriginalErrorPosition(err, sourcemap, functionId) {
  var errorLineText = getErrorLineFromStack(err.stack, functionId);
  var errorPosition = getErrorPositionFromStack(errorLineText);

  if (errorPosition != null) {
    return _sourceMap.SourceMapConsumer.with(sourcemap, null, function (consumer) {
      var pos = consumer.originalPositionFor({
        line: 1,
        column: +errorPosition.column - 1
      });
      return pos;
    });
  }

  return _promise.default.resolve({
    line: null,
    column: null
  });
};
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