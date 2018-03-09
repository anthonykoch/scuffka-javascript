"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var types = _interopRequireWildcard(require("@babel/types"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _core = require("@babel/core");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _assert = _interopRequireDefault(require("assert"));

var _utils = require("./utils");

var _instrument2 = _interopRequireDefault(require("./instrument"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

var _default =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(input) {
    var _ref2,
        filename,
        output,
        _instrument,
        insertions,
        error,
        finalError,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            output = Object.assign({}, (0, _generator.default)(output.ast, {
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