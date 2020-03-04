import * as assert from 'assert';
import * as fs from 'fs';
import { resolve, join } from 'path';
import Analyzer, { genMarkdown } from '../src';

describe('genMarkdown', () => {
  const fixtureDir = resolve(__dirname, 'fixture')
  const filename = join(fixtureDir, 'basic.ts')
  const markdownFilename = join(fixtureDir, 'doc1.md')
  let analyzer!: Analyzer

  before('init analyzer', () => {
    analyzer = Analyzer.fromPaths([filename])
    assert(analyzer)
  })

  it('genMarkdown', function () {
    const symbol = analyzer.getSymbolFromFile(filename, "SystemOptions")!
    const info = analyzer.getInfoOfSymbol(symbol)!
    const markdown = genMarkdown(info)

    // fs.writeFileSync(markdownFilename, markdown)
    assert.equal(markdown, fs.readFileSync(markdownFilename, 'utf-8'))
  })
});
