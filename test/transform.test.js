import test from 'ava';

import transform from '../lib/transform';

test('transform() - throws when filename is not passed', async t => {
  return t.throws(transform('a', {}), /filename/);
});

test('transform()', async t => {
  const { code } = await transform('a', { filename: 'lively.js' });

  t.is(typeof code, 'string');
});

test('transform() - returns an error when the transform fails', async t => {
  const { error } = await transform('var', { filename: 'lively.js' });

  t.regex(error.message, /unexpected token/i)
});

test('transform() - returns sourcemap', async t => {
  const { map } = await transform('a', { filename: 'lively.js' });

  t.true(map != null)
  t.true(typeof map === 'object');
});

test('transform() - return insertions', async t => {
  const { insertions } = await transform('a', { filename: 'lively.js' });

  t.is(insertions.length, 1);
  t.is(insertions[0].loc.start.line, 1);
  t.is(insertions[0].loc.end.line, 1);
  t.is(insertions[0].position.start, 0);
  t.is(insertions[0].position.end, 1);
});
