"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNodeModule = exports.run = exports.envs = exports.nodeExec = exports.browserExec = exports.wrap = void 0;

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
 * Executes code in the same environment
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

var run =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(input) {
    var options,
        _module,
        _options$notifiers,
        notifiers,
        __filename,
        __dirname,
        _options$env,
        env,
        _options$functionId,
        functionId,
        _options$sourcemap,
        sourcemap,
        exec,
        error,
        _args3 = arguments;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            options = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {};
            _module = options.module, _options$notifiers = options.notifiers, notifiers = _options$notifiers === void 0 ? {} : _options$notifiers, __filename = options.__filename, __dirname = options.__dirname, _options$env = options.env, env = _options$env === void 0 ? 'browser' : _options$env, _options$functionId = options.functionId, functionId = _options$functionId === void 0 ? FUNCTION_ID : _options$functionId, _options$sourcemap = options.sourcemap, sourcemap = _options$sourcemap === void 0 ? null : _options$sourcemap;
            exec = envs.hasOwnProperty(env) ? envs[env] : browserExec;
            _context3.prev = 3;
            _context3.next = 6;
            return exec(input, {
              functionId: functionId,
              filename: __filename,
              parameters: ['exports', 'require', 'module', '__filename', '__dirname', _constants.VAR_INSPECT],
              args: [_module.exports, _module.require, _module, __filename, __dirname, function (id, value) {
                Array.isArray(notifiers === null || notifiers === void 0 ? void 0 : notifiers.expression) ? notifiers === null || notifiers === void 0 ? void 0 : notifiers.expression.forEach(function (fn) {
                  fn(id, value);
                }) : null;
                return value;
              }],
              thisBinding: _module.exports
            });

          case 6:
            return _context3.abrupt("return", {
              finish: true
            });

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3["catch"](3);
            _context3.next = 13;
            return (0, _utils.normalizeError)(_context3.t0, sourcemap, functionId, env);

          case 13:
            error = _context3.sent;
            return _context3.abrupt("return", {
              error: error
            });

          case 15:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[3, 9]]);
  }));

  return function run(_x5) {
    return _ref4.apply(this, arguments);
  };
}();
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