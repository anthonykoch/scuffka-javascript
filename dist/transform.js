"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

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
var transform =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(input, options) {
    var _options$instrumentor, instrumentor, filename, _options$generateOpts, generateOpts, _options$transformOpt, transformOpts, transformOutput, traverser, _traverser, insertions, generated, loc, error, finalError;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _options$instrumentor = options.instrumentor, instrumentor = _options$instrumentor === void 0 ? 'minimal' : _options$instrumentor, filename = options.filename, _options$generateOpts = options.generateOpts, generateOpts = _options$generateOpts === void 0 ? {} : _options$generateOpts, _options$transformOpt = options.transformOpts, transformOpts = _options$transformOpt === void 0 ? {} : _options$transformOpt;
            transformOutput = {};
            traverser = instrument.hasOwnProperty(instrumentor) ? instrument[instrumentor] : instrument.minimal;
            _context.prev = 3;
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

            _traverser = traverser({
              ast: transformOutput.ast,
              types: types,
              traverse: _traverse.default
            }), insertions = _traverser.insertions;
            generated = (0, _generator.default)(transformOutput.ast, (0, _objectSpread2.default)({
              comments: false,
              sourceMaps: true,
              sourceFileName: filename,
              concise: true,
              sourceRoot: '/babel/generator'
            }, generateOpts), input);
            return _context.abrupt("return", {
              code: generated.code,
              map: generated.map,
              error: null,
              originalError: null,
              source: input,
              insertions: insertions
            });

          case 10:
            _context.prev = 10;
            _context.t0 = _context["catch"](3);
            loc = _context.t0.loc;
            error = {
              name: String(_context.t0.name),
              loc: loc,
              stack: String(_context.t0.stack),
              message: String(_context.t0.message)
            };
            _context.next = 16;
            return (0, _utils.normalizeError)(error, null, null);

          case 16:
            finalError = _context.sent;
            // FIXME: The normalized error should have a stack
            finalError.stack = _context.t0.stack;
            return _context.abrupt("return", {
              insertions: null,
              code: null,
              map: null,
              source: input,
              error: finalError,
              originalError: _context.t0
            });

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 10]]);
  }));

  return function transform(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var _default = transform;
exports.default = _default;