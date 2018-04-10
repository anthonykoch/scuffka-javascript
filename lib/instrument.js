// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js
// https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js

import { VAR_INSPECT } from './constants';

const IGNORE = Symbol();

const isIgnored = node => node.hasOwnProperty(IGNORE);

function ignore(first) {
  for (let i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }

  return first;
}

export const isConsoleLog = (expr) => {
  return (
    expr.type === 'CallExpression'          &&
    // eslint-disable-next-line no-undef
    expr.callee?.type === 'MemberExpression' &&
    // eslint-disable-next-line no-undef
    expr.callee?.object?.name === 'console'   &&
    // eslint-disable-next-line no-undef
    expr.callee?.property?.name === 'log'
  );
};

export const isIdentifier = (expr, name) => (expr.type === 'Identifier' && expr.name === name);
export const isUndefined = (expr) => isIdentifier(expr, 'undefined');
export const isNaN = (expr) => isIdentifier(expr, 'NaN');

export const isSymbol = (node) => (
    node.type === 'CallExpression' &&
    node.callee?.name === 'Symbol'
  );

export const isCall = (node) => node.type === 'CallExpression';

export const isUnaryVoid = node => (node.type === 'UnaryExpression' && node.operator === 'void');

export const isLiteral = (node) => {
  const { type } = node;

  return (
      type === 'NullLiteral'      ||
      type === 'StringLiteral'    ||
      type === 'ObjectExpression' ||
      type === 'ObjectLiteral'    ||
      type === 'ArrayExpression'  ||
      type === 'ArrayLiteral'     ||
      type === 'BooleanLiteral'   ||
      type === 'NumericLiteral'   ||
      type === 'Literal'          ||
      type === 'TemplateLiteral'  ||
      type === 'RegExpLiteral'    ||
      isUndefined(node)           ||
      isNaN(node)                 ||
      isSymbol(node)
    );
};

/**
 * Returns true if the node is a callable expression.
 * @param  {string} options.type
 * @return {Boolean}
 */
export const isCallable = ({ type }) => {
  return (
      type === 'ClassExpression'         ||
      type === 'FunctionExpression'      ||
      type === 'ArrowFunctionExpression'
    );
};

export default ({ types: t, ast, traverse }) => {
  const insertions = [];

  let badLoops = [];
  let id = -1;

  const addInsertionPoint = (node, isExpression=false, context) => {
    id += 1;

    insertions.push({
      type: node.type,
      context,
      isExpression,
      node,
      id,
    })

    return id;
  };

  const trackStatement = (node, context) => {
    const insertionId = addInsertionPoint(node, false, context);

    return ignore(
        t.expressionStatement(t.callExpression(t.identifier(VAR_INSPECT), [t.numericLiteral(insertionId)]))
      );
  };

  const track = (node, forceSequence=false, context=null) => {
    const insertionId = addInsertionPoint(node, true, context);
    // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const identifier = node.callee;

      // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column
      node.callee = t.sequenceExpression([
        t.numericLiteral(0),
        t.identifier(identifier.name)
      ]);
    }

    if (forceSequence || isCallable(node)) {
      // Don't track these since it's redundant information
      return t.sequenceExpression([
        t.callExpression(t.identifier(VAR_INSPECT), [t.numericLiteral(insertionId)]),
        node,
      ]);
    } else {
      return t.callExpression(t.identifier(VAR_INSPECT), [t.numericLiteral(id), node]);
    }
  };

  const visitors = {

    ConditionalExpression() {
      // TODO:
    },

    ReturnStatement(path) {
      if (path.node.argument != null) {
        path.node.argument = track(path.node.argument, false, 'ReturnStatement');
      } else {
        path.insertBefore(trackStatement(path.node, 'ReturnStatement'));
      }
    },

    BreakStatement(path) {
      path.insertBefore(trackStatement(path.node, 'BreakStatement'));
    },

    ContinueStatement(path) {
      path.insertBefore(trackStatement(path.node, 'ContinueStatement'));
    },

    ForStatement(path) {
      path.node.test = track(path.node.test, true, 'ForStatement.test');

      if (path.node.update == null || path.node.test == null) {
        badLoops.push({
          type: path.node.type,
          loc: path.node.loc,
          position: path.node.position,
        });
      }
    },

    ForOfStatement(path) {
      path.node.right = track(path.node.right, false, 'ForOfStatement');
    },

    DoWhileStatement(path) {
      const test = path.node.test;

      path.node.test = track(path.node.test, false, 'DoWhileStatement');

      if (test && test.value === true) {
        badLoops.push({
          type: test.type,
          loc: test.loc,
          position: test.position,
        });
      }
    },

    WhileStatement(path) {
      path.node.test = track(path.node.test, true, 'WhileStatement');
    },

    IfStatement(path) {
      path.node.test = track(path.node.test, true, 'IfStatement');
    },

    SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant, false, 'SwitchStatement');
    },

    SwitchCase(path) {
      path.node.test = track(path.node.test, false, 'SwitchCase');
    },

    LogicalExpression(path) {
      path.node.left = track(path.node.left, true, 'LogicalExpression');
      path.node.right = track(path.node.right, true, 'LogicalExpression');
    },

    ExpressionStatement(path) {
      const node = path.node;
      const expr = node.expression;

      if (isConsoleLog(expr) || isIgnored(node)) {
        return;
      }

      ignore(node);

      // TODO: Maybe add a right side to insertions because `users = []` yields
      //       `users = [] // []` in lively-browser or maybe just don't track
      //       the expression?

      node.expression = track(expr, false, 'ExpressionStatement');
    },

    VariableDeclaration(path) {
      if (path.parent.type === 'ForStatement') {
        return;
      }

      const node = path.node;
      const length = node.declarations.length;

      for (let i = 0; i < length; i++) {
        const declaration = node.declarations[i];
        const init = declaration.init;

        if (init != null) {
          declaration.init = track(init, false, 'VariableDeclaration');
        }
      }
    },

  };

  traverse(ast, visitors);

  return {
    insertions,
    badLoops,
  };
};
