"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNodeModule = exports.run = exports.defaultExecutor = exports.executors = exports.nodeExec = exports.browserExec = exports.wrap = exports.FUNCTION_ID = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _vm = _interopRequireDefault(require("vm"));

var _path = _interopRequireDefault(require("path"));

var _assert = _interopRequireDefault(require("assert"));

var _module2 = _interopRequireDefault(require("module"));

var _random = _interopRequireDefault(require("lodash/random"));

var _constants = require("./constants");

var _utils = require("./utils");

var FUNCTION_ID = "LIVELY_INSPECT_".concat((0, _random.default)(1000000, 1999999));
exports.FUNCTION_ID = FUNCTION_ID;

var wrap = function wrap(code, args) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$id = _ref.id,
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
/**
 * Executes code inside an anonymous function.
 *
 * @param  {String} input
 * @param  {Object} options
 * @return {any} Returns whatever the anonymous function returns.
 */


exports.wrap = wrap;

var browserExec =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(input, options) {
    var _options$args, args, _options$parameters, parameters, thisBinding, fn;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _options$args = options.args, args = _options$args === void 0 ? [] : _options$args, _options$parameters = options.parameters, parameters = _options$parameters === void 0 ? [] : _options$parameters, thisBinding = options.thisBinding;
            fn = Function(wrap(input, parameters, {
              id: options.functionId,
              closure: true
            }).code)(); // console.log(fn.toString());

            return _context.abrupt("return", fn.call.apply(fn, [thisBinding].concat((0, _toConsumableArray2.default)(args))));

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function browserExec(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * Executes code in the same environment from where its called.
 *
 * @param  {String} input - The code to execute
 * @param  {Object} options
 * @return {any} - Returns whatever the function returns
 */


exports.browserExec = browserExec;

var nodeExec =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(input, options) {
    var filename, _options$args2, args, _options$parameters2, parameters, thisBinding, functionId, wrapper, fn;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            (0, _assert.default)(options, 'options must be an object');
            filename = options.filename, _options$args2 = options.args, args = _options$args2 === void 0 ? [] : _options$args2, _options$parameters2 = options.parameters, parameters = _options$parameters2 === void 0 ? [] : _options$parameters2, thisBinding = options.thisBinding, functionId = options.functionId;
            wrapper = wrap(input, parameters, {
              id: functionId
            });
            fn = _vm.default.runInThisContext(wrapper.code, {
              filename: filename,
              lineOffset: options.lineOffset,
              columnOffset: options.columnOffset
            });
            return _context2.abrupt("return", fn.call.apply(fn, [thisBinding].concat((0, _toConsumableArray2.default)(args))));

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function nodeExec(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

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
 * @param  {String} input - The code to be executed
 * @param  {Object} module
 * @param  {String} functionId
 * @param  {String} env - Either 'browser' or 'node'
 * @param  {Object} [input.sourcemap] - The sourcemap for the input, used to get proper locations from exceptions
 * @param  {Function[]} [notifiers]
 */

exports.defaultExecutor = defaultExecutor;

var run =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(input) {
    var _ref5,
        _module,
        track,
        __filename,
        __dirname,
        _ref5$env,
        env,
        _ref5$functionId,
        functionId,
        sourcemap,
        exec,
        error,
        _args3 = arguments;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _ref5 = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {}, _module = _ref5.module, track = _ref5.track, __filename = _ref5.__filename, __dirname = _ref5.__dirname, _ref5$env = _ref5.env, env = _ref5$env === void 0 ? 'browser' : _ref5$env, _ref5$functionId = _ref5.functionId, functionId = _ref5$functionId === void 0 ? FUNCTION_ID : _ref5$functionId, sourcemap = _ref5.sourcemap;
            exec = executors.hasOwnProperty(env) ? executors[env] : defaultExecutor;
            _context3.prev = 2;
            _context3.next = 5;
            return exec(input, {
              functionId: functionId,
              filename: __filename,
              parameters: ['exports', 'require', 'module', '__filename', '__dirname', _constants.VAR_INSPECT],
              args: [_module.exports, _module.require, _module, __filename, __dirname, function onCoverageNotification(id, value) {
                var hasValue = arguments.hasOwnProperty(1);

                if (typeof track === 'function') {
                  track(id, hasValue, value);
                }

                return value;
              }],
              thisBinding: _module.exports
            });

          case 5:
            return _context3.abrupt("return", {
              finish: true
            });

          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](2);
            _context3.next = 12;
            return (0, _utils.normalizeError)(_context3.t0, sourcemap, functionId, env);

          case 12:
            error = _context3.sent;
            return _context3.abrupt("return", {
              error: error
            });

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[2, 8]]);
  }));

  return function run(_x5) {
    return _ref4.apply(this, arguments);
  };
}();
/**
 * Returns a node module object. Only works inside a node environment.
 *
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