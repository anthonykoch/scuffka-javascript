"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.thorough = exports.minimal = exports.Insertion = exports.isCallable = exports.isLiteral = exports.isUnaryVoid = exports.isCall = exports.isSymbol = exports.isNaN = exports.isUndefined = exports.isIdentifier = exports.isConsoleLog = void 0;

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _constants = require("./constants");

var IGNORE = (0, _symbol.default)('IGNORE');

var isIgnored = function isIgnored(node) {
  return node.hasOwnProperty(IGNORE);
};

var isInstrumentFunction = function isInstrumentFunction(node) {
  return node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier' && node.callee.name === _constants.VAR_INSPECT;
};

var isInstrumentIdentifier = function isInstrumentIdentifier(node) {
  return node.type === 'Identifier' && node.name === _constants.VAR_INSPECT;
};

var isInstrumented = function isInstrumented(node) {
  return isIgnored(node) || isInstrumentFunction(node) || isInstrumentIdentifier(node);
};

function ignore() {
  for (var _len = arguments.length, nodes = new Array(_len), _key = 0; _key < _len; _key++) {
    nodes[_key] = arguments[_key];
  }

  for (var i = 0; i < nodes.length; i++) {
    nodes[i][IGNORE] = true;
  }

  return nodes[0];
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
 */


exports.isLiteral = isLiteral;

var isCallable = function isCallable(_ref) {
  var type = _ref.type;
  return type === 'ClassExpression' || type === 'FunctionExpression' || type === 'ArrowFunctionExpression';
};

exports.isCallable = isCallable;

var Insertion = function Insertion(id, node, context) {
  this.id = id;
  this.node = node;
  this.context = context;
  this.type = node.type;
};
/**
 * Transforms an AST to track a minimal amount of expressions. This transform
 * attempts to insert as few insertions as possible for better performance.
 *
 * @param options.types - babel types
 * @param options.ast - An ast to traverse
 * @param options.traverse - The babel traverser function
 */


exports.Insertion = Insertion;

var minimal = function minimal(_ref2) {
  var t = _ref2.types,
      ast = _ref2.ast,
      traverse = _ref2.traverse;
  var insertions = [];
  var id = -1;

  var addInsertionPoint = function addInsertionPoint(node, isExpression, context) {
    if (isExpression === void 0) {
      isExpression = false;
    }

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
    var identifier = t.identifier(_constants.VAR_INSPECT);
    var number = t.numericLiteral(insertionId);
    var call = t.callExpression(identifier, [number]);
    var statement = t.expressionStatement(call);
    ignore(statement, call, identifier, number, call);
    return statement;
  };

  var track = function track(node, forceSequence, context) {
    if (forceSequence === void 0) {
      forceSequence = false;
    }

    var insertionId = addInsertionPoint(node, true, context); // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column
      var number = t.numericLiteral(0);
      var identifier = t.identifier(node.callee.name);
      node.callee = t.sequenceExpression([number, identifier]);
      ignore(node.callee, number, identifier);
    }

    if (forceSequence || isCallable(node)) {
      // Don't track these since it's redundant information
      return t.sequenceExpression([t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(insertionId)]), node]);
    } else {
      return t.callExpression(t.identifier(_constants.VAR_INSPECT), [t.numericLiteral(id), node]);
    }
  };

  var visitors = {
    // ConditionalExpression(path: Path) {
    // TODO:
    // trackSelf(path);
    // },
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
      if (path.node.test != null) {
        path.node.test = track(path.node.test, true, 'ForStatement.test');
      }

      if (path.node.update != null) {
        path.node.update = track(path.node.update, true, 'ForStatement.update');
      }
    },
    ForOfStatement: function ForOfStatement(path) {
      path.node.right = track(path.node.right, false, 'ForOfStatement');
    },
    DoWhileStatement: function DoWhileStatement(path) {
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
      if (path.node.test != null) {
        path.node.test = track(path.node.test, false, 'SwitchCase');
      }
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
    insertions.push(new Insertion(id, node, context));
    return id;
  };

  var lastLoc = null;
  /**
   * Wraps an expression in a notifier function and returns the
   * notifier function
   */

  var track = function track(node, context) {
    lastLoc = node && node.loc ? node.loc : lastLoc; // To make debugging easier
    // if (node == null) {
    // console.log(node, context)
    // console.log(lastLoc)
    // }
    // console.log(node.type)

    if (isInstrumented(node) || isIgnored(node)) {
      return node;
    }

    var insertionId = addInsertionPoint(node, context);

    if (node.type === 'CallExpression') {
      if (node.callee.type === 'Identifier') {
        node.callee = track(t.identifier(node.callee.name), 'CallExpression');
      } else if (node.callee.type === 'MemberExpression') {
        // Fixes an issue where wrapping a member expression in a call function causes
        // `this` to be means
        var propertyInterpIdentifier = t.identifier(_constants.VAR_MEMBER_PROPERTY_INTERP);
        var objectInterpIdentifier = t.identifier(_constants.VAR_MEMBER_OBJECT_INTERP); // THINKME: Is it really necessary to pass on the arguments if we know it's not going
        //          to be a function?

        var objectAssignment = t.assignmentExpression('=', objectInterpIdentifier, node.callee.object);
        var objectAssignmentProperty = t.memberExpression(objectAssignment, node.callee.property, node.callee.computed);
        var propertyAssignment = t.assignmentExpression('=', propertyInterpIdentifier, objectAssignmentProperty);
        var interpCall = t.callExpression(propertyInterpIdentifier, []);
        var memberIdentifier = t.identifier('call');
        var member = t.memberExpression(propertyInterpIdentifier, memberIdentifier);
        var memberCall = t.callExpression(member, [objectInterpIdentifier].concat(node.arguments));
        var unary = t.unaryExpression('typeof', propertyInterpIdentifier);
        var string = t.stringLiteral('function');
        var bin = t.binaryExpression('===', unary, string);
        var condition = t.conditionalExpression(bin, memberCall, interpCall);
        var seq = t.sequenceExpression([propertyAssignment, condition]);
        var paren = t.parenthesizedExpression(seq);
        ignore(string, member, memberCall, memberIdentifier, bin, unary, condition, paren, objectAssignmentProperty, objectAssignment, objectInterpIdentifier, propertyAssignment, propertyInterpIdentifier);
        node = seq;
      }
    } else if (node.type === 'UpdateExpression') {
      var identifier = t.identifier(_constants.VAR_INTERP);
      var assignment = t.assignmentExpression('=', identifier, node);
      var number = t.numericLiteral(1);
      var call = createInspectCall(node.prefix ? ignore(t.binaryExpression(node.operator === '--' ? '+' : '-', identifier, number)) : identifier, insertionId);

      var _seq = t.sequenceExpression([assignment, call]);

      ignore(node, _seq, number, identifier, assignment);
      return _seq;
    }

    return createInspectCall(node, insertionId);
  };

  var createInspectCall = function createInspectCall(node, insertionId) {
    var name = t.identifier(_constants.VAR_INSPECT);
    var number = t.numericLiteral(insertionId);
    var call = t.callExpression(name, [number, node]);
    return ignore(call, name, number);
  };

  var trackProp = function trackProp(prop) {
    return function (path) {
      return path.node[prop] = track(path.node[prop], path.node.type);
    };
  };

  var trackRight = trackProp('right');
  var trackLeft = trackProp('left');
  var trackTest = trackProp('test');
  /**
   * Wraps an expression itself and checks the parent node that it
   * has not already been instrumented.
   */

  var trackSelf = function trackSelf(path) {
    if (!isInstrumented(path.parent)) {
      path.replaceWith(track(path.node, path.parent.type));
    }

    return path.node;
  };

  var trackArgument = function trackArgument(path) {
    if (path.node.argument != null && !isInstrumented(path.node.argument)) {
      path.node.argument = track(path.node.argument, path.node.type);
    }

    return path.node.argument;
  };

  var trackRightVisitor = function trackRightVisitor(path) {
    trackRight(path);
  };

  var trackTestVisitor = function trackTestVisitor(path) {
    trackTest(path);
  };

  var trackSelfVisitor = function trackSelfVisitor(path) {
    trackSelf(path);
  };

  var visitors = {
    Identifier: function Identifier(path) {
      if (path.isReferencedIdentifier()) {
        trackSelf(path);
      }
    },
    Literal: function Literal(path) {
      trackSelf(path);
    },
    ConditionalExpression: function ConditionalExpression(path) {
      if (isIgnored(path.node)) {
        return;
      }

      path.node.test = track(path.node.test, 'ConditionalExpression.test');
      path.node.consequent = track(path.node.consequent, 'ConditionalExpression.consequent');
      path.node.alternate = track(path.node.alternate, 'ConditionalExpression.alternate');
      trackSelf(path);
    },
    NewExpression: function NewExpression(path) {
      for (var i = 0, length = path.node.arguments.length; i < length; i++) {
        path.node.arguments[i] = track(path.node.arguments[i], 'NewExpression.arguments');
      }

      trackSelf(path);
    },
    CallExpression: function CallExpression(path) {
      // We have to check here that we aren't instrumenting the notifier function
      if (!isInstrumentFunction(path.node)) {
        for (var i = 0, length = path.node.arguments.length; i < length; i++) {
          path.node.arguments[i] = track(path.node.arguments[i], 'CallExpression.arguments');
        }
      }

      trackSelf(path);
    },
    MemberExpression: function MemberExpression(path) {
      if (path.node.computed) {
        path.node.property = track(path.node.property, 'MemberExpression.property');
      }

      path.node.object = track(path.node.object, 'MemberExpression.object');
      trackSelf(path);
    },
    ReturnStatement: function ReturnStatement(path) {
      trackArgument(path);
    },
    ObjectProperty: function ObjectProperty(path) {
      // ignore string literal object literal keys
      if (!path.node.computed) {
        ignore(path.node.key);
      }
    },
    ForStatement: function ForStatement(path) {
      if (path.node.test != null) {
        path.node.test = track(path.node.test, 'ForStatement.test');
      }

      if (path.node.update) {
        path.node.update = track(path.node.update, 'ForStatement.update');
      }
    },
    ForOfStatement: trackRightVisitor,
    DoWhileStatement: trackTestVisitor,
    WhileStatement: trackTestVisitor,
    IfStatement: trackTestVisitor,
    SwitchCase: function SwitchCase(path) {
      if (path.node.test == null) {
        return;
      }

      trackTest(path);
    },
    SwitchStatement: function SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant, 'SwitchStatement');
    },
    LogicalExpression: function LogicalExpression(path) {
      path.node.left = trackLeft(path);
      path.node.right = trackRight(path);
      trackSelf(path);
    },
    BinaryExpression: function BinaryExpression(path) {
      path.node.left = trackLeft(path);
      path.node.right = trackRight(path);
      trackSelf(path);
    },
    ClassExpression: trackSelfVisitor,
    UnaryExpression: trackSelfVisitor,
    UpdateExpression: function UpdateExpression(path) {
      trackSelf(path);
    },
    ThisExpression: trackSelfVisitor,
    FunctionExpression: trackSelfVisitor,
    ArrowFunctionExpression: trackSelfVisitor,
    ObjectExpression: trackSelfVisitor,
    AwaitExpression: function AwaitExpression(path) {
      trackArgument(path);
      trackSelf(path);
    },
    AssignmentExpression: function AssignmentExpression(path) {
      path.node.right = track(path.node.right, path.node.type);
      ignore(path.node.left);
      trackSelf(path);
    },
    ArrayExpression: function ArrayExpression(path) {
      for (var i = 0; i < path.node.elements; i++) {
        path.node.elements[i] = track(path.node.elements, 'ArrayExpression.elements');
      }

      trackSelf(path);
    },
    VariableDeclaration: function VariableDeclaration(path) {
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