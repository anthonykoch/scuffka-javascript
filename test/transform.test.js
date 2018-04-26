// @flow

import path from 'path';
import fs from 'fs';

import test from 'ava';

import transform from '../src/transform';

test('transform()', async (t) => {
  const { code, error } = await transform('a', { filename: 'lively.js' });

  t.is(error, null)
  t.is(typeof code, 'string');
});

test('transform() - returns an error when the transform fails', async t => {
  const { error }: any = await transform('var', { filename: 'lively.js' });

  t.regex(error.message, /unexpected token/i)
});

test('transform() - returns sourcemap', async t => {
  const { map, error } = await transform('a', { filename: 'lively.js' });

  t.is(error, null)
  t.true(map != null)
  t.true(typeof map === 'object');
});

test('transform() - transforms scripts', async t => {
  const { insertions, error }: any = await transform('a', { filename: 'main.js' });

  t.is(error, null)
  t.is(insertions.length, 1);
  t.is(insertions[0].node.loc.start.line, 1);
  t.is(insertions[0].node.loc.end.line, 1);
  t.is(insertions[0].node.start, 0);
  t.is(insertions[0].node.end, 1);
});

test('transform() - instruments lodash script', async t => {
  const basenames = ['d3.js', 'handlebars.js', 'lodash.js', 'moment.min.js', 'preact.js'];

  const promises = basenames.map(async (basename) => {
    const file = fs.readFileSync(path.join(__dirname, `scripts/${basename}`));

    const thorough = await transform(file, { filename: 'main.js', instumentor: 'thorough' });

    t.is(thorough.error, null);
    t.not(thorough.insertions.length, 0);

    const minimal = await transform(file, { filename: 'main.js', instumentor: 'minimal' });

    t.is(minimal.error, null);
    t.not(minimal.insertions.length, 0);
  });

  return Promise.all(promises);
});
