import { InfoNode } from "./types";

const gendocFlagsRE = /^@gendoc\s(.+)\n?/m
type GendocFlag = 'no-children' | 'hidden'

/**
 * Turn a InfoNode into Markdown
 * @param node InfoNode
 */
export default function genMarkdown(node: InfoNode): string {
  const flags: { [k in GendocFlag]?: boolean } = {}

  let answer = '- **' + node.name + '** : `' + node.typename + '`'

  if (node.desc) {
    let desc = node.desc

    const _gendocFlags = gendocFlagsRE.exec(node.desc)
    if (_gendocFlags) {
      _gendocFlags[1].trim().split(/,\s*/).forEach(key => {
        flags[key as GendocFlag] = true
      })
      desc = desc.replace(gendocFlagsRE, '').trim()
    }

    const oneLiner = /^([^\n]+)(\n\n|$)/.exec(desc)
    if (oneLiner) {
      answer += "  " + oneLiner[1]
      desc = desc.substr(oneLiner[0].length)
    }

    if (desc) {
      answer += '\n\n' + desc.replace(/^/gm, '  > ')
    }
  }

  if (flags['hidden']) return ''

  answer += '\n'

  if (!flags['no-children']) {
    let children: InfoNode[] = []

    if (node.arrayItem && node.arrayItem.children.length) children.push(node.arrayItem)
    if (node.children.length > 0) children.push(...node.children)

    if (children.length) {
      answer += "\n" + children
        .map(genMarkdown)
        .filter(x => !!x)
        .join("\n")
        .replace(/^/gm, '  ') + "\n"
    }
  }

  return answer
}
