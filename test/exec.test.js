import test from 'ava';

import path from 'path';

import { run } from '../lib/transform';

test.skip('exec.run() - executes js code and runs a callback for each expression', async t => {

  const functionId = 'LivelyJS';
  const env = 'browser';

  const code = `
  `;

  const result = await run(code, {
    sourcemap,
    functionId,
    env,
    __dirname: 'memeslol',
    __filename: 'memeslol',
    module: module,
    insertions,
    notifiers: {
      expression: [
        (id, value) => {}
      ],
    },
  });

});
