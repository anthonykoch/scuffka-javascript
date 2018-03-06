"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visit = visit;
exports.transform = exports.visitors = void 0;

var _utils = require("./utils");

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

var transform = function transform(input, options) {
  var _options$scriptType = options.scriptType,
      scriptType = _options$scriptType === void 0 ? 'module' : _options$scriptType;

  try {
    var fn = scriptType === 'module' ? 'parseModule' : 'parseScript';
    var ast = esprima[fn](input, {
      range: true,
      loc: true
    });
    estraverse.replace(ast, {
      enter: function enter(node, parent) {
        visit(node, visitors);
      }
    });
    var output = escodegen.generate(ast, {
      format: {
        indent: {
          style: ''
        },
        space: '',
        newline: ''
      },
      sourceMap: options.filename,
      // true or string
      sourceMapRoot: '/',
      // Root directory for sourceMap
      sourceMapWithCode: true,
      // Set to true to include code AND source map
      sourceContent: input // If set, embedded in source map as code

    });
    return Object.assign({}, output, {
      map: output.map.toString()
    });
  } catch (err) {
    var error = {
      name: err.name,
      loc: {
        line: err.lineNumber,
        column: err.column
      },
      stack: err.stack,
      message: err.message
    };
    var finalError = (0, _utils.normalizeError)(error, null, null, null);
    return {
      error: finalError,
      originalError: err
    };
  }
};

exports.transform = transform;