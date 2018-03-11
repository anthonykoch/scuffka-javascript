"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var types = _interopRequireWildcard(require("@babel/types"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _core = require("@babel/core");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _assert = _interopRequireDefault(require("assert"));

var _utils = require("./utils");

var _instrument2 = _interopRequireDefault(require("./instrument"));

/**
 * @param  {String} input - The input to transform
 * @param  {String} options.scriptType - Either 'module' or 'script'
 * @param  {String} options.filename - The name of the file
 * @return {Object}
 */
var _default =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(input) {
    var _ref2,
        filename,
        generateOpts,
        transformOpts,
        transformOutput,
        _instrument,
        insertions,
        _err$loc,
        _err$loc2,
        error,
        finalError,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref2 = _args.length > 1 && _args[1] !== undefined ? _args[1] : {}, filename = _ref2.filename, generateOpts = _ref2.generateOpts, transformOpts = _ref2.transformOpts;
            (0, _assert.default)(typeof filename === 'string', "{string} options.filename, got ".concat(filename));
            transformOutput = {};
            _context.prev = 3;
            transformOutput = (0, _core.transform)(input, (0, _extends2.default)({
              compact: true,
              // Disabling comments makes it easier to get the line number from run error
              code: false,
              ast: true,
              comments: false,
              filename: filename,
              babelrc: false,
              sourceMaps: true
            }, transformOpts));
            _instrument = (0, _instrument2.default)({
              ast: transformOutput.ast,
              types: types,
              traverse: _traverse.default
            }), insertions = _instrument.insertions;
            return _context.abrupt("return", (0, _extends2.default)({
              code: null,
              map: null,
              error: null
            }, (0, _generator.default)(transformOutput.ast, (0, _extends2.default)({
              comments: false,
              sourceMaps: true,
              sourceFileName: filename,
              concise: true,
              // minified: true,
              sourceRoot: '/babel/generator'
            }, generateOpts), input), {
              source: input,
              insertions: insertions
            }));

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](3);
            error = {
              name: _context.t0.name,
              loc: {
                // eslint-disable-next-line no-undef
                line: _context.t0 === null || _context.t0 === void 0 ? void 0 : (_err$loc = _context.t0.loc) === null || _err$loc === void 0 ? void 0 : _err$loc.line,
                // eslint-disable-next-line no-undef
                column: _context.t0 === null || _context.t0 === void 0 ? void 0 : (_err$loc2 = _context.t0.loc) === null || _err$loc2 === void 0 ? void 0 : _err$loc2.column
              },
              stack: _context.t0.stack,
              message: _context.t0.message
            };
            _context.next = 14;
            return (0, _utils.normalizeError)(error, null, null, null);

          case 14:
            finalError = _context.sent;
            return _context.abrupt("return", {
              code: null,
              map: null,
              error: finalError,
              originalError: _context.t0
            });

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 9]]);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = _default;