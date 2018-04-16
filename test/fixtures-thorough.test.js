// @flow

import path from 'path';

import test from 'ava';

import createFixtures from './fixtures';
import transform from '../lib/transform';

test('transform() - Returns thoroughly instrumented code', async t => {
  const pattern = path.join(__dirname, 'fixtures/transform-thorough/!(*.output).js');

  const { fixtures, run } = createFixtures(pattern, {

    resolve(filename) {
      return filename.replace(/\.js$/, '.output.js');
    },

  });

  t.plan(fixtures.length * 2);

  return run(async (context) => {
    const { input, comparator } = await context.get();

    const output = await transform(input, {
      filename: 'main.js',
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
