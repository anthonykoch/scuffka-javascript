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
// https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js
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
  var _expr$callee, _expr$callee2, _expr$callee2$object, _expr$callee3, _expr$callee3$propert;

  return expr.type === 'CallExpression' && ((_expr$callee = expr.callee) === null || _expr$callee === void 0 ? void 0 : _expr$callee.type) === 'MemberExpression' && ((_expr$callee2 = expr.callee) === null || _expr$callee2 === void 0 ? void 0 : (_expr$callee2$object = _expr$callee2.object) === null || _expr$callee2$object === void 0 ? void 0 : _expr$callee2$object.name) === 'console' && ((_expr$callee3 = expr.callee) === null || _expr$callee3 === void 0 ? void 0 : (_expr$callee3$propert = _expr$callee3.property) === null || _expr$callee3$propert === void 0 ? void 0 : _expr$callee3$propert.name) === 'log';
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
  var _node$callee;

  return node.type === 'CallExpression' && ((_node$callee = node.callee) === null || _node$callee === void 0 ? void 0 : _node$callee.name) === 'Symbol';
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
  return type === 'ClassExpression' || type === 'FunctionExpression' || type === 'ArrowFunctionExpression';
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
    var isExpression = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    id += 1;
    insertions.push({
      type: node.type,
      isExpression: isExpression,
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

  var trackStatement = function trackStatement(node) {
    var insertionId = addInsertionPoint(node, node);
    return ignore(t.expressionStatement(t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)])));
  };

  var track = function track(node) {
    var forceSequence = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var insertionId = addInsertionPoint(node, node, true); // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      var identifier = node.callee; // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column

      node.callee = t.sequenceExpression([t.numericLiteral(0), t.identifier(identifier.name)]);
    }

    if (forceSequence || isCallable(node)) {
      // Don't track these since it's redundant information
      return t.sequenceExpression([t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)]), node]);
    } else {
      return t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(id), node]);
    }
  };

  var visitors = {
    ConditionalExpression: function ConditionalExpression() {// TODO:
    },
    ReturnStatement: function ReturnStatement(path) {
      if (path.node.argument != null) {
        path.node.argument = track(path.node.argument, false);
      } else {
        path.node.argument = track(t.identifier('undefined'), false, path.node);
      }
    },
    BreakStatement: function BreakStatement(path) {
      path.insertBefore(trackStatement(path.node, false));
    },
    ContinueStatement: function ContinueStatement(path) {
      path.insertBefore(trackStatement(path.node, false));
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
    ForOfStatement: function ForOfStatement(path) {
      path.node.right = track(path.node.right);
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
      path.node.test = track(path.node.test, true);
    },
    IfStatement: function IfStatement(path) {
      path.node.test = track(path.node.test, true);
    },
    SwitchStatement: function SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant);
    },
    SwitchCase: function SwitchCase(path) {
      path.node.test = track(path.node.test);
    },
    LogicalExpression: function LogicalExpression(path) {
      path.node.left = track(path.node.left, true);
      path.node.right = track(path.node.right, true);
    },
    ExpressionStatement: function ExpressionStatement(path) {
      var node = path.node;
      var expr = node.expression;

      if (isConsoleLog(expr) || isIgnored(node)) {
        return;
      }

      ignore(node); // TODO: Maybe add a right side to insertions because `users = []` yields
      //       `users = [] // []` in lively-browser or maybe just don't track
      //       the expression?

      node.expression = track(expr);
    },
    VariableDeclaration: function VariableDeclaration(path) {
      var node = path.node;
      var length = node.declarations.length;

      for (var i = 0; i < length; i++) {
        var declaration = node.declarations[i];
        var init = declaration.init;

        if (init != null) {
          declaration.init = track(init);
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