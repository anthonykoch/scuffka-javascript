// @flow

import vm from 'vm';
import path from 'path';
import assert from 'assert';
// $FlowFixMe
import Module from 'module';

import random from 'lodash/random';

import {
  VAR_INSPECT,
  VAR_MEMBER_OBJECT_INTERP,
  VAR_MEMBER_PROPERTY_INTERP,
} from './constants';

import { normalizeError } from './utils';

export const FUNCTION_ID = `LIVELY_INSPECT_${random(1000000, 1999999)}`;

export const wrap = (
    code: string,
    args: Array<string>,
    { id='', closure=false }: { id: string, closure?: boolean }={}
  ) => {
  const parameters = args.map(str => str.replace(/\s/g, '')).join(', ');
  const header =
    `${closure ? 'return ' : ';'}(function ${id}(${parameters}) {`;
  const footer = `});`;

  return {
    header,
    footer,
    code: `${header}\n${code}\n${footer}`,
  };
};

/**
 * Executes code inside an anonymous function.
 *
 * @param  {String} input
 * @param  {Object} options
 * @return {any} Returns whatever the anonymous function returns.
 */
export const browserExec = (
    input: string,
    options: {
      args: Array<any>,
      functionId: string,
      parameters: Array<string>,
      thisBinding: any,
    }): Promise<any> => {
  const {
    args=[],
    parameters=[],
    thisBinding,
  } = options;

  // $FlowFixMe
  const fn: Function = Function(wrap(input, parameters, {
    id: options.functionId,
    closure: true,
  }).code)();

  // console.log(fn.toString());

  return new Promise((resolve) => resolve(fn.call(thisBinding, ...args)));
};

/**
 * Executes code in the same environment from where its called.
 *
 * @param  {String} input - The code to execute
 * @param  {Object} options
 * @return {any} - Returns whatever the function returns
 */
export const nodeExec = (
    input: string,
    options: {
      filename: string,
      args: Array<any>,
      parameters: Array<string>,
      thisBinding: any,
      functionId: string,
      lineOffset?: number,
      columnOffset?: number,
    }
  ): Promise<any> => {
  assert(options, 'options must be an object');

  const {
    filename,
    args=[],
    parameters=[],
    thisBinding,
    functionId,
  } = options;

  const wrapper = wrap(input, parameters, {
    id: functionId,
  });

  const fn = vm.runInThisContext(wrapper.code, {
    filename,
    lineOffset: options.lineOffset,
    columnOffset: options.columnOffset,
  });

  return new Promise((resolve) => resolve(fn.call(thisBinding, ...args)));
};

export const executors = {
  node: nodeExec,
  browser: browserExec,
};

export const defaultExecutor = browserExec;

/**
 * Executes input in a a common js style wrapper. The module passed needs two properties,
 * require and exports, which are used to simulate a common js environment. It does not
 * wait for setTimeouts or promises to finish before returning.
 *
 * To be notified when a coverage point has been fired, "track" may be passed. "track"
 * is called with three arguments:
 *
 * 1. id - The id of the insertion point
 * 2. hasValue - Whether or not an expression is being tracked at that location.
 * 3. value - The runtime value for the expression, may be undefined.
 *
 * The env has two option, browser and node. I determines what will be used to execute
 * the code, either an anonymous function (browser) or the node VM module (node). With
 * node, the code is executed in the same environment from where it is called from.
 *
 * @param input - The code to be executed
 * @param options.module
 * @param options.functionId
 * @param options.env - Either 'browser' or 'node'
 * @param options.sourcemap - The sourcemap for the input, used to get proper locations from exceptions
 * @param options.notifiers
 */

export const run = (input: string, options: {
    module?: NodeModule,
    track?: (id: number, hasValue: boolean, value: any) => void,
    __filename: string,
    __dirname: string,
    env: Executor,
    functionId?: string,
    sourcemap: ?{};
}): Promise<{
  finish: true,
  error: null,
} | {
  finish: false,
  error: {},
}> => {

  const {
    module: _module={
      require() {},
      exports: {},
    },
    track,
    __filename,
    __dirname,
    env='browser',
    functionId=FUNCTION_ID,
    sourcemap,
  } = options;

  const exec =
    executors.hasOwnProperty(env)
      ? executors[env]
      : defaultExecutor;

  return exec(input, {
    functionId,
    filename: __filename,
    parameters:  [
      'exports',
      'require',
      'module',
      '__filename',
      '__dirname',
      VAR_INSPECT,
      VAR_MEMBER_OBJECT_INTERP,
      VAR_MEMBER_PROPERTY_INTERP,
    ],
    args: [
      _module.exports,
      _module.require,
      _module,
      __filename,
      __dirname,
      function onCoverageNotification(id: number, value: any) {
        const hasValue = arguments.hasOwnProperty(1);

        if (typeof track === 'function') {
          track(id, hasValue, value)
        }

        return value;
      },
      undefined,
      undefined,
    ],
    thisBinding: _module.exports,
  })
    .then(() => ({
      finish: true,
      error: null,
    }))
    .catch((err) =>
      normalizeError(err, sourcemap, functionId)
        .then(error => {
          return {
            finish: false,
            error,
          };
        })
    );
};

/**
 * Returns a node module object. Only works inside a node environment.
 */
export const createNodeModule = (filename: string) => {
  if (filename === '.') {
    return new Module('.', null);
  }

  assert(typeof filename === 'string', 'filename must be a string');
  assert(path.isAbsolute(filename), 'filename must be absolute');

  return new Module(filename, null);
};
