import path from 'path';
import fs from 'fs';

import { SourceMapConsumer } from 'source-map';

import { run } from './exec';
import transform from './transform';

import * as instrument from './instrument';


// For statement check of null
// assigment expression left is member expression
// tracks object property key is literal
// default switch case is null
// nested computed member expressions f[m[0]]


var input = `
// throw new Error();
// console.log(user)
user.meme.lol('lol')
`;

// $$LE__(0, typeof $$LE__(1, memes) === "function" ? 123 : $$LE__(3, $$LE__(2, $$LE__(4, user).meme).lol)());


/*

$$LE__(0,
  (typeof ($$IN__ = $$LE__(1, $$LE__(2, $$LE__(3, user).meme).lol)) === 'function')
    ? $$IN__.call($$IN__)
    : $$IN__();
);

*/

// var input = fs.readFileSync(path.join(__dirname, '/../test/scripts/moment.min.js'), 'utf8');
// var input = fs.readFileSync(path.join(__dirname, '/../test/scripts/lodash.js'), 'utf8');
// var input = fs.readFileSync(path.join(__dirname, '/../test/scripts/handlebars.js'), 'utf8');
// var input = fs.readFileSync(path.join(__dirname, '/../test/scripts/d3.js'), 'utf8');


// d3 - 8131
// lodash - 3477
// moment - 1693

;(async () => {
  const { insertions, map: sourcemap, code, error } =
    await transform(input, {
      instrumentor: 'thorough',
      filename: 'massivememes.js',
    });

    console.log(insertions ? insertions.length : null)

  if (error) {
    console.log(error.stack)
  } else {
    console.log(code);
  }

  // return;

  // console.log(sourcemap)
  const { inspect } = require('util');

  // console.log(inspect(insertions, { depth: 20 }))
  // console.log(JSON.stringify(insertions, null, 2))

  // const {
  //   getOriginalErrorPosition,
  //   getErrorPositionFromStack,
  //   getErrorLineFromStack,
  // } = require('./utils');

  const functionId = 'LOLWEOUTHERE';
  const env = 'browser';

  let actual = [];

  const result = await run(code, {
    sourcemap,
    functionId,
    env,
    __dirname: 'memeslol',
    __filename: 'memeslol',
    module: module,
    insertions,
    track(id, hasValue, value) {
      // console.log(id, hasValue, value)
      try {
        const item = {
          id,
          type: insertions[id].type,
          context: insertions[id].context,
        };

        if (hasValue) {
          item.value = inspect(value, { depth: 20 });
        }

        actual.push(item);
      } catch (err) {
        console.log(err)
      }
    },
  })
  // .catch(err => console.log(err))

  console.log(actual.length)
  console.log(result)
  // console.log(result?.error?.stack)

  return

  // const errorPosition = await getErrorPositionFromStack(getErrorLineFromStack(result?.error?.stack, functionId, env));
  // console.log(result?.error?.stack)
  // console.log(errorPosition)
  // console.log(await getOriginalErrorPosition(result?.error, sourcemap, functionId, env))

  const whatever =
    await SourceMapConsumer.with(sourcemap, null, (consumer) => {
      // console.log(errorPosition)
      // console.log(consumer.originalPositionFor({ line: 1, column: 15 }))

      // const wtf = [
      //   { line: 1, column: 12 },
      //   { line: 2, column: 12 },
      //   { line: 3, column: 12 },
      //   { line: 1, column: 13 },
      //   { line: 2, column: 13 },
      //   { line: 3, column: 13 },
      // ];

      // wtf.forEach(item => console.log(item, consumer.originalPositionFor(item)))
      // consumer.eachMapping(mapping => console.log(mapping))
    });
})();
