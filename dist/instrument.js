"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.thorough = exports.minimal = exports.isCallable = exports.isLiteral = exports.isUnaryVoid = exports.isCall = exports.isSymbol = exports.isNaN = exports.isUndefined = exports.isIdentifier = exports.isConsoleLog = void 0;

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _constants = require("./constants");

// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js
// https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js
var IGNORE = (0, _symbol.default)('IGNORE');

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
  return expr.type === 'CallExpression' && expr.callee && expr.callee.type === 'MemberExpression' && expr.callee.object && expr.callee.object.name === 'console' && expr.callee.property && expr.callee.property.name === 'log';
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
  return node.type === 'CallExpression' && node.callee && node.callee.name === 'Symbol';
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
/**
 * Transforms an AST to track a minimal amount of expressions. This transform
 * attempts to insert as few insertions as possible for better performance.
 *
 * @param  {babel.types} options.types t
 * @param  {Object} options.ast
 * @param  {Function} options.traverse - The babel traverser function
 * @return {Object} Returns the insertions and bad loops
 */


exports.isCallable = isCallable;

var minimal = function minimal(_ref2) {
  var t = _ref2.types,
      ast = _ref2.ast,
      traverse = _ref2.traverse;
  var insertions = [];
  var id = -1;

  var addInsertionPoint = function addInsertionPoint(node) {
    var isExpression = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var context = arguments.length > 2 ? arguments[2] : undefined;
    id += 1;
    insertions.push({
      type: node.type,
      context: context,
      isExpression: isExpression,
      node: node,
      id: id
    });
    return id;
  };

  var trackStatement = function trackStatement(node, context) {
    var insertionId = addInsertionPoint(node, false, context);
    return ignore(t.expressionStatement(t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)])));
  };

  var track = function track(node) {
    var forceSequence = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var insertionId = addInsertionPoint(node, true, context); // console.log('is', node.type, isLiteral(node) || isCallable(node))

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
        path.node.argument = track(path.node.argument, false, 'ReturnStatement');
      } else {
        path.insertBefore(trackStatement(path.node, 'ReturnStatement'));
      }
    },
    BreakStatement: function BreakStatement(path) {
      path.insertBefore(trackStatement(path.node, 'BreakStatement'));
    },
    ContinueStatement: function ContinueStatement(path) {
      path.insertBefore(trackStatement(path.node, 'ContinueStatement'));
    },
    ForStatement: function ForStatement(path) {
      path.node.test = track(path.node.test, true, 'ForStatement.test');
    },
    ForOfStatement: function ForOfStatement(path) {
      path.node.right = track(path.node.right, false, 'ForOfStatement');
    },
    DoWhileStatement: function DoWhileStatement(path) {
      var test = path.node.test;
      path.node.test = track(path.node.test, false, 'DoWhileStatement');
    },
    WhileStatement: function WhileStatement(path) {
      path.node.test = track(path.node.test, true, 'WhileStatement');
    },
    IfStatement: function IfStatement(path) {
      path.node.test = track(path.node.test, true, 'IfStatement');
    },
    SwitchStatement: function SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant, false, 'SwitchStatement');
    },
    SwitchCase: function SwitchCase(path) {
      path.node.test = track(path.node.test, false, 'SwitchCase');
    },
    LogicalExpression: function LogicalExpression(path) {
      path.node.left = track(path.node.left, true, 'LogicalExpression');
      path.node.right = track(path.node.right, true, 'LogicalExpression');
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

      node.expression = track(expr, false, 'ExpressionStatement');
    },
    VariableDeclaration: function VariableDeclaration(path) {
      if (path.parent.type === 'ForStatement') {
        return;
      }

      var node = path.node;
      var length = node.declarations.length;

      for (var i = 0; i < length; i++) {
        var declaration = node.declarations[i];
        var init = declaration.init;

        if (init != null) {
          declaration.init = track(init, false, 'VariableDeclaration');
        }
      }
    }
  };
  traverse(ast, visitors);
  return {
    insertions: insertions
  };
};
/**
 * Transforms an AST to track all expressions. This is terribly bad for performance
 * and should only be used for small scripts where performance is not necessary.
 *
 * @param  {babel.types} options.types t
 * @param  {Object} options.ast
 * @param  {Function} options.traverse - The babel traverser function
 * @return {Object} Returns the insertions and bad loops
 */


exports.minimal = minimal;

