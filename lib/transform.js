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
export default async (input, { filename }={}) => {
  assert(typeof filename === 'string', `{string} options.filename, got ${filename}`)

  let output = {};

  try {
    output = babelTransform(input, {
      compact: true,
      // Disabling comments makes it easier to get the line number from run error
      code: false,
      ast: true,
      comments: false,
      filename: filename,
      babelrc: false,
      sourceMaps: true,
    });

    const { insertions } = instrument({ ast: output.ast, types, traverse });

    output = Object.assign({},
        generate(output.ast, {
          comments: false,
          sourceMaps: true,
          sourceFileName: filename,
          concise: true,
          // minified: true,
          sourceRoot: '/babel/generator',
        }, input),
        {
          source: input,
          insertions,
        }
      );

  } catch (err) {
    const error = {
      name: err.name,
      loc: {
        line: err.loc.line,
        column: err.loc.column,
      },
      stack: err.stack,
      message: err.message,
    };

    const finalError = await normalizeError(error, null, null, null);

    return {
      error: finalError,
      originalError: err,
    };
  }

  return output;
};
