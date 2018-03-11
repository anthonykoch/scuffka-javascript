"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.isCallable = exports.isLiteral = exports.isUnaryVoid = exports.isCall = exports.isSymbol = exports.isNaN = exports.isUndefined = exports.isIdentifier = exports.isConsoleLog = void 0;

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _constants = require("./constants");

// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js
var IGNORE = (0, _symbol.default)();

var isIgnored = function isIgnored(node) {
  return node.hasOwnProperty(IGNORE);
};

function ignore(first) {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }

  return first;
}

var isConsoleLog = function isConsoleLog(expr) {
  return expr.type === 'CallExpression' && expr.callee.type === 'MemberExpression' && expr.callee.object.name === 'console' && expr.callee.property.name === 'log';
};

exports.isConsoleLog = isConsoleLog;

var isIdentifier = function isIdentifier(expr, name) {
  return expr.type === 'Identifier' && expr.name === name;
};

exports.isIdentifier = isIdentifier;

var isUndefined = function isUndefined(expr) {
  return isIdentifier(expr, 'undefined');
};

exports.isUndefined = isUndefined;

var isNaN = function isNaN(expr) {
  return isIdentifier(expr, 'NaN');
};

exports.isNaN = isNaN;

var isSymbol = function isSymbol(node) {
  return node.type === 'CallExpression' && node.callee.name === 'Symbol';
};

exports.isSymbol = isSymbol;

var isCall = function isCall(node) {
  return node.type === 'CallExpression';
};

exports.isCall = isCall;

var isUnaryVoid = function isUnaryVoid(node) {
  return node.type === 'UnaryExpression' && node.operator === 'void';
};

exports.isUnaryVoid = isUnaryVoid;

var isLiteral = function isLiteral(node) {
  var type = node.type;
  return type === 'NullLiteral' || type === 'StringLiteral' || type === 'ObjectExpression' || type === 'ObjectLiteral' || type === 'ArrayExpression' || type === 'ArrayLiteral' || type === 'BooleanLiteral' || type === 'NumericLiteral' || type === 'Literal' || type === 'TemplateLiteral' || type === 'RegExpLiteral' || isUndefined(node) || isNaN(node) || isSymbol(node);
};
/**
 * Returns true if the node is a callable expression.
 * @param  {string} options.type
 * @return {Boolean}
 */


exports.isLiteral = isLiteral;

var isCallable = function isCallable(_ref) {
  var type = _ref.type;
  return (// type === 'ClassDeclaration'        ||
    type === 'ClassExpression' || // type === 'FunctionDeclaration'     ||
    type === 'FunctionExpression' || type === 'ArrowFunctionExpression'
  );
};

exports.isCallable = isCallable;

var _default = function _default(_ref2) {
  var t = _ref2.types,
      ast = _ref2.ast,
      traverse = _ref2.traverse;
  var insertions = [];
  var badLoops = [];
  var id = -1;

  var addInsertionPoint = function addInsertionPoint(node, origin) {
    id += 1;
    insertions.push({
      id: id,
      // eslint-disable-next-line no-undef
      loc: origin === null || origin === void 0 ? void 0 : origin.loc,
      position: {
        // eslint-disable-next-line no-undef
        start: origin === null || origin === void 0 ? void 0 : origin.start,
        // eslint-disable-next-line no-undef
        end: origin === null || origin === void 0 ? void 0 : origin.end
      }
    });
    return id;
  };

  var trackStatement = function trackStatement(id, node) {
    var insertionId = addInsertionPoint(node, node);
    return ignore(t.expressionStatement(t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)])));
  };

  var track = function track(node) {
    var forceSequence = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var insertionId = addInsertionPoint(node, node); // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      var identifier = node.callee; // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column

      node.callee = t.sequenceExpression([t.numericLiteral(0), t.identifier(identifier.name)]);
    }

    if (forceSequence || isLiteral(node) || isCallable(node) || isUnaryVoid(node)) {
      // Don't track these since it's redundant information
      return t.sequenceExpression([t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)]), node]);
    } else {
      return t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(id), node]);
    }
  };

  var visitors = {
    ReturnStatement: function ReturnStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },
    BreakStatement: function BreakStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },
    ContinueStatement: function ContinueStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },
    ForStatement: function ForStatement(path) {
      path.node.test = track(path.node.test);

      if (path.node.update == null) {
        badLoops.push({
          type: path.node.type,
          loc: path.node.loc,
          position: path.node.position
        });
      }
    },
    DoWhileStatement: function DoWhileStatement(path) {
      var test = path.node.test;
      path.node.test = track(path.node.test);

      if (test && test.value === true) {
        badLoops.push({
          type: test.type,
          loc: test.loc,
          position: test.position
        });
      }
    },
    WhileStatement: function WhileStatement(path) {
      path.node.test = track(path.node.test);
    },
    IfStatement: function IfStatement(path) {
      path.node.test = track(path.node.test);
    },
    SwitchStatement: function SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant);
    },
    SwitchCase: function SwitchCase(path) {
      path.node.test = track(path.node.test);
    },
    LogicalExpression: function LogicalExpression(path) {
      path.node.left = track(path.node.left);
      path.node.right = track(path.node.right);
    },
    ExpressionStatement: function ExpressionStatement(path) {
      var node = path.node;
      var expr = node.expression;

      if (isConsoleLog(expr) || isIgnored(node)) {
        return;
      }

      ignore(node);
      node.expression = track(expr, false);
    },
    VariableDeclaration: function VariableDeclaration(path) {
      var node = path.node;
      var length = node.declarations.length;

      for (var i = 0; i < length; i++) {
        var declaration = node.declarations[i];
        var init = declaration.init;

        if (init != null) {
          declaration.init = track(init, false);
        }
      }
    }
  };
  traverse(ast, visitors);
  return {
    insertions: insertions,
    badLoops: badLoops
  };
};

exports.default = _default;