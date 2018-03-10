import test from 'ava';

import path from 'path';

import createFixtures from './fixtures';
import transform from '../lib/transform';

test('transform(input)', async t => {
  const pattern = path.join(__dirname, 'fixtures/transform/!(*.output.js)');

  const { fixtures, run } = createFixtures(pattern, {

    transform:
      async (file) => {
        return (await transform(file.contents, { filename: 'lively.js' })).code;
      },

    comparator: {

      resolve(filename) {
        return filename.replace(/\.js$/, '.output.js');
      },

    },

  });

  t.plan(fixtures.length);

  return run(async (context) => {
    await context.match((actual, expected) => {
      t.is(actual, expected, context.title);
    });
  });
});
