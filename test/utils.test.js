import test from 'ava';

import * as utils from '../lib/utils';
import transform from '../lib/transform';
import { run } from '../lib/exec';

const MOCK_MODULE = Object.freeze({
  exports: Object.freeze({}),
  require() {},
});

test('getOriginalErrorPosition()', async t => {
  return Promise.all(['browser', 'node'].map(async (env) => {
    const input = '    thisisundeclared    ';
    const { map: sourcemap, code } = await transform(input, { filename: 'lively.js' });
    const functionId = 'livelyexec';

    const { error } = await run(code, {
      module: MOCK_MODULE,
      __filename: null,
      __dirname: null,
      functionId,
      env,
      sourcemap,
    });

    t.not(error, null);

    const loc = await utils.getOriginalErrorPosition(error, sourcemap, functionId);
    t.is(loc.column, 4);
    t.is(loc.line, 1);
  }));
});
