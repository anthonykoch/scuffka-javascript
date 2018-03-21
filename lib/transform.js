import * as types from '@babel/types';
import traverse from '@babel/traverse';
import { transform as babelTransform } from '@babel/core';
import generate from '@babel/generator';

import assert from 'assert';

import { normalizeError } from './utils';
import instrument from './instrument';

/**
 * @param  {String} input - The input to transform
 * @param  {String} options.scriptType - Either 'module' or 'script'
 * @param  {String} options.filename - The name of the file
 * @return {Object}
 */
export default async (input, { filename, generateOpts, transformOpts }={}) => {
  assert(typeof filename === 'string', `{string} options.filename, got ${filename}`)

  let transformOutput = {};

  try {
    transformOutput = babelTransform(input, {
      compact: true,
      // Disabling comments makes it easier to get the line number from run error
      code: false,
      ast: true,
      comments: false,
      filename: filename,
      babelrc: false,
      sourceMaps: true,
      ...transformOpts,
    });

    const { insertions, badLoops } = instrument({ ast: transformOutput.ast, types, traverse });

    return {
      code: null,
      map: null,
      error: null,
      ...generate(transformOutput.ast, {
        comments: false,
        sourceMaps: true,
        sourceFileName: filename,
        concise: true,
        // minified: true,
        sourceRoot: '/babel/generator',
        ...generateOpts,
      }, input),
      ...{
        source: input,
        insertions,
        badLoops,
      }
    };
  } catch (err) {
    const error = {
      name: err.name,
      loc: {
        // eslint-disable-next-line no-undef
        line: err?.loc?.line,
        // eslint-disable-next-line no-undef
        column: err?.loc?.column,
      },
      stack: err.stack,
      message: err.message,
    };

    const finalError = await normalizeError(error, null, null, null);

    return {
      code: null,
      map: null,
      error: finalError,
      originalError: err,
    };
  }
};
