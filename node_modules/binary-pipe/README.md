# binary-pipe

**binary-pipe** is handy **Node.js** util, when it comes to reading (parsing) binary files.

<!-- TOC -->

- [binary-pipe](#binary-pipe)
  - [How it works](#how-it-works)
  - [Example](#example)
  - [Installation](#installation)
  - [Documentation](#documentation)
    - [BinaryPipe](#binarypipe)
      - [Pipe typing issue](#pipe-typing-issue)
    - [Parsers and formatters](#parsers-and-formatters)
  - [Custom](#custom)
    - [Parser](#parser)
    - [Formatter](#formatter)

<!-- /TOC -->

## How it works

**binary-pipe** takes buffer, and provides pipeline for parsing.

Parser reads values from buffer, and returns them into callback function. Callback function (provided by the user) should return object with new value as some field's value (see [Example](#example)). Final object of pipeline is sum of objects returned from parsers' callbacks.

Each parser may (and should) accept formatting function. Providing formatter for parser is optional. Formatter converts value returned from parser into string or anything.

For parsing and formatting, you can use [one of the built-ins](#documentation), or [create your owns](#custom).

## Example

```ts
import { BinaryPipe, readInt8 } from 'binary-pipe';

const buffer = Buffer.from([1, 2, 3]);
const result = BinaryPipe(buffer).pipe(
  ['firstByte', readInt8()],
  ['secondByte', readInt8()],
  ['thirdByte', readInt8()],
);

console.log(result); // { firstByte: 1, secondByte: 2, thirdByte: 3 }
```

The example above takes simple three-value buffer, and pipes it through three tuples: parsers.

Each of these parsers takes property name, and parser function. Buffer is piped through parser functions, which result is merged into one object with declared properties, what is shown in `console.log` line.

Because **binary-pipe** operates on real literal objects, and provides TS typing, it's **type-safe**: even the last object returned has proper typing.

Though by default each parser function returns number, it can accept formatter, which allows to change number into array, boolean, enum or anything.

See more examples in [examples dir](./examples).

## Installation

Yarn | npm
--- | ---
`yarn add binary-pipe` | `npm install binary-pipe`

## Documentation

This sections describe built-in functions. For creating your own function see [Custom](#custom) section.

Complete documentation can be found here: [https://soanvig.gitlab.io/binary-pipe](https://soanvig.gitlab.io/binary-pipe)

### BinaryPipe

```ts
/**
 * BinaryPipe pipes buffer through pipeline of functions.
 * Each function will fillup initialObject with returned object.
 *
 * @param buffer - buffer to parse
 * @param initialObject - object that should be filled-up with values
 */
function BinaryPipe(buffer: Buffer, initialObject: = {})
```

BinaryPipe returns object, with `pipe`, `loop` and `finish` methods.

```ts
/**
 * Pipes buffer through given parsers.
 * It's up to parser how many bytes it takes from buffer.
 * Each parser should return new literal object, that will be merged to previous object (or initialObject).
 *
 * @param parsers - parsers for pipeline
 */
pipe (...parsers)
```

Each parser given to pipe will then take buffer given in `BinaryPipe`, take out some values from it, and return them in some way to parser's callback function.

```ts
 /**
   * Returns special pipe function, which iterates `count` times over buffer,
   * returning array of results.
   *
   * @param count - number of times to iterate.
   */
  loop (count: number) {
```

`loop` function returns special type of pipe function, which underhood calls `BinaryPipe.pipe` function `count` times, and the result is array of objects returned from each pipe call. This is especially useful, if you have sequence of objects that you want to parse desired number of times.

```ts
/**
 * Returns buffer not parsed by pipe yet.
 * Closes generator, so no piping will be available after calling `finish`.
 */
finish (),
```

Finish method is useful, if you want to take buffer that left as pipeline leftover. **warning** it closes internal generator, so you cannot pipe it anymore in this `BinaryPipe` instance.

From callback function value can be saved in new object, which will be merged into previous object.

#### Pipe typing issue

For now pipe can provide correct typing of final object only if 8 or less parsers are used. This comes from TypeScript limitation - pipe functions with changing types cannot be properly typed for infinity number of functions.

If you need more than 8 parsers you may want to split parsing into parts.
If you encountered this problem, please [create an issue in repository](https://gitlab.com/soanvig/binary-pipe/issues/new).

### Parsers and formatters

See all parsers (starting from name `read`) and formatters (starting from name `format`) here: [https://soanvig.gitlab.io/binary-pipe](https://soanvig.gitlab.io/binary-pipe)

## Custom

User can create his/her own parsers and functions. See below, how it can be achieved.

### Parser

Parser in detail is function, that takes optional `formatter`, and other arguments it needs.

It returns new function, which accepts two arguments: `generator` and `previousValue`.

`generator` is used to take out values from buffer, simply calling `generator.next().value` (it returns one buffer entry).

The simplest example of parser would be `readInt8` function (**this is also great copy-paste from creating your own parser**):

```ts
/**
 * Read single byte
 *
 * @see https://nodejs.org/api/buffer.html#buffer_buf_readint8_offset
 *
 * @param formatter - number formatter
 */
export function readInt8 (): ParserFunction<number>;
export function readInt8<T> (formatter: (v: number) => T): ParserFunction<T>;
export function readInt8<T> (formatter?: (v: number) => T): ParserFunction<number | T> {
  return (generator) => {
    const byte = generator.next().value;
    const formatted = formatter ? formatter(byte) : byte;
    return formatted;
  };
}
```

See also JS version:

```js
export function readInt8 (formatter) {
  return (generator) => {
    const byte = generator.next().value;
    const formatted = formatter ? formatter(byte) : byte;
    return formatted;
  };
}
```

**WARNING**: don't use `for-of` for reading generator, since it always exhausts generator, and whole pipeline will break.

If you want to read multiple values from generator, you may want to use `take(generator, count)` method exported from library.

**WARNING**: generator's last value is returned as `{ value: [value], done: true }`.

### Formatter

Formatter is function, which takes value from parser, and can manipulate it.

Formatter can do with that values anything it wants.

See simple formatter implementation, which takes array of numbers, and converts them to string. These are used with the `readBytes` parser.

```ts
/**
 * Custom formatter, that takes bytes and converts them to ASCII chars.
 *
 * @param bytes - bytes array
 */
function formatString (bytes: number[]): string {
  // convert bytes to buffer, for easier manipulation
  const buffer = Buffer.from(bytes);
  return buffer.toString();
}
```

See also JS implementation

```js
/**
 * Custom formatter, that takes bytes and converts them to ASCII chars.
 *
 * @param bytes - bytes array
 */
function formatString (bytes) {
  // convert bytes to buffer, for easier manipulation
  const buffer = Buffer.from(bytes);
  return buffer.toString();
}
```



