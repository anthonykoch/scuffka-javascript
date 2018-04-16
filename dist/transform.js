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

var _assert = _interopRequireDefault(require("assert"));

var types = _interopRequireWildcard(require("@babel/types"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _core = require("@babel/core");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _utils = require("./utils");

var instrument = _interopRequireWildcard(require("./instrument"));

/**
 * @param  {String} input - The input to transform
 * @param  {String} options.filename - The name of the file
 * @return {Object}
 */
var _default =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(input) {
    var options,
        _args2 = arguments;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            options = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {};
            return _context2.abrupt("return", (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee() {
              var _options$instrumentor, instrumentor, filename, generateOpts, transformOpts, transformOutput, _instrumentor, insertions, hasLoc, error, finalError;

              return _regenerator.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _options$instrumentor = options.instrumentor, instrumentor = _options$instrumentor === void 0 ? instrument.minimal : _options$instrumentor, filename = options.filename, generateOpts = options.generateOpts, transformOpts = options.transformOpts;
                      (0, _assert.default)(typeof filename === 'string', "{string} options.filename, got ".concat(filename));
                      transformOutput = {};
                      _context.prev = 3;
                      transformOutput = (0, _core.transform)(input, (0, _objectSpread2.default)({
                        compact: true,
                        // Disabling comments makes it easier to get the line number from run error
                        code: false,
                        ast: true,
                        comments: false,
                        filename: filename,
                        babelrc: false,
                        sourceMaps: true
                      }, transformOpts)); // console.log(require('util').inspect(transformOutput.ast, { depth: 20 }))

                      _instrumentor = instrumentor({
                        ast: transformOutput.ast,
                        types: types,
                        traverse: _traverse.default
                      }), insertions = _instrumentor.insertions;
                      return _context.abrupt("return", (0, _objectSpread2.default)({
                        code: null,
                        map: null,
                        error: null
                      }, (0, _generator.default)(transformOutput.ast, (0, _objectSpread2.default)({
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
                      hasLoc = _context.t0 && _context.t0.loc;
                      error = {
                        name: _context.t0.name,
                        loc: {
                          line: hasLoc ? _context.t0.loc.line : undefined,
                          column: hasLoc ? _context.t0.loc.column : undefined
                        },
                        stack: _context.t0.stack,
                        message: _context.t0.message
                      };
                      _context.next = 15;
                      return (0, _utils.normalizeError)(error, null, null, null);

                    case 15:
                      finalError = _context.sent;
                      // FIXME: The normalized error should have a stack
                      finalError.stack = _context.t0.stack;
                      return _context.abrupt("return", {
                        code: null,
                        map: null,
                        error: finalError,
                        originalError: _context.t0
                      });

                    case 18:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this, [[3, 9]]);
            }))());

          case 2:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = _default;