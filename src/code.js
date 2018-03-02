// import * as babel from 'babel-standalone';
// import pluginWrapExpression from './babel-plugin';

import { normalizeError } from './utils';

const {
  VAR_INSPECT,
  VAR_NOTIFY_BLOCK,
  VAR_NOTIFY_MEMBER,
} = require ('./constants');

const esprima = require('esprima');
const escodegen = require('escodegen');
const estraverse = require('estraverse');
const { builders: t } = require('ast-types')

const IGNORE = Symbol();

function ignore() {
  for (let i = 0; i < arguments.length; i++) {
    arguments[i][IGNORE] = true;
  }
}

const isIgnored = node => node.hasOwnProperty(IGNORE);

const createLoc = (loc) =>
  t.objectExpression([
    t.property(
      'init',
      t.identifier('start'),
      t.objectExpression([
        t.property('init', t.identifier('column'), t.literal(loc.start.line)),
        t.property('init', t.identifier('line'), t.literal(loc.start.column)),
      ])
    ),

    t.property(
      'init',
      t.identifier('end'),
      t.objectExpression([
        t.property('init', t.identifier('column'), t.literal(loc.start.column)),
        t.property('init', t.identifier('line'), t.literal(loc.start.line)),
      ])
    ),

  ]);

const createPosition = (start, end) =>
  t.objectExpression([
    t.property(
      'init',
      t.identifier('start'),
      t.literal(Number(start)),
    ),

    t.property(
      'init',
      t.identifier('end'),
      t.literal(Number(end)),
    ),
  ]);

const expressionNotifier = (node, loc) => {
  return t.callExpression(
    t.identifier(VAR_INSPECT),
    [
      node,
      // Note: These need to be synced with the tracker's parameters
      createLoc(node.loc),
      createPosition(...node.range)
    ]
  );
};

const blockNotifier = () => {
  return t.expressionStatement(
    t.callExpression(
      t.identifier(VAR_NOTIFY_BLOCK),
      [],
    ),
  );
};

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
    isIdentifier('NaN')
  );
};

const isTrackableVariableDeclaration = (expr) => {
  return (
    expr.type === 'MemberExpression' ||
    expr.type === 'Identifier'
  );
};

export const visitors = {

  BlockStatement(node) {
    const expr = blockNotifier();

    ignore(expr);

    node.body.unshift(expr);
  },

  ExpressionStatement(node) {
    const expr = node.expression;

    if (isConsoleLog(expr)) {
      // TODO: Grab the contents of the console log
      return;
    } else if (isLiteral(expr) || isIgnored(node)) {
      return;
    }

    node.expression = expressionNotifier(expr, expr);

    return node;
  },

  VariableDeclaration(node) {
    const length = node.declarations.length;

    if (isIgnored(node)) {
      return path.skip();
    }

    for (let i = 0; i < length; i++) {
      const declaration = node.declarations[i];
      const init = declaration.init;

      if (init != null && isTrackableVariableDeclaration(init)) {
        declaration.init = expressionNotifier(init, init);
      }
    }
  },

};

export function visit(node, visitors) {
  const hasVisitor = visitors.hasOwnProperty(node.type);

  if (hasVisitor) {
    visitors[node.type](node);
  }

  return hasVisitor;
};

/**
 * @param  {String} input - The input to transform
 * @param  {String} options.scriptType - Either 'module' or 'script'
 * @param  {String} options.filename - The name of the file
 * @return {Object}
 */
export const transform = (input, options) => {
  const { scriptType='module' } = options;

  try {
    const fn = scriptType === 'module' ? 'parseModule' : 'parseScript';

    const ast = esprima[fn](input, { range: true, loc: true, });

    estraverse.replace(ast, {
      enter(node, parent) {
        visit(node, visitors);
      },
    });

    const output = escodegen.generate(ast, {
      format: {
        indent: {
          style: '',
        },
        space: '',
        newline: '',
      },
      sourceMap: options.filename, // true or string
      sourceMapRoot: '/', // Root directory for sourceMap
      sourceMapWithCode: true, // Set to true to include code AND source map
      sourceContent: input, // If set, embedded in source map as code
    });

    return Object.assign({}, output, {
      map: output.map.toString(),
    });
  } catch (err) {
    const error = {
      name: err.name,
      loc: {
        line: err.lineNumber,
        column: err.column,
      },
      stack: err.stack,
      message: err.message,
    };

    const finalError = normalizeError(error, null, null, null);

    return {
      error: finalError,
      originalError: err,
    };
  }
};
