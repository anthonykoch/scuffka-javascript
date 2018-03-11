import assert from 'assert';
import util from 'util';

import { SourceMapConsumer } from 'source-map';

export const serialize = (expr) => util.inspect(expr);

/**
 * This shit is just crazy. I can't even explain it anymore.
 *
 * @param  {Error} err - An error object or mock error object
 * @param  {SourceMap} sourcemap - a sourcemap object
 * @param  {String} functionId - The name of the iife that executed the code.
 * @param  {String} env - The env the code was executed in
 * @return {Error}
 */
export const normalizeError = async (err, sourcemap, functionId, env) => {
  // Handle case where a literal is thrown or if there is no stack to parse
  // or if babel threw an error while parsing, resuling in no sourcemap
  if (err == null || err.stack == null || sourcemap == null) {
    // It's possible for err to not be an actual error object, so we use the Error toString
    // method to create the message.
    const message =
      err != null && typeof err.message === 'string'
        ? Error.prototype.toString.call(err)
        : String(err);

    const error = {
      stack: null,
      loc: err.loc || null,
      message,
      originalMessage: message,
    };

    return error;
  }

  let loc = err.loc ? err.loc : await getOriginalErrorPosition(err, sourcemap, functionId, env);

  const error = {
    name: err.name,
    stack: err.stack,
    loc: loc,
    message: err.message,
    originalMessage: err.message,
  };

  return error;
};

export const getOriginalErrorPosition = async (err, sourcemap, functionId) => {
  assert(typeof functionId === 'string', 'functionId should be a string')

  const errorLineText = getErrorLineFromStack(err.stack, functionId);
  const errorPosition = getErrorPositionFromStack(errorLineText);

  if (errorPosition != null) {
    return await SourceMapConsumer.with(sourcemap, null, (consumer) => {
      const pos = consumer.originalPositionFor({
        line: 1,
        column: errorPosition.column - 1,
      });

      return pos;
    });
  }

  return null;
}

/**
 * Returns the line error for the function id regex
 * @param  {String} stack - an error stack
 * @param  {String} functionId - The name of the function, should be as unique as possible
 * @return {String|null}
 */
export function getErrorLineFromStack(stack, functionId) {
  const lines = stack.split(/\r\n|[\r\n]/);
  const regExp = new RegExp(functionId);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (regExp.test(line)) {
      return line;
    }
  }

  return null;
}

export function getErrorPositionFromStack(lineText, lineOffset=0, columnOffset=0) {
  if (typeof lineText !== 'string') {
    return null;
  }

  const match  = lineText.match(/(\d+):(\d+)\)?$/);

  if ( match == null || ! (match.hasOwnProperty(1) && match.hasOwnProperty(2))) {
    return null;
  }

  const line   = Number(match[1]) - lineOffset;
  const column = Number(match[2]) - columnOffset;

  if (Number.isNaN(line)) {
    return null;
  }

  return { line, column };
}
