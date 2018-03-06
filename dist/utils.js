"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOriginalErrorPosition = getOriginalErrorPosition;
exports.getErrorLineFromStack = getErrorLineFromStack;
exports.getErrorPositionFromStack = getErrorPositionFromStack;
exports.normalizeError = exports.serialize = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _util = _interopRequireDefault(require("util"));

var _bowser = _interopRequireDefault(require("bowser"));

var _sourceMap = require("source-map");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var serialize = function serialize(expr) {
  return _util.default.inspect(expr);
};
/**
 * Accounts for the iife header newline and 2 firefox specific newlines
 */


exports.serialize = serialize;
var ERROR_FIREFOX_OFFSET = 3;
/**
 * Accounts for iife header newline and 1 chrome specific newline
 */

var ERROR_CHROME_OFFSET = 2;
/**
 * awd
 */

var ERROR_NODE_OFFSET = 1;
/**
 * This shit is just crazy. I can't even explain it anymore.
 *
 * @param  {Error} err - An error object or mock error object
 * @param  {SourceMap} sourcemap - a sourcemap object
 * @param  {String} functionId - The name of the iife that executed the code.
 * @param  {String} env - The env the code was executed in
 * @return {Error}
 */

var normalizeError = function normalizeError(err, sourcemap, functionId, env) {
  // Handle case where a literal is thrown or if there is no stack to parse
  // or if babel threw an error while parsing, resuling in no sourcemap
  if (err == null || err.stack == null || sourcemap == null) {
    // It's possible for err to not be an actual error object, so we use the Error toString
    // method to create the message.
    var message = err != null && typeof err.message === 'string' ? Error.prototype.toString.call(err) : String(err);
    var _error = {
      stack: null,
      loc: err.loc || null,
      message: message,
      originalMessage: message
    };
    return _error;
  }

  var loc = err.loc ? err.loc : getOriginalErrorPosition(err, sourcemap, functionId, env);
  var error = {
    name: err.name,
    stack: err.stack,
    loc: loc,
    message: err.message,
    originalMessage: err.message
  };
  return error;
};

exports.normalizeError = normalizeError;

function getOriginalErrorPosition(err, sourcemap, functionId, env) {
  (0, _assert.default)(typeof sourcemap === 'string', 'sourcemap should be a string');
  (0, _assert.default)(typeof functionId === 'string', 'functionId should be a string');
  (0, _assert.default)(typeof env === 'string', 'env should be a string');
  var errorLineText = getErrorLineFromStack(err.stack, functionId, env);
  var errorPosition = getErrorPositionFromStack(errorLineText);
  var smc = new _sourceMap.SourceMapConsumer(sourcemap); // Firefox for some reason is 1 more than Chrome when doing eval, ffs

  var errorLineOffset = 0; // TODO: Potentially hardcode the line to 1, and remove comments from the AST output

  if (_bowser.default.firefox) {
    errorLineOffset = ERROR_FIREFOX_OFFSET;
  } else if (_bowser.default.chrome) {
    errorLineOffset = ERROR_CHROME_OFFSET;
  } else if (env === 'node') {
    errorLineOffset = ERROR_NODE_OFFSET;
  }

  if (errorPosition != null) {
    var pos = smc.originalPositionFor({
      line: errorPosition.line - errorLineOffset,
      // It's minus 1 because things
      column: errorPosition.column - 1
    }); // console.log(pos)

    return pos;
  }

  return null;
}
/**
 * Returns the line error for the function id regex
 * @param  {String} stack - an error stack
 * @param  {String} functionId - The name of the function, should be as unique as possible
 * @return {String|null}
 */


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