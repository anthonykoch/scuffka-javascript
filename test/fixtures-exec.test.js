// @flow

import path from 'path';
import { inspect } from 'util';

import test, { ExecutionContext } from 'ava';
import JSON5 from 'json5';

import createFixtures from './fixtures';
import transform from '../src/transform';
import * as exec from '../src/exec';

const createExecTest = (
    t: ExecutionContext<any>,
    folder: string,
    fixtureOpts: { instrumentor: 'minimal' | 'thorough' }
  ): Promise<any> => {
  const pattern = path.join(__dirname, `fixtures/${folder}/!(*.output).js`);

  const { fixtures, run } = createFixtures(pattern, {
    resolve: (filename) => filename.replace(/\.js$/, '.output.js'),
  });

  t.plan(fixtures.length * 5);

  return run(async (context) => {
    const { input, comparator } = await context.get();

    let output = await transform(input, {
      filename: 'main.js',
      instrumentor: fixtureOpts.instrumentor,
      generateOpts: {
        minified: false,
        concise: false,
      },
    });

    t.is(output.error, null, context.path);

    const result = ((output: any): TransformSuccess);

    let actual = [];

    output = await exec.run(result.code, {
      sourcemap: result.map,
      functionId: 'LivelyJS',
      env: 'browser',
      __dirname: 'main',
      __filename: 'main.js',
      module: {
        exports: {},
        require() {},
      },
      track(id: number, hasValue: boolean, value: any) {
        const item = {
          id,
          type: result.insertions[id].type,
          context: result.insertions[id].context,
        };

        if (hasValue) {
          // $FlowFixMe
          item.value = inspect(value, { depth: 20 });
        }

        actual.push(item);
      },
    });


    const name = `${folder}/${context.basename}`;

    let expected;

    t.is(output.error, null, name);

    t.notThrows(() => {
      expected = JSON5.parse(comparator);
    }, context.path);

    t.not(actual.length, 0, `${name} has more than 1 item`);

    t.deepEqual(actual, expected, name);
  });
};

test(`Fixture: (exec-minimal) code execution with minimal instrumentation`, async t => {
  return createExecTest(t, 'exec-minimal', { instrumentor: 'minimal' });
});

test.only(`Fixture: (exec-thorough) code execution with thorough instrumentation`, async t => {
  return createExecTest(t, 'exec-thorough', { instrumentor: 'thorough' });
});
