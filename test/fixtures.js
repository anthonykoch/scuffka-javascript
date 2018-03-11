// Loosely based off https://github.com/unional/fixture

import fs from 'fs';
import path from 'path';
import util from 'util';

import glob from 'glob';
import check, { assert } from 'check-types';

const readFilePromise = util.promisify(fs.readFile);

export const readFile = (filename, readOptions) => {
  return readFilePromise(filename, readOptions)
    .then(contents => ({ path: filename, contents, error: null, }))
    .catch(error => ({ path: filename, contents: null, error }));
};

export const getInputFile = (filename, readOptions) => {
  return readFile(filename, readOptions);
};

export const getComparatorFile = (inputFilename, options, readOptions) => {
  assert.string(inputFilename, `{string} inputFilename, got ${inputFilename}`);

  let filename = '';

  // Attempt to use the resolve function first
  if (check.function(options?.resolve)) {
    filename = options.resolve(inputFilename);
  }

  if (check.not.string(filename)) {
    return {
      path: filename,
      contents: null,
      error: new Error('Invalid filename'),
    };
  }

  return readFile(filename, readOptions);
};

export const toTitle = (str) =>
  str.toLowerCase()
    .replace(/\W+|\s+/g, ' ')
    .replace(/^\w|( \w)/g, match => match.toUpperCase());

/**
 * Creates a fixture context, which holds data about the
 *
 * @param {string}   inputFilename - The input filename
 * @param {Object}   options.comparator - The comparator options
 * @param {Function} options.transform - Transforms input files to what they are supposed
 * @param {Object}   options.comparatorReadOptions - The fs.readFile options for comparator files
 * @param {Object}   options.inputReadOptions - The fs.readFile optoins for input files
 *
 * @return {Object}
 */
export const createContext = (inputFilename, {
    comparator,
    transform,
    comparatorReadOptions={ encoding: 'utf8' },
    inputReadOptions={ encoding: 'utf8', },
   }) => {

  assert.string(inputFilename, `{string} inputFilename, got ${inputFilename}`);

  const basename = path.basename(inputFilename, path.extname(inputFilename));
  const title = toTitle(basename);

  // let isRead = false;
  // let input = null;
  // let expected;

  const getFiles = async () => {
    // Cache the files so we don't read them multiple times
    // if (isRead) {
    //   return { input, expected };
    // }

    const input = await getInputFile(inputFilename, inputReadOptions);
    const expected = await getComparatorFile(inputFilename, comparator, comparatorReadOptions);

    assert.null(input.error, `Could not find input file "${input.path}"`);
    assert.null(expected.error, `Could not find comparator file ${expected.path}`);

    return {
      input,
      expected,
    };
  };

  return {

    toTitle,

    get path() {
      return inputFilename;
    },

    get name() {
      return basename;
    },

    get title() {
      return title;
    },

    getFiles,

    async match(compareBy) {
      assert.function(compareBy, `{Function} compareBy, got ${compareBy}`)

      const { input: ifile, expected: efile } = await getFiles();

      const actual = await transform(ifile);
      const expected =
        check.function(comparator?.transform)
          ? await comparator.transform(efile)
          : efile.contents;

      return compareBy(actual, expected);
    },

  };
};

export default (pattern, options) => {
  assert.object(options, `{Object} options, got ${options}`);

  const {
    comparatorReadOptions,
    inputReadOptions,
    comparator,
    transform,
    fixture,
    done,
  } = options;

  assert(typeof transform === 'function', `{Function} options.transform, got ${transform}`);

  assert(
      typeof comparator?.resolve === 'function',
      `{Function} options.comparator.resolve, got ${comparator?.resolve}`
    )

  const files =
    glob.sync(pattern, { ...glob })
      .map(filename =>
          path.isAbsolute(filename)
            ? filename
            : path.join(process.cwd(), filename)
        );

  assert(files.length > 0, `Did not find any input files from glob`)

  const contexts =
    files.map(inputFilename =>
        createContext(inputFilename, { inputReadOptions, comparatorReadOptions, comparator, transform, readFile })
      );

  const run = async (fn, options) => {
    if (options?.parallel) {
      const promises = contexts.map(async (context) => {
        const files = context.getFiles();

        await fn(context, files);
      });

      return Promise.all(promises);
    }

    for (const context of contexts) {
      const files = await context.getFiles();

      await fn(context, files);
    }
  };

  return {
    fixtures: contexts,
    files,
    run,
  };
}