var thorough = function thorough(_ref3) {
  var t = _ref3.types,
      ast = _ref3.ast,
      traverse = _ref3.traverse;
  var insertions = [];
  var id = -1;

  var addInsertionPoint = function addInsertionPoint(node, context) {
    id += 1;
    insertions.push({
      context: context,
      node: node,
      id: id
    });
    return id;
  };

  var track = function track(node, context) {
    // console.log(node, context)
    if (isInstrumented(node)) {
      return node;
    }

    var insertionId = addInsertionPoint(node, true, context); // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      var _number = t.numericLiteral(0); // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column


      node.callee = t.sequenceExpression([_number, t.identifier(node.callee.name)]);
      ignore(node.callee, _number);
    }

    var name = t.identifier(_constants.VAR_INSPECT);
    var number = t.numericLiteral(insertionId);
    var call = t.callExpression(name, [number, node]);
    ignore(call, name, number);
    return call;
  };

  var isInstrumented = function isInstrumented(node) {
    console.log(node);

    if (node.hasOwnProperty(IGNORE)) {
      return true;
    } else if (node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier' && node.callee.name === _constants.VAR_INSPECT) {
      return true;
    } else if (node.type === 'Identifier' && node.name === _constants.VAR_INSPECT) {
      return true;
    }

    return false;
  };

  var trackStatement = function trackStatement(node) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (isInstrumented(node)) {
      return node;
    }

    var insertionId = addInsertionPoint(node, true, context);
    var name = t.identifier(_constants.VAR_INSPECT);
    var number = t.numericLiteral(insertionId);
    var call = t.callExpression(name, [number, node]);
    var expressionStatement = t.expressionStatement(call);
    ignore(expressionStatement, call, name, number);
    return call;
  };

  var trackProp = function trackProp(prop, type) {
    return function (path) {
      return path.node[prop] = track(path.node[prop], typeof type === 'string' ? type : path.node.type);
    };
  };

  var trackRight = trackProp('right');
  var trackLeft = trackProp('left');
  var trackTest = trackProp('test');

  var trackSelf = function trackSelf(path) {
    if (!isInstrumented(path.parent)) {
      path.replaceWith(track(path.node, path.parent.type));
    }
  };

  var trackArgument = function trackArgument(path) {
    if (path.node.argument != null && !isInstrumented(path.node.argument)) {
      path.node.argument = track(path.node.argument, path.node.type);
    }
  };

  var trackBefore = function trackBefore() {
    return function () {
      path.insertBefore(trackStatement(path.node, path.node.type));
    };
  };

  var visitors = {
    Literal: function Literal(path) {
      if (!isInstrumented(path.parent)) {
        path.replaceWith(track(path.node, path.parent.type)); // return console.log(path.node.value);
      }
    },
    MemberExpression: function MemberExpression(path) {
      if (path.node.property.computed) {
        path.node.property.expression = track(path.node.property.expression, path.node.property.type);
      }

      if (!isInstrumented(path.node.object)) {
        path.node.object = track(path.node.object, path.node.type);
      }

      if (!isInstrumented(path.parent)) {
        path.replaceWith(track(path.node, path.parent.type));
      }
    },
    ReturnStatement: function ReturnStatement(path) {
      if (path.node.argument != null && !isInstrumented(path.node.argument)) {
        path.node.argument = track(path.node.argument, 'ReturnStatement');
      }
    },
    BreakStatement: trackBefore,
    ContinueStatement: trackBefore,
    ForStatement: function ForStatement(path) {
      path.node.test = track(path.node.test, 'ForStatement.test');
      path.node.update = track(path.node.update, 'ForStatement.update');
    },
    ForOfStatement: trackRight,
    DoWhileStatement: trackTest,
    WhileStatement: trackTest,
    IfStatement: trackTest,
    SwitchCase: trackTest,
    SwitchStatement: function SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant, 'SwitchStatement');
    },
    LogicalExpression: function LogicalExpression(path) {
      path.node.left = track(path.node.left, 'LogicalExpression');
      path.node.right = track(path.node.right, 'LogicalExpression');
    },
    BinaryExpression: function BinaryExpression(path) {
      path.node.left = track(path.node.left, 'LogicalExpression');
      path.node.right = track(path.node.right, 'LogicalExpression');
    },
    CallExpression: function CallExpression(path) {
      for (var i = 0; i < path.node.arguments; i++) {
        path.node.arguments[i] = track(path.node.arguments, 'CallExpression');
      }

      if (!isInstrumented(path.parent)) {
        path.replaceWith(track(path.node, path.parent.type));
      }
    },
    ClassExpression: trackSelf,
    UnaryExpression: trackArgument,
    ThisExpression: trackSelf,
    FunctionExpression: trackSelf,
    ArrowFunctionExpression: trackSelf,
    ObjectExpression: trackSelf,
    AwaitExpression: trackArgument,
    AssignmentExpression: function AssignmentExpression(path) {
      path.node.right = track(path.node.right, path.node.type);

      if (!isInstrumented(path.parent)) {
        console.log(path.node == null);
        path.replaceWith(track(path.node, path.parent.type));
      }
    },
    ArrayExpression: function ArrayExpression(path) {
      for (var i = 0; i < path.node.elements; i++) {
        path.node.elements[i] = track(path.node.elements, 'ArrayExpression');
      }

      path.replaceWith(track(path.node, path.parent.type));
    },
    VariableDeclaration: function VariableDeclaration(path) {
      if (path.parent.type === 'ForStatement') {
        return;
      }

      var node = path.node;
      var length = node.declarations.length;

      for (var i = 0; i < length; i++) {
        var declaration = node.declarations[i];
        var init = declaration.init;

        if (init != null) {
          declaration.init = track(init, 'VariableDeclaration');
        }
      }
    }
  };
  traverse(ast, visitors);
  return {
    insertions: insertions
  };
};

exports.thorough = thorough;