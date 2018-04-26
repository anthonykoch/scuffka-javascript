"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createNodeModule = exports.run = exports.defaultExecutor = exports.executors = exports.nodeExec = exports.browserExec = exports.wrap = exports.FUNCTION_ID = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _vm = _interopRequireDefault(require("vm"));

var _path = _interopRequireDefault(require("path"));

var _assert = _interopRequireDefault(require("assert"));

var _module2 = _interopRequireDefault(require("module"));

var _random = _interopRequireDefault(require("lodash/random"));

var _constants = require("./constants");

var _utils = require("./utils");

// $FlowFixMe
var FUNCTION_ID = "LJS_FUNC" + (0, _random.default)(1000000, 1999999);
exports.FUNCTION_ID = FUNCTION_ID;

var wrap = function wrap(code, args, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$id = _ref.id,
      id = _ref$id === void 0 ? '' : _ref$id,
      _ref$closure = _ref.closure,
      closure = _ref$closure === void 0 ? false : _ref$closure;

  var parameters = args.map(function (str) {
    return str.replace(/\s/g, '');
  }).join(', ');
  var header = (closure ? 'return ' : ';') + "(function " + id + "(" + parameters + ") {";
  var footer = "});";
  return {
    header: header,
    footer: footer,
    code: header + "\n" + code + "\n" + footer
  };
};
/**
 * Executes code inside an anonymous function.
 *
 * @param  {String} input
 * @param  {Object} options
 * @return {any} Returns whatever the anonymous function returns.
 */


exports.wrap = wrap;

var browserExec = function browserExec(input, options) {
  var _options$args = options.args,
      args = _options$args === void 0 ? [] : _options$args,
      _options$parameters = options.parameters,
      parameters = _options$parameters === void 0 ? [] : _options$parameters,
      thisBinding = options.thisBinding; // $FlowFixMe

  var fn = Function(wrap(input, parameters, {
    id: options.functionId,
    closure: true
  }).code)(); // console.log(fn.toString());

  return new _promise.default(function (resolve) {
    return resolve(fn.call.apply(fn, [thisBinding].concat(args)));
  });
};
/**
 * Executes code in the same environment from where its called.
 *
 * @param  {String} input - The code to execute
 * @param  {Object} options
 * @return {any} - Returns whatever the function returns
 */


exports.browserExec = browserExec;

var nodeExec = function nodeExec(input, options) {
  (0, _assert.default)(options, 'options must be an object');
  var filename = options.filename,
      _options$args2 = options.args,
      args = _options$args2 === void 0 ? [] : _options$args2,
      _options$parameters2 = options.parameters,
      parameters = _options$parameters2 === void 0 ? [] : _options$parameters2,
      thisBinding = options.thisBinding,
      functionId = options.functionId;
  var wrapper = wrap(input, parameters, {
    id: functionId
  });

  var fn = _vm.default.runInThisContext(wrapper.code, {
    filename: filename,
    lineOffset: options.lineOffset,
    columnOffset: options.columnOffset
  });

  return new _promise.default(function (resolve) {
    return resolve(fn.call.apply(fn, [thisBinding].concat(args)));
  });
};

exports.nodeExec = nodeExec;
var executors = {
  node: nodeExec,
  browser: browserExec
};
exports.executors = executors;
var defaultExecutor = browserExec;
/**
 * Executes input in a a common js style wrapper. The module passed needs two properties,
 * require and exports, which are used to simulate a common js environment. It does not
 * wait for setTimeouts or promises to finish before returning.
 *
 * To be notified when a coverage point has been fired, "track" may be passed. "track"
 * is called with three arguments:
 *
 * 1. id - The id of the insertion point
 * 2. hasValue - Whether or not an expression is being tracked at that location.
 * 3. value - The runtime value for the expression, may be undefined.
 *
 * The env has two option, browser and node. I determines what will be used to execute
 * the code, either an anonymous function (browser) or the node VM module (node). With
 * node, the code is executed in the same environment from where it is called from.
 *
 * @param input - The code to be executed
 * @param options.module
 * @param options.functionId
 * @param options.env - Either 'browser' or 'node'
 * @param options.sourcemap - The sourcemap for the input, used to get proper locations from exceptions
 * @param options.notifiers
 */

exports.defaultExecutor = defaultExecutor;

var run = function run(input, options) {
  var _options$module = options.module,
      _module = _options$module === void 0 ? {
    require: function require() {},
    exports: {}
  } : _options$module,
      track = options.track,
      __filename = options.__filename,
      __dirname = options.__dirname,
      _options$env = options.env,
      env = _options$env === void 0 ? 'browser' : _options$env,
      _options$functionId = options.functionId,
      functionId = _options$functionId === void 0 ? FUNCTION_ID : _options$functionId,
      sourcemap = options.sourcemap;

  var exec = executors.hasOwnProperty(env) ? executors[env] : defaultExecutor;
  return exec(input, {
    functionId: functionId,
    filename: __filename,
    parameters: ['exports', 'require', 'module', '__filename', '__dirname', _constants.VAR_INSPECT, _constants.VAR_MEMBER_OBJECT_INTERP, _constants.VAR_MEMBER_PROPERTY_INTERP],
    args: [_module.exports, _module.require, _module, __filename, __dirname, function onCoverageNotification(id, value) {
      var hasValue = arguments.hasOwnProperty(1);

      if (typeof track === 'function') {
        track(id, hasValue, value);
      }

      return value;
    }, undefined, undefined],
    thisBinding: _module.exports
  }).then(function () {
    return {
      finish: true,
      error: null
    };
  }).catch(function (err) {
    return (0, _utils.normalizeError)(err, sourcemap, functionId).then(function (error) {
      return {
        finish: false,
        error: error
      };
    });
  });
};
/**
 * Returns a node module object. Only works inside a node environment.
 */


exports.run = run;

var createNodeModule = function createNodeModule(filename) {
  if (filename === '.') {
    return new _module2.default('.', null);
  }

  (0, _assert.default)(typeof filename === 'string', 'filename must be a string');
  (0, _assert.default)(_path.default.isAbsolute(filename), 'filename must be absolute');
  return new _module2.default(filename, null);
};

exports.createNodeModule = createNodeModule;