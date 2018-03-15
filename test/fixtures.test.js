import path from 'path';
import { inspect } from 'util';

import test from 'ava';
import JSON5 from 'json5';

import createFixtures from './fixtures';
import transform from '../lib/transform';
import * as exec from '../lib/exec';

test('transform(input) - (fixtures) Returns instrumented code', async t => {
  const pattern = path.join(__dirname, 'fixtures/transform/!(*.output).js');

  const { fixtures, run } = createFixtures(pattern, {

    comparator: {

      resolve(filename) {
        return filename.replace(/\.js$/, '.output.js');
      },

    },

  });

  t.plan(fixtures.length * 2);

  return run(async (context) => {
    const { input, comparator } = await context.get();

    const output = await transform(input, {
      filename: 'lively.js',
      generateOpts: {
        minified: false,
        concise: false,
      }
    });

    t.is(output.error, null, context.basename);

    const actual = output.code;
    const expected = comparator;

    t.is(actual, expected, 'transform/' + context.basename);
  });
});

test('exec.run() - (fixtures) executes input and calls callbacks ', async t => {
  const pattern = path.join(__dirname, 'fixtures/run/!(*.output).js');

  const { fixtures, run } = createFixtures(pattern, {

    comparator: {

      resolve: (filename) => filename.replace(/\.js$/, '.output.js'),

    },

  });

  t.plan(fixtures.length * 3);

  return run(async (context) => {
    const { input, comparator } = await context.get();

    const output = await transform(input, {
      filename: 'lively.js',
      generateOpts: {
        minified: false,
        concise: false,
      },
    });

    t.is(output.error, null, context.path);

    let actual = [];

    await exec.run(output.code, {
      sourcemap: output.sourcemap,
      functionId: 'LivelyJS',
      env: 'browser',
      __dirname: 'lively',
      __filename: 'lively.js',
      module: {
        exports: {},
        require() {},
      },
      track(id, hasValue, value) {
        const item = {
          id,
          type: output.insertions[id].type,
        };

        if (hasValue) {
          item.value = inspect(value, { depth: 20 });
        }

        actual.push(item);
      },
    });

    let expected;

    t.notThrows(() => {
      expected = JSON5.parse(comparator);
    }, context.path);

    // console.log({name: context.basename, actual, expected})
    t.deepEqual(actual, expected, 'run/' + context.basename);
  });
});
