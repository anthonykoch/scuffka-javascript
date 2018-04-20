// @flow

import * as types from '@babel/types';
import traverse from '@babel/traverse';
import { transform as babelTransform } from '@babel/core';
import generate from '@babel/generator';

import { normalizeError } from './utils';
import * as instrument from './instrument';

/**
 * @param input - The input to transform
 * @param options.filename - The name of the file
 */
const transform = (
    input: string,
    options: {
      instrumentor?: Instrumentor,
      filename: string,
      generateOpts?: {},
      transformOpts?: {},
    }
): Promise<TransformSuccess | TransformError> => {
  const {
    instrumentor='minimal',
    filename,
    generateOpts={},
    transformOpts={},
  } = options;

  let transformOutput = {};

  const traverser: Function =
    instrument.hasOwnProperty(instrumentor)
      ? instrument[instrumentor]
      : instrument.minimal;

  const promise = new Promise((resolve) => {
    transformOutput = babelTransform(input, {
      compact: true,
      code: false,
      ast: true,
      // Disabling comments makes it easier to get the line number from run error
      comments: false,
      filename: filename,
      babelrc: false,
      sourceMaps: true,
      ...transformOpts,
    });

    // console.log(require('util').inspect(transformOutput.ast, { depth: 20 }))

    const { insertions } = traverser({ ast: transformOutput.ast, types, traverse });

    const generated = generate(transformOutput.ast, {
      comments: false,
      sourceMaps: true,
      sourceFileName: filename,
      concise: true,
      sourceRoot: '/babel/generator',
      ...generateOpts,
    }, input);

    return resolve({
      code: generated.code,
      map: generated.map,
      error: null,
      originalError: null,
      source: input,
      insertions,
    });
  });

  return promise
    .catch((err) => {
      const loc: NullableLocation = err.loc;
      const error: {
        name: string,
        loc: NullableLocation,
        stack: string,
        message: string,
      } = {
        name: String(err.name),
        loc: loc,
        stack: String(err.stack),
        message: String(err.message),
      };

      return normalizeError(error, null, null)
        .then((error) => {
          error.stack = err.stack;

          return {
            insertions: null,
            code: null,
            map: null,
            source: input,
            error,
            originalError: err,
          };
        });
    })
};

export default transform;
