import test from 'ava';

import transform from '../lib/transform';

test('transform() - throws when filename is not passed', async t => {
  return t.throws(transform('a', {}), /filename/);
});

test('transform()', async t => {
  const { code, error } = await transform('a', { filename: 'lively.js' });

  t.is(error, null)
  t.is(typeof code, 'string');
});

test('transform() - returns an error when the transform fails', async t => {
  const { error } = await transform('var', { filename: 'lively.js' });

  t.regex(error.message, /unexpected token/i)
});

test('transform() - returns sourcemap', async t => {
  const { map, error } = await transform('a', { filename: 'lively.js' });

  t.is(error, null)
  t.true(map != null)
  t.true(typeof map === 'object');
});

test('transform() - return insertions', async t => {
  const { insertions, error } = await transform('a', { filename: 'lively.js' });

  t.is(error, null)
  t.is(insertions.length, 1);
  t.is(insertions[0].node.loc.start.line, 1);
  t.is(insertions[0].node.loc.end.line, 1);
  t.is(insertions[0].node.start, 0);
  t.is(insertions[0].node.end, 1);
});
