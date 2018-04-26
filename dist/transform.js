"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var types = _interopRequireWildcard(require("@babel/types"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _core = require("@babel/core");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _utils = require("./utils");

var instrument = _interopRequireWildcard(require("./instrument"));

/**
 * @param input - The input to transform
 * @param options.filename - The name of the file
 */
var transform = function transform(input, options) {
  var _options$instrumentor = options.instrumentor,
      instrumentor = _options$instrumentor === void 0 ? 'minimal' : _options$instrumentor,
      filename = options.filename,
      _options$generateOpts = options.generateOpts,
      generateOpts = _options$generateOpts === void 0 ? {} : _options$generateOpts,
      _options$transformOpt = options.transformOpts,
      transformOpts = _options$transformOpt === void 0 ? {} : _options$transformOpt;
  var transformOutput = {};
  var traverser = instrument.hasOwnProperty(instrumentor) ? instrument[instrumentor] : instrument.minimal;
  var promise = new _promise.default(function (resolve) {
    transformOutput = (0, _core.transform)(input, (0, _objectSpread2.default)({
      compact: true,
      code: false,
      ast: true,
      // Disabling comments makes it easier to get the line number from run error
      comments: false,
      filename: filename,
      babelrc: false,
      sourceMaps: true
    }, transformOpts)); // console.log(require('util').inspect(transformOutput.ast, { depth: 20 }))

    var _traverser = traverser({
      ast: transformOutput.ast,
      types: types,
      traverse: _traverse.default
    }),
        insertions = _traverser.insertions;

    var generated = (0, _generator.default)(transformOutput.ast, (0, _objectSpread2.default)({
      comments: false,
      sourceMaps: true,
      sourceFileName: filename,
      concise: true,
      sourceRoot: '/babel/generator'
    }, generateOpts), input);
    return resolve({
      code: generated.code,
      map: generated.map,
      error: null,
      originalError: null,
      source: input,
      insertions: insertions
    });
  });
  return promise.catch(function (err) {
    var loc = err.loc;
    var error = {
      name: String(err.name),
      loc: loc,
      stack: String(err.stack),
      message: String(err.message)
    };
    return (0, _utils.normalizeError)(error, null, null).then(function (error) {
      // $FlowFixMe
      error.stack = err.stack;
      return {
        insertions: null,
        code: null,
        map: null,
        source: input,
        error: error,
        originalError: err
      };
    });
  });
};

var _default = transform;
exports.default = _default;