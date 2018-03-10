"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _constants = require("./constants");

// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js
var IGNORE = (0, _symbol.default)();

var isIgnored = function isIgnored(node) {
  return node.hasOwnProperty(IGNORE);
};

function ignore() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }
}

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
  return type === 'NumericLiteral' || type === 'StringLiteral' || type === 'BooleanLiteral' || type === 'TemplateLiteral' || type === 'RegExpLiteral' || type === 'NullLiteral' || isUndefined(expr) || isIdentifier(expr, 'NaN');
};

var isTrackableVariableDeclaration = function isTrackableVariableDeclaration(expr) {
  return expr.type === 'MemberExpression' || expr.type === 'NewExpression' || expr.type === 'Identifier';
};

var _default = function _default(_ref) {
  var t = _ref.types,
      ast = _ref.ast,
      traverse = _ref.traverse;
  var insertions = [];
  var id = -1;

  var addInsertionPoint = function addInsertionPoint(node, origin) {
    id += 1;
    insertions.push({
      id: id,
      loc: origin === null || origin === void 0 ? void 0 : origin.loc,
      position: {
        start: origin === null || origin === void 0 ? void 0 : origin.start,
        end: origin === null || origin === void 0 ? void 0 : origin.end
      }
    });
    return id;
  };

  var expressionNotifier = function expressionNotifier(node) {
    var insertionId = addInsertionPoint(node, node);

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      var identifier = node.callee; // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column

      node.callee = t.sequenceExpression([t.numericLiteral(0), t.identifier(identifier.name)]);
    }

    return t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId), node]);
  };

  var visitors = {
    ExpressionStatement: function ExpressionStatement(path) {
      var node = path.node;
      var expr = node.expression;

      if (isConsoleLog(expr)) {
        return;
      } else if (isLiteral(expr) || isIgnored(node)) {
        return;
      }

      node.expression = expressionNotifier(expr);
    },
    VariableDeclaration: function VariableDeclaration(path) {
      var node = path.node;
      var length = node.declarations.length;

      if (isIgnored(node)) {
        return path.skip();
      }

      for (var i = 0; i < length; i++) {
        var declaration = node.declarations[i];
        var init = declaration.init;

        if (init != null) {
          declaration.init = expressionNotifier(init);
        }
      }
    }
  };
  traverse(ast, visitors);
  return {
    insertions: insertions
  };
};

exports.default = _default;