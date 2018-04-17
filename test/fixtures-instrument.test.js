// @flow

import path from 'path';

import test, { ExecutionContext } from 'ava';

import createFixtures, { FixtureContext } from './fixtures';
import transform from '../lib/transform';

const createInstrumentTest = (
  t: ExecutionContext<any>,
  folder: string,
  fixtureOpts: {
    instrumentor: 'minimal' | 'thorough',
  }): Promise<any> => {
  const pattern = path.join(__dirname, `fixtures/${folder}/!(*.output).js`);

  const { fixtures, run } = createFixtures(pattern, {

    resolve(filename) {
      return filename.replace(/\.js$/, '.output.js');
    },

  });

  t.plan(fixtures.length * 2);

  return run(async (context: FixtureContext) => {
    const { input, comparator } = await context.get();

    const output = await transform(input, {
      filename: 'main.js',
      instrumentor: fixtureOpts.instrumentor,
      generateOpts: {
        minified: false,
        concise: false,
      }
    });

    t.is(output.error, null, context.basename);

    const actual = output.code;
    const expected = comparator;

    t.is(actual, expected, `${folder}/${context.basename}`);
  });
};

test(`Fixture: (instrument-minimal) minimal instrumentation`, async t => {
  return createInstrumentTest(t, 'instrument-minimal', {
    instrumentor: 'minimal',
  });
});

test(`Fixture: (instrument-thorough) thorough instrumentation`, async t => {
  return createInstrumentTest(t, 'instrument-thorough', {
    instrumentor: 'thorough',
  });
});
