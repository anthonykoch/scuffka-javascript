// @flow

import util from 'util';

import { SourceMapConsumer } from 'source-map';

export const serialize = (expr: any) => util.inspect(expr);

/**
 * This shit is just crazy. I can't even explain it anymore
 *
 * TODO: Split into three separate functions that:
 *       1. handle runtime errors with a sourcemap
 *       2. handle runtime errors without a sourcemap
 *       3. Handles transform errors
 *
 * @param err - An error object or mock error object
 * @param sourcemap - a sourcemap object
 * @param functionId - The name of the iife that executed the code.
 */
export const normalizeError = (
    err: any,
    sourcemap: ?any,
    functionId: ?string,
  ): Promise<{}> => {
  const name = err ? err.name : null;
  const originalLoc = err ? err.loc : null;

  // Handle case where a literal is thrown or if there is no stack to parse
  // or if babel threw an error while parsing, resuling in no sourcemap
  if (functionId == null || err == null || err.stack == null || sourcemap == null) {
    // It's possible for err to not be an actual error object, so we use the Error toString
    // method to create the message.
    const message =
      err != null && typeof err.message === 'string'
        ? Error.prototype.toString.call(err)
        : String(err);

    const error = {
      name,
      stack: null,
      loc: originalLoc,
      message,
      originalMessage: message,
    };

    return Promise.resolve(error);
  }

  const error = {
    name,
    stack: err.stack,
    loc: err.loc,
    message: err.message,
    originalMessage: err.message,
  };


  if (err.loc != undefined) {
    return Promise.resolve(error);
  }

  return getOriginalErrorPosition(err, sourcemap, functionId)
    .then((loc) => {
      if (Number.isFinite(loc.line) && Number.isFinite(loc.column)) {
        error.loc = loc;
      }

      return error;
    });
};

/**
 *
 * @param err - The runtime error object
 * @param sourcemap - The sourcemap from the transform
 * @param functionId - The id of the wrapped function used to execute the code
 */
export const getOriginalErrorPosition = (
    err: { stack: ?string },
    sourcemap: any,
    functionId: string,
  ): Promise<NullableLocation> => {
  const errorLineText = getErrorLineFromStack(err.stack, functionId);
  const errorPosition = getErrorPositionFromStack(errorLineText);

  if (errorPosition != null) {
    return SourceMapConsumer.with(sourcemap, null, (consumer) => {
      const pos = consumer.originalPositionFor({
        line: 1,
        column: (+errorPosition.column) - 1,
      });

      return pos;
    });
  }

  return Promise.resolve({ line: null, column: null });
}

/**
 * Returns the line error for the function id regex
 * @param stack - an error stack
 * @param functionId - The name of the function, should be as unique as possible
 */
export function getErrorLineFromStack(stack: ?string, functionId: string) {
  if (stack == null) {
    return null;
  }

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

export const getErrorPositionFromStack = (
    lineText: ?string,
  ): NullableLocation =>  {

  if (typeof lineText !== 'string') {
    return { line: null, column: null };
  }

  const match  = lineText.match(/(\d+):(\d+)\)?$/);

  if (match == null || ! (match.hasOwnProperty(1) && match.hasOwnProperty(2))) {
    return { line: null, column: null };
  }

  const line = Number(match[1]);
  const column = Number(match[2]);

  return { line, column };
}
