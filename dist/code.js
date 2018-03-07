"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visit = visit;
exports.transform = exports.visitors = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('./constants'),
    VAR_INSPECT = _require.VAR_INSPECT,
    VAR_NOTIFY_BLOCK = _require.VAR_NOTIFY_BLOCK,
    VAR_NOTIFY_MEMBER = _require.VAR_NOTIFY_MEMBER;

var esprima = require('esprima');

var escodegen = require('escodegen');

var estraverse = require('estraverse');

var _require2 = require('ast-types'),
    t = _require2.builders;

var IGNORE = Symbol();

function ignore() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }
}

var isIgnored = function isIgnored(node) {
  return node.hasOwnProperty(IGNORE);
};

var createLoc = function createLoc(loc) {
  return t.objectExpression([t.property('init', t.identifier('start'), t.objectExpression([t.property('init', t.identifier('column'), t.literal(loc.start.line)), t.property('init', t.identifier('line'), t.literal(loc.start.column))])), t.property('init', t.identifier('end'), t.objectExpression([t.property('init', t.identifier('column'), t.literal(loc.start.column)), t.property('init', t.identifier('line'), t.literal(loc.start.line))]))]);
};

var createPosition = function createPosition(start, end) {
  return t.objectExpression([t.property('init', t.identifier('start'), t.literal(Number(start))), t.property('init', t.identifier('end'), t.literal(Number(end)))]);
};

var expressionNotifier = function expressionNotifier(node, loc) {
  return t.callExpression(t.identifier(VAR_INSPECT), [node, // Note: These need to be synced with the tracker's parameters
  createLoc(node.loc), createPosition.apply(void 0, _toConsumableArray(node.range))]);
};

var blockNotifier = function blockNotifier() {
  return t.expressionStatement(t.callExpression(t.identifier(VAR_NOTIFY_BLOCK), []));
};

var isConsoleLog = function isConsoleLog(expr) {
  return expr.type === 'CallExpression' && expr.callee.type === 'MemberExpression' && expr.callee.object.name === 'console' && expr.callee.property.name === 'log';
};

var isIdentifier = function isIdentifier(expr, name) {
  return expr.type === 'Identifier' && expr.name === name;
};

var isUndefined = function isUndefined(expr) {
  return isIdentifier(expr, 'undefined');
};

var isLiteral = function isLiteral(expr) {
  var type = expr.type;
  return type === 'NumericLiteral' || type === 'StringLiteral' || type === 'BooleanLiteral' || type === 'TemplateLiteral' || type === 'RegExpLiteral' || type === 'NullLiteral' || isUndefined(expr) || isIdentifier('NaN');
};

var isTrackableVariableDeclaration = function isTrackableVariableDeclaration(expr) {
  return expr.type === 'MemberExpression' || expr.type === 'Identifier';
};

var visitors = {
  BlockStatement: function BlockStatement(node) {
    var expr = blockNotifier();
    ignore(expr);
    node.body.unshift(expr);
  },
  ExpressionStatement: function ExpressionStatement(node) {
    var expr = node.expression;

    if (isConsoleLog(expr)) {
      // TODO: Grab the contents of the console log
      return;
    } else if (isLiteral(expr) || isIgnored(node)) {
      return;
    }

    node.expression = expressionNotifier(expr, expr);
    return node;
  },
  VariableDeclaration: function VariableDeclaration(node) {
    var length = node.declarations.length;

    if (isIgnored(node)) {
      return path.skip();
    }

    for (var i = 0; i < length; i++) {
      var declaration = node.declarations[i];
      var init = declaration.init;

      if (init != null && isTrackableVariableDeclaration(init)) {
        declaration.init = expressionNotifier(init, init);
      }
    }
  }
};
exports.visitors = visitors;

function visit(node, visitors) {
  var hasVisitor = visitors.hasOwnProperty(node.type);

  if (hasVisitor) {
    visitors[node.type](node);
  }

  return hasVisitor;
}

;
/**
 * @param  {String} input - The input to transform
 * @param  {String} options.scriptType - Either 'module' or 'script'
 * @param  {String} options.filename - The name of the file
 * @return {Object}
 */

var transform =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(input) {
    var _ref2,
        scriptType,
        filename,
        ast,
        fn,
        error,
        finalError,
        output,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref2 = _args.length > 1 && _args[1] !== undefined ? _args[1] : {}, scriptType = _ref2.scriptType, filename = _ref2.filename;
            (0, _assert.default)(typeof filename === 'string', "{string} options.filename, got ".concat(filename));
            ast = null;
            _context.prev = 3;
            fn = scriptType === 'module' ? 'parseModule' : 'parseScript';
            ast = esprima[fn](input, {
              range: true,
              loc: true
            });
            _context.next = 15;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](3);
            error = {
              name: _context.t0.name,
              loc: {
                line: _context.t0.lineNumber,
                column: _context.t0.column
              },
              stack: _context.t0.stack,
              message: _context.t0.message
            };
            _context.next = 13;
            return (0, _utils.normalizeError)(error, null, null, null);

          case 13:
            finalError = _context.sent;
            return _context.abrupt("return", {
              error: finalError,
              originalError: _context.t0
            });

          case 15:
            estraverse.replace(ast, {
              enter: function enter(node, parent) {
                visit(node, visitors);
              }
            });
            output = escodegen.generate(ast, {
              format: {
                indent: {
                  style: ''
                },
                space: '',
                newline: ''
              },
              sourceMap: filename,
              // true or string
              sourceMapRoot: '/',
              // Root directory for sourceMap
              sourceMapWithCode: true,
              // Set to true to include code AND source map
              sourceContent: input // If set, embedded in source map as code

            });
            return _context.abrupt("return", Object.assign({}, output, {
              map: output.map != undefined ? output.map.toString() : null
            }));

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 8]]);
  }));

  return function transform(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.transform = transform;