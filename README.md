# ts-gendoc

get info from TypeScript type declaration and generate document

![](https://github.com/lyonbot/gendoc/workflows/Node.js%20CI/badge.svg)

```js
import { Analyzer, genMarkdown } from 'ts-gendoc'

const filename = "/root/myfile.ts"    // absolute path
const symbolName = "SystemOptions"    // is exported interface or type

const analyzer = Analyzer.fromPaths([filename])
const symbol = analyzer.getSymbolFromFile(filename, symbolName)
const info = analyzer.getInfoOfSymbol(symbol)
const markdown = genMarkdown(info)

console.log(markdown)
```

## JSDoc marks

You may use `@gendoc flag1, flag2` in your jsdoc comment. Supported flags:

- `no-children`: do not print Object's children (the nested list)
- `hidden`: do not print this field in document

for example, in your ts file:

```ts
interface Options {
  /**
   * server path
   * 
   * @example foobar://foobar.com:1234/
   */
  server: string

  username: string   // your foobar username
  token: string      // your foobar token

  /**
   * this is classified. not in document
   * 
   * @gendoc hidden
   */
  mode: string
}
```

## API

- TO BE DONE
