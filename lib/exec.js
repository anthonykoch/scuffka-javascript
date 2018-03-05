import vm from 'vm';
import path from 'path';
import assert from 'assert';
import Module from 'module';

import random from 'lodash/random';

import { VAR_INSPECT, VAR_NOTIFY_BLOCK } from './constants';
import { normalizeError } from './utils';

const FUNCTION_ID = `LIVELY_INSPECT_${random(1000000, 1999999)}`;

const noop = () => {};

export const wrap = (code, args, { id='', closure=false }) => {
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

export const browserExec = (input, options) => {
  const {
    args=[],
    parameters=[],
    thisBinding,
  } = options;

  const fn = Function(wrap(input, parameters, {
    id: options.functionId,
    closure: true,
  }).code)();

  // console.log(fn.toString());

  return fn.call(thisBinding, ...args);
};

/**
 * Executes code in the same environment
 *
 * @param  {String} input - The code to execute
 * @param  {Object} options
 * @return {any} - Returns whatever the function returns
 */
export const nodeExec = (input, options) => {
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

  // console.log('Input:', wrapper.code)

  const fn = vm.runInThisContext(wrapper.code, {
    filename,
    lineOffset: options.lineOffset,
    columnOffset: options.columnOffset,
  });

  return fn.call(thisBinding, ...args);
};

export const envs = {
  node: nodeExec,
  browser: browserExec,
};

/**
 * Executes the input. If an error occurs, returns the error information, else
 * returns the thing.
 *
 * @param  {String} input.code - The code to be executed
 * @param  {Object} [input.map] - The map for the transformed input
 * @param  {Function} tracker
 */
export const run = (input, options={}) => {
  const {
    module: _module,
    tracker,
    __filename,
    __dirname,
    env='browser',
    functionId=FUNCTION_ID,
    sourcemap=null,
  } = options;

  const exec = envs[env] || browserExec;

  try {
    exec(input, {
      functionId,
      filename: __filename,
      parameters:  [
        'exports',
        'require',
        'module',
        '__filename',
        '__dirname',
        VAR_INSPECT,
        VAR_NOTIFY_BLOCK,
      ],
      args: [
        _module.exports,
        _module.require,
        _module,
        __filename,
        __dirname,
        tracker,
        noop,
      ],
      thisBinding: _module.exports,
    });

    return {
      finish: true,
    };
  } catch (err) {
    const error = normalizeError(err, sourcemap, functionId, env);

    return {
      error,
    };
  }
};


/**
 * Returns a node module object
 * @param {String} file
 * @return {Module}
 */
export const createNodeModule = (filename) => {
  if (filename === '.') {
    return new Module('.', null);
  }

  assert(typeof filename === 'string', 'filename must be a string');
  assert(path.isAbsolute(filename), 'filename must be absolute');

  return new Module(filename, null);
};
