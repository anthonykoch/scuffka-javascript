// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js

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
    expr.callee.type === 'MemberExpression' &&
    expr.callee.object.name === 'console'   &&
    expr.callee.property.name === 'log'
  );
};

export const isIdentifier = (expr, name) => (expr.type === 'Identifier' && expr.name === name);
export const isUndefined = (expr) => isIdentifier(expr, 'undefined');
export const isNaN = (expr) => isIdentifier(expr, 'NaN');

export const isSymbol = (node) => (
    node.type === 'CallExpression' &&
    node.callee.name === 'Symbol'
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
      // type === 'ClassDeclaration'        ||
      type === 'ClassExpression'         ||
      // type === 'FunctionDeclaration'     ||
      type === 'FunctionExpression'      ||
      type === 'ArrowFunctionExpression'
    );
};

export default ({ types: t, ast, traverse }) => {
  const insertions = [];

  let badLoops = [];
  let id = -1;

  const addInsertionPoint = (node, origin) => {
    id += 1;

    insertions.push({
      id,
      // eslint-disable-next-line no-undef
      loc: origin?.loc,
      position: {
        // eslint-disable-next-line no-undef
        start: origin?.start,
        // eslint-disable-next-line no-undef
        end: origin?.end,
      }
    })

    return id;
  };

  const trackStatement = (id, node) => {
    const insertionId = addInsertionPoint(node, node);

    return ignore(
        t.expressionStatement(t.callExpression(t.identifier(VAR_INSPECT), [t.numericLiteral(insertionId)]))
      );
  };

  const track = (node, forceSequence=true) => {
    const insertionId = addInsertionPoint(node, node);
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

    if (forceSequence || isLiteral(node) || isCallable(node) || isUnaryVoid(node)) {
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

    ReturnStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },

    BreakStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },

    ContinueStatement(path) {
      path.insertBefore(trackStatement(path.node));
    },

    ForStatement(path) {
      path.node.test = track(path.node.test);

      if (path.node.update == null) {
        badLoops.push({
          type: path.node.type,
          loc: path.node.loc,
          position: path.node.position,
        });
      }
    },

    DoWhileStatement(path) {
      const test = path.node.test;

      path.node.test = track(path.node.test);

      if (test && test.value === true) {
        badLoops.push({
          type: test.type,
          loc: test.loc,
          position: test.position,
        });
      }
    },

    WhileStatement(path) {
      path.node.test = track(path.node.test);
    },

    IfStatement(path) {
      path.node.test = track(path.node.test);
    },

    SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant);
    },

    SwitchCase(path) {
      path.node.test = track(path.node.test);
    },

    LogicalExpression(path) {
      path.node.left = track(path.node.left);
      path.node.right = track(path.node.right);
    },

    ExpressionStatement(path) {
      const node = path.node;
      const expr = node.expression;

      if (isConsoleLog(expr) || isIgnored(node)) {
        return;
      }

      ignore(node);

      node.expression = track(expr, false);
    },

    VariableDeclaration(path) {
      const node = path.node;
      const length = node.declarations.length;

      for (let i = 0; i < length; i++) {
        const declaration = node.declarations[i];
        const init = declaration.init;

        if (init != null) {
          declaration.init = track(init, false);
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
