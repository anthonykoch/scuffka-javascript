// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js

import {
  VAR_INSPECT,
  VAR_NOTIFY_BLOCK,
  VAR_NOTIFY_MEMBER,
} from './constants';

const IGNORE = Symbol();

const isIgnored = node => node.hasOwnProperty(IGNORE);

function ignore() {
  for (let i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }
}

const isConsoleLog = (expr) => {
  return (
    expr.type === 'CallExpression'          &&
    expr.callee.type === 'MemberExpression' &&
    expr.callee.object.name === 'console'   &&
    expr.callee.property.name === 'log'
  );
};

const isIdentifier = (expr, name) => (expr.type === 'Identifier' && expr.name === name);
const isUndefined = (expr) => isIdentifier(expr, 'undefined');

const isLiteral = (expr) => {
  const { type } = expr;

  return (
    type === 'NumericLiteral'  ||
    type === 'StringLiteral'   ||
    type === 'BooleanLiteral'  ||
    type === 'TemplateLiteral' ||
    type === 'RegExpLiteral'   ||
    type === 'NullLiteral'     ||
    isUndefined(expr)          ||
    isIdentifier(expr, 'NaN')
  );
};

const isTrackableVariableDeclaration = (expr) => {
  return (
    expr.type === 'MemberExpression' ||
    expr.type === 'NewExpression'    ||
    expr.type === 'Identifier'
  );
};

export default ({ types: t, ast, traverse }) => {
  const insertions = [];

  let id = -1;

  const addInsertionPoint = (node, origin) => {
    id += 1;

    insertions.push({
      id,
      loc: origin?.loc,
      position: {
        start: origin?.start,
        end: origin?.end,
      }
    })

    return id;
  };

  const expressionNotifier = (node) => {
    const insertionId = addInsertionPoint(node, node);

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const identifier = node.callee;

      // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column
      node.callee = t.sequenceExpression([
        t.numericLiteral(0),
        t.identifier(identifier.name)
      ]);
    }

    return t.callExpression(
      t.identifier(VAR_INSPECT),
      [
        t.numericLiteral(insertionId),
        node,
      ]
    );
  };

  const blockNotifier = (type) => {
    const insertionId = addInsertionPoint();

    return t.expressionStatement(
      t.callExpression(
        t.identifier(VAR_NOTIFY_BLOCK),
        [
          t.numericLiteral(insertionId),
        ],
      ),
    );
  };

  const visitors = {

    BlockStatement(path) {
      // const node = path.node;
      // const start = blockNotifier(id);
      // const end = blockNotifier(id);

      // ignore(start, end);

      // node.body.unshift(start)
      // node.body.push(end)
    },

    ExpressionStatement(path) {
      const node = path.node;
      const expr = node.expression;

      if (isConsoleLog(expr)) {
        return;
      } else if (isLiteral(expr) || isIgnored(node)) {
        return;
      }

      node.expression = expressionNotifier(expr);
    },

    VariableDeclaration(path) {
      const node = path.node;
      const length = node.declarations.length;

      if (isIgnored(node)) {
        return path.skip();
      }

      for (let i = 0; i < length; i++) {
        const declaration = node.declarations[i];
        const init = declaration.init;

        if (init != null) {
          declaration.init = expressionNotifier(init);
        }
      }
    },

  };

  traverse(ast, visitors);

  return {
    insertions,
  };
};
