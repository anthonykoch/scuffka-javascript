"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _assign = _interopRequireDefault(require("@babel/runtime/core-js/object/assign"));

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
        output,
        _instrument,
        insertions,
        error,
        finalError,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref2 = _args.length > 1 && _args[1] !== undefined ? _args[1] : {}, filename = _ref2.filename;
            (0, _assert.default)(typeof filename === 'string', "{string} options.filename, got ".concat(filename));
            output = {};
            _context.prev = 3;
            output = (0, _core.transform)(input, {
              compact: true,
              // Disabling comments makes it easier to get the line number from run error
              code: false,
              ast: true,
              comments: false,
              filename: filename,
              babelrc: false,
              sourceMaps: true
            });
            _instrument = (0, _instrument2.default)({
              ast: output.ast,
              types: types,
              traverse: _traverse.default
            }), insertions = _instrument.insertions;
            output = (0, _assign.default)({}, (0, _generator.default)(output.ast, {
              comments: false,
              sourceMaps: true,
              sourceFileName: filename,
              concise: true,
              // minified: true,
              sourceRoot: '/babel/generator'
            }, input), {
              source: input,
              insertions: insertions
            });
            _context.next = 16;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](3);
            error = {
              name: _context.t0.name,
              loc: {
                line: _context.t0.loc.line,
                column: _context.t0.loc.column
              },
              stack: _context.t0.stack,
              message: _context.t0.message
            };
            _context.next = 14;
            return (0, _utils.normalizeError)(error, null, null, null);

          case 14:
            finalError = _context.sent;
            return _context.abrupt("return", {
              error: finalError,
              originalError: _context.t0
            });

          case 16:
            return _context.abrupt("return", output);

          case 17:
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