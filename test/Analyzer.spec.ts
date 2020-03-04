import * as assert from 'assert';
import { resolve, join } from 'path';
import Analyzer from '../src';

describe('Analyzer', () => {
  const fixtureDir = resolve(__dirname, 'fixture')
  const filename = join(fixtureDir, 'basic.ts')
  let analyzer!: Analyzer

  before('init analyzer', () => {
    analyzer = Analyzer.fromPaths([filename])
    assert(analyzer)
  })

  it('getTypeFromFile fail', () => {
    const type = analyzer.getTypeFromFile(filename, "NOTExist")
    assert(!type)

    const type2 = analyzer.getTypeFromFile(join(fixtureDir, "NOTExist.ts"), "NOTExist")
    assert(!type2)

    const symbol = analyzer.getSymbolFromFile(filename, "NOTExist")
    assert(!symbol)

    const symbol2 = analyzer.getSymbolFromFile(join(fixtureDir, "NOTExist.ts"), "NOTExist")
    assert(!symbol2)
  })

  it('getTypeFromFile & getChildrenOfType', () => {
    const type = analyzer.getTypeFromFile(filename, "UserInfo")!
    assert(type, "shall get the type `UserInfo`")

    const children = analyzer.getChildrenOfType(type)
    assert.equal(children.length, 2)

    const [prop1, prop2] = children
    assert.equal(prop1.name, "name")
    assert.equal(prop1.typename, "string")
    assert.equal(prop1.desc, 'your name\n\ndefault is John Smith')

    assert.equal(prop2.name, "id")
    assert.equal(prop2.typename, "number")
    assert(prop2.desc.includes('your id'))
  });

  it('function, array, union, Record<xxx, xxx>, use interface', () => {
    const rootType = analyzer.getTypeFromFile(filename, "SystemOptions")!
    const children = analyzer.getChildrenOfType(rootType)

    {
      const type = children.find(x => x.name === 'onInit')!
      assert.equal(type.typename, '() => void')
    }

    {
      const type = children.find(x => x.name === 'admins')!
      assert.equal(type.typename, 'Array<string>')
      assert(type.arrayItem, 'this is Array')
      assert.equal(type.arrayItem!.typename, 'string')
    }

    {
      const type = children.find(x => x.name === 'guestInfo')!
      assert.equal(type.typename, 'UserInfo')
    }

    {
      const type = children.find(x => x.name === 'db')!
      assert.equal(type.children.length, 3)
      assert.deepStrictEqual(type.children.map(x => x.name), ['host', 'port', 'pass'])
    }

    {
      const type = children.find(x => x.name === 'hooks')!
      assert.equal(type.children.length, 3)
      assert.deepStrictEqual(type.children.map(x => x.name), ["create", "update", "delete"])
    }
  })

  it('useTrailingComment', function () {
    analyzer.useTrailingComment = true

    const rootType = analyzer.getTypeFromFile(filename, "SystemOptions")!
    const children = analyzer.getChildrenOfType(rootType)

    {
      const type = children.find(x => x.name === 'admins')!
      assert(type.desc.includes('the admin names'))
    }

    {
      const type = children.find(x => x.name === 'hooks')!
      assert(type.desc.includes('trailingComments is supressed by leadingComments') === false)
    }
  })

  it('useTrailingComment(off)', function () {
    analyzer.useTrailingComment = false

    const rootType = analyzer.getTypeFromFile(filename, "SystemOptions")!
    const children = analyzer.getChildrenOfType(rootType)

    {
      const type = children.find(x => x.name === 'admins')!
      assert(type.desc.includes('the admin names') === false)
    }

    {
      const type = children.find(x => x.name === 'hooks')!
      assert(type.desc.includes('trailingComments is supressed by leadingComments') === false)
    }
  })
});
