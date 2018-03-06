"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNodeModule = exports.run = exports.envs = exports.nodeExec = exports.browserExec = exports.wrap = void 0;

var _vm = _interopRequireDefault(require("vm"));

var _path = _interopRequireDefault(require("path"));

var _assert = _interopRequireDefault(require("assert"));

var _module2 = _interopRequireDefault(require("module"));

var _random = _interopRequireDefault(require("lodash/random"));

var _constants = require("./constants");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var FUNCTION_ID = "LIVELY_INSPECT_".concat((0, _random.default)(1000000, 1999999));

var noop = function noop() {};

var wrap = function wrap(code, args, _ref) {
  var _ref$id = _ref.id,
      id = _ref$id === void 0 ? '' : _ref$id,
      _ref$closure = _ref.closure,
      closure = _ref$closure === void 0 ? false : _ref$closure;
  var parameters = args.map(function (str) {
    return str.replace(/\s/g, '');
  }).join(', ');
  var header = "".concat(closure ? 'return ' : ';', "(function ").concat(id, "(").concat(parameters, ") {");
  var footer = "});";
  return {
    header: header,
    footer: footer,
    code: "".concat(header, "\n").concat(code, "\n").concat(footer)
  };
};

exports.wrap = wrap;

var browserExec = function browserExec(input, options) {
  var _options$args = options.args,
      args = _options$args === void 0 ? [] : _options$args,
      _options$parameters = options.parameters,
      parameters = _options$parameters === void 0 ? [] : _options$parameters,
      thisBinding = options.thisBinding;
  var fn = Function(wrap(input, parameters, {
    id: options.functionId,
    closure: true
  }).code)(); // console.log(fn.toString());

  return fn.call.apply(fn, [thisBinding].concat(_toConsumableArray(args)));
};
/**
 * Executes code in the same environment
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
  }); // console.log('Input:', wrapper.code)

  var fn = _vm.default.runInThisContext(wrapper.code, {
    filename: filename,
    lineOffset: options.lineOffset,
    columnOffset: options.columnOffset
  });

  return fn.call.apply(fn, [thisBinding].concat(_toConsumableArray(args)));
};

exports.nodeExec = nodeExec;
var envs = {
  node: nodeExec,
  browser: browserExec
};
/**
 * Executes the input. If an error occurs, returns the error information, else
 * returns the thing.
 *
 * @param  {String} input.code - The code to be executed
 * @param  {Object} [input.map] - The map for the transformed input
 * @param  {Function} tracker
 */

exports.envs = envs;

var run = function run(input) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _module = options.module,
      tracker = options.tracker,
      __filename = options.__filename,
      __dirname = options.__dirname,
      _options$env = options.env,
      env = _options$env === void 0 ? 'browser' : _options$env,
      _options$functionId = options.functionId,
      functionId = _options$functionId === void 0 ? FUNCTION_ID : _options$functionId,
      _options$sourcemap = options.sourcemap,
      sourcemap = _options$sourcemap === void 0 ? null : _options$sourcemap;
  var exec = envs[env] || browserExec;

  try {
    exec(input, {
      functionId: functionId,
      filename: __filename,
      parameters: ['exports', 'require', 'module', '__filename', '__dirname', _constants.VAR_INSPECT, _constants.VAR_NOTIFY_BLOCK],
      args: [_module.exports, _module.require, _module, __filename, __dirname, tracker, noop],
      thisBinding: _module.exports
    });
    return {
      finish: true
    };
  } catch (err) {
    var error = (0, _utils.normalizeError)(err, sourcemap, functionId, env);
    return {
      error: error
    };
  }
};
/**
 * Returns a node module object
 * @param {String} file
 * @return {Module}
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