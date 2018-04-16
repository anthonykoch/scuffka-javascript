// @flow
// Loosely based off https://github.com/unional/fixture

import fs from 'fs';
import path from 'path';
import util from 'util';

import glob from 'glob';
import { assert } from 'check-types';

const readFilePromise = util.promisify(fs.readFile);

type ReadFileOptions = {
  encoding?: string
};

type VinylFile = {
  contents: string | null,
  path: string,
  error: Error | null,
};

export const readFile = (filename: string, options: ReadFileOptions): Promise<VinylFile> => {
  return readFilePromise(filename, options)
    .then(contents => ({ path: filename, contents, error: null, }))
    .catch(error => ({ path: filename, contents: null, error }));
};

export const toTitle = (str: string) =>
  str.toLowerCase()
    .replace(/\W+|\s+/g, ' ')
    .replace(/^\w|( \w)/g, match => match.toUpperCase());

/**
 * Creates a fixture context, which holds data about the
 *
 * @param {string} inputFilename - The input filename
 * @param {Object} options.comparator - The comparator options
 * @param {Object} options.comparatorReadOptions - The fs.readFile options for comparator files
 * @param {Object} options.inputReadOptions - The fs.readFile optoins for input files
 */

 export class FixtureContext {

  inputFilename: string;
  title: string;
  path: string;
  basename: string;
  resolveComparator: (filename: string) => string;
  comparatorReadOptions: ReadFileOptions;
  inputReadOptions: ReadFileOptions;

  constructor(inputFilename: string, {
    resolveComparator,
    comparatorReadOptions={ encoding: 'utf8' },
    inputReadOptions={ encoding: 'utf8', },
  }: {
    resolveComparator: (filename: string) => string,
    comparatorReadOptions: ReadFileOptions,
    inputReadOptions: ReadFileOptions
  }) {
    const basename = path.basename(inputFilename, path.extname(inputFilename));

    this.inputFilename = inputFilename;
    this.title = toTitle(basename);
    this.inputReadOptions = inputReadOptions;
    this.comparatorReadOptions = comparatorReadOptions;
    this.path = inputFilename;
    this.basename = basename;
    this.resolveComparator = resolveComparator;
  }

  async getFiles() {
    const input = await readFile(this.inputFilename, this.inputReadOptions);

    const comparator =
      await readFile(this.resolveComparator(this.inputFilename), this.comparatorReadOptions);

    assert(input.error == null, `Could not find input file "${input.path}"`);
    assert(comparator.error == null, `Could not find comparator file ${comparator.path}`);

    return {
      input,
      comparator,
    };
  }

  async get(): Promise<{ input: string, comparator: string }> {
    const { input, comparator } = await this.getFiles();

    return {
      input: String(input.contents),
      comparator: String(comparator.contents),
    };
  }
}

export default (pattern: string, options: {
    resolve: (filename: string) => string,
    inputReadOptions?: ReadFileOptions,
    comparatorReadOptions?: ReadFileOptions,
  }) => {
  const {
    comparatorReadOptions={},
    inputReadOptions={},
    resolve,
  } = options;

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
        new FixtureContext(inputFilename, {
          resolveComparator: resolve,
          inputReadOptions,
          comparatorReadOptions,
          readFile,
        })
      );

  const run = async function (fn: Function, options: { parallel?: boolean }={}) {
    if (options.parallel) {
      const promises = contexts.map(async (context: FixtureContext) => {
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
