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


// var $$IN__;

// function $$LE__(id, value) {
//   console.log(id, value)
//   return value;
// }

// console.log('WTF', $$LE__(
//   0,
//   (($$IN__ = $$LE__(1, $$LE__(2, "musefan42").toUpperCase)),
//   typeof $$IN__ === "function" ? $$IN__.call($$IN__) : $$IN__())
// ))


// console.log($$IN__.call())
// throw 123;



var input = `

'musefan42'.toUpperCase();
// 'musefan42'.toUpperCase('hey');
// 'musefan42'.toUpperCase('hey').slice(0);

`;

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
      console.log(id, hasValue, value)
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
