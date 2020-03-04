import * as ts from "typescript"
import { Type } from 'typescript'
import { InfoNode } from './types'

export default class Analyzer {
  public prog: ts.Program
  public tc: ts.TypeChecker

  public useTrailingComment: boolean = true

  constructor(prog: ts.Program) {
    this.prog = prog
    this.tc = prog.getTypeChecker()
  }

  static fromPaths(files: string[], options?: ts.CompilerOptions) {
    const defaultOptions: ts.CompilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
    }
    const prog = ts.createProgram({
      rootNames: files,
      options: options || defaultOptions
    })
    return new Analyzer(prog)
  }

  getExportsFromFile(filepath: string) {
    const sf = this.prog.getSourceFile(filepath)
    if (!sf) return

    const fileSymbol = this.tc.getSymbolAtLocation(sf)
    /* istanbul ignore if:  input file is always a module */
    if (!fileSymbol) return

    const map = new Map<string, {
      node: ts.Node,
      type: ts.Type,
      symbol: ts.Symbol,
    }>()

    this.tc.getExportsOfModule(fileSymbol).forEach(symbol => {
      const node = symbol.getDeclarations()![0]!
      const type = this.tc.getTypeAtLocation(node)
      map.set(symbol.getName(), {
        node,
        type,
        symbol
      })
    })

    return map
  }

  getSymbolFromFile(filepath: string, symbolName: string) {
    const exports = this.getExportsFromFile(filepath)
    const exp = exports && exports.get(symbolName)
    if (exp) return exp.symbol
  }

  getTypeFromFile(filepath: string, symbolName: string) {
    const exports = this.getExportsFromFile(filepath)
    const exp = exports && exports.get(symbolName)
    if (exp) return exp.type
  }

  /**
   * get a short name of a Type.
   * 
   * example: `Array<Object>`, `Object`, `InitOptions` or `{ a: string }`
   */
  getNameOfType(type: Type): string {
    const { tc } = this
    const calls = type.getCallSignatures();
    if (calls && calls.length) {
      return tc.typeToString(type);
    }

    const symbol = type.getSymbol();
    if (symbol && type.flags & ts.TypeFlags.Object) {

      if (symbol.getName() === 'Array') {
        const subType = type.getNumberIndexType()!;
        return `Array<${this.getNameOfType(subType)}>`;
      }

      const decls = symbol.getDeclarations();
      const decl = decls && decls[0];
      if (decl && ts.isInterfaceDeclaration(decl)) {
        return decl.name.getText();
      }

      return `Object`;
    }
    return tc.typeToString(type);
  }

  /**
   * get info (without `children`) of a symbol
   */
  getInfoOfSymbol(symbol: ts.Symbol): InfoNode | undefined {
    const name = symbol.getName()
    const decls = symbol.getDeclarations()
    const decl = decls && decls[0];

    // FIXME: this is internal
    // @ts-ignore
    const type: ts.Type = (symbol['type'] as ts.Type) || this.tc.getTypeAtLocation(decl!)
    // const type = this.tc.getTypeOfSymbolAtLocation(symbol, decl)

    let desc = ''

    if (decl) {
      const sf = decl.getSourceFile();

      // ignore default lib
      if (this.prog.isSourceFileDefaultLibrary(sf)) {
        return
      }

      const sfText = sf.getFullText();
      const leadingComments = ts.getLeadingCommentRanges(sfText, decl.getFullStart()) || [];
      const trailingComments = (!leadingComments.length && this.useTrailingComment) && ts.getTrailingCommentRanges(sfText, decl.getEnd()) || [];

      const comment = [
        ...leadingComments.map(x => sfText.slice(x.pos, x.end)),
        ...trailingComments.map(x => sfText.slice(x.pos, x.end)),
      ].map(x => x
        .replace(/^\/\/|^\/\*+/, '')
        .replace(/\*\/$/, '')
        .trim())
        .join('\n');

      desc = comment.replace(/^\s*(\* ?)?/mg, ``)
    }

    const numberIndexType = type.getNumberIndexType();

    return {
      name,
      desc,
      type,
      typename: this.getNameOfType(type),
      children: this.getChildrenOfType(type),

      arrayItem: numberIndexType && {
        name: "Array Item",
        desc: "",
        type: numberIndexType,
        typename: this.getNameOfType(numberIndexType),
        children: this.getChildrenOfType(numberIndexType),
      },
    }
  }

  /**
   * get children of a Type. 
   * 
   * For Object type, children are its properties.
   * For Function type, children are its arguments.
   * Otherwise, returns an empty array.
   */
  getChildrenOfType(type: Type): InfoNode[] {
    const answer: InfoNode[] = []

    if (type.isUnion()) {
      type.types.forEach(subType => {
        answer.push(...this.getChildrenOfType(subType))
      })
      return answer
    }

    if (type.flags & ts.TypeFlags.Object) {
      const calls = type.getCallSignatures();
      if (calls && calls.length) {
        // is function
        return [];
      }

      type.getProperties().forEach((prop) => {
        const propInfo = this.getInfoOfSymbol(prop)
        if (!propInfo) return // maybe internal property. ignore it.

        answer.push(propInfo)
      });

      return answer
    }

    return []
  }
}
