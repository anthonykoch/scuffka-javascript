// @flow

import { VAR_INSPECT } from './constants';

// Keep in mind
// https://github.com/latentflip/loupe/blob/master/lib/instrument-code.js
// https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js

const IGNORE = Symbol('IGNORE');

const isIgnored = node => node.hasOwnProperty(IGNORE);

export class Insertion {

  id: number;
  node: {};
  context: string;
  type: string;

  constructor(id: number, node: { type: string }, context: string) {
    this.id = id;
    this.node = node;
    this.context = context;
    this.type = node.type;
  }

}

function ignore(...nodes: Object[]) {
  for (let i = 0; i < nodes.length; i++) {
    nodes[i][IGNORE] = true;
  }

  return nodes[0];
}

export const isConsoleLog = (expr: Object) => {
  return (
    expr.type === 'CallExpression' &&
    expr.callee &&
    expr.callee.type === 'MemberExpression' &&
    expr.callee.object &&
    expr.callee.object.name === 'console' &&
    expr.callee.property &&
    expr.callee.property.name === 'log'
  );
};

export const isIdentifier = (expr: Object, name: string) => (expr.type === 'Identifier' && expr.name === name);
export const isUndefined = (expr: Object) => isIdentifier(expr, 'undefined');
export const isNaN = (expr: Object) => isIdentifier(expr, 'NaN');

export const isSymbol = (node: Object) => (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.name === 'Symbol'
  );

export const isCall = (node: Object) => node.type === 'CallExpression';

export const isUnaryVoid = (node: Object) => (node.type === 'UnaryExpression' && node.operator === 'void');

export const isLiteral = (node: Object) => {
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
export const isCallable = ({ type }: { type: string }) => {
  return (
      type === 'ClassExpression'         ||
      type === 'FunctionExpression'      ||
      type === 'ArrowFunctionExpression'
    );
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
export const minimal = ({
    types: t,
    ast,
    traverse,
  }: {
    types: any,
    ast: Object,
    traverse: Function
  }) => {
  const insertions = [];

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
    },

    ForOfStatement(path) {
      path.node.right = track(path.node.right, false, 'ForOfStatement');
    },

    DoWhileStatement(path) {
      path.node.test = track(path.node.test, false, 'DoWhileStatement');
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
export const thorough = ({
    types: t,
    ast,
    traverse,
  }: {
    types: any,
    ast: Object,
    traverse: Function
  }) => {
  const insertions: Array<Insertion> = [];

  let id = -1;

  const addInsertionPoint = (node, context: string) => {
    id += 1;

    insertions.push(new Insertion(id, node, context));

    return id;
  };

  const track = (node, context: string) => {
    // console.log(node, context)

    if (isInstrumented(node)) {
      return node;
    }

    const insertionId = addInsertionPoint(node, context);
    // console.log('is', node.type, isLiteral(node) || isCallable(node))

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const number = t.numericLiteral(0);

      // Fixes an issue where a call expression that has an undeclared identifier
      // creates a stack trace with incorrect line/column
      node.callee = t.sequenceExpression([
        number,
        t.identifier(node.callee.name)
      ]);

      ignore(node.callee, number);
    }

    const name = t.identifier(VAR_INSPECT);
    const number = t.numericLiteral(insertionId);
    const call = t.callExpression(name, [number, node]);

    ignore(call, name, number);

    return call;
  };

  const isInstrumented = (node) => {
    // console.log(node)
    if (node.hasOwnProperty(IGNORE)) {
      return true;
    } else if (
        node.type === 'CallExpression' &&
        node.callee &&
        node.callee.type === 'Identifier' &&
        node.callee.name === VAR_INSPECT
      ) {
      return true;
    } else if (
        node.type === 'Identifier' &&
        node.name === VAR_INSPECT
      ) {
      return true;
    }

    return false;
  };

  const trackStatement = (node, context: string) => {
    if (isInstrumented(node)) {
      return node;
    }

    const insertionId = addInsertionPoint(node, context);
    const name = t.identifier(VAR_INSPECT);
    const number = t.numericLiteral(insertionId);
    const call = t.callExpression(name, [number, node]);
    const expressionStatement = t.expressionStatement(call);

    ignore(expressionStatement, call, name, number);

    return call;
  };

  const trackProp =
    (prop, type) =>
      (path): void => path.node[prop] = track(
        path.node[prop],
        typeof type === 'string'
          ? type
          : path.node.type
      );

  const trackRight = trackProp('right');
  // const trackLeft = trackProp('left');
  const trackTest = trackProp('test');

  const trackSelf = (path): void => {
    if (!isInstrumented(path.parent)) {
      path.replaceWith(track(path.node, path.parent.type))
    }
  };

  const trackArgument = (path): void => {
    if (path.node.argument != null && !isInstrumented(path.node.argument)) {
      path.node.argument = track(path.node.argument, path.node.type);
    }
  };

  const trackBefore = (path): void => {
    path.insertBefore(trackStatement(path.node, path.node.type));
  };

  const visitors = {

    Literal(path) {
      if (!isInstrumented(path.parent)) {
        path.replaceWith(track(path.node, path.parent.type));
        // return console.log(path.node.value);
      }

    },

    MemberExpression(path) {
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

    ReturnStatement(path) {
      if (path.node.argument != null && !isInstrumented(path.node.argument)) {
        path.node.argument = track(path.node.argument, 'ReturnStatement');
      }
    },

    BreakStatement: trackBefore,

    ContinueStatement: trackBefore,

    ForStatement(path) {
      path.node.test = track(path.node.test, 'ForStatement.test');
      path.node.update = track(path.node.update, 'ForStatement.update');
    },

    ForOfStatement: trackRight,

    DoWhileStatement: trackTest,

    WhileStatement: trackTest,

    IfStatement: trackTest,

    SwitchCase: trackTest,

    SwitchStatement(path) {
      path.node.discriminant = track(path.node.discriminant, 'SwitchStatement');
    },

    LogicalExpression(path) {
      path.node.left = track(path.node.left, 'LogicalExpression');
      path.node.right = track(path.node.right, 'LogicalExpression');
    },

    BinaryExpression(path) {
      path.node.left = track(path.node.left, 'LogicalExpression');
      path.node.right = track(path.node.right, 'LogicalExpression');
    },

    CallExpression(path) {
      for (let i = 0; i < path.node.arguments; i++) {
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

    AssignmentExpression(path) {
      path.node.right = track(path.node.right, path.node.type);

      if (!isInstrumented(path.parent)) {
        // console.log(path.node == null)
        path.replaceWith(track(path.node, path.parent.type));
      }
    },

    ArrayExpression(path) {
      for (let i = 0; i < path.node.elements; i++) {
        path.node.elements[i] = track(path.node.elements, 'ArrayExpression');
      }

      path.replaceWith(track(path.node, path.parent.type));
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
          declaration.init = track(init, 'VariableDeclaration');
        }
      }
    },

  };

  traverse(ast, visitors);

  return {
    insertions,
  };
};
