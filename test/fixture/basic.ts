export interface UserInfo {
  /** 
   * your name
   *
   * default is John Smith 
   */
  name?: string

  /** your id */
  id: number
}

type HookName = "create" | "update" | "delete"

export interface SystemOptions {
  onInit(): void
  db: string | {
    host: string
    port: number
    pass: string
  }
  admins: string[]  // the admin names

  /** 
   * define hooks
   * 
   * details can be found in <http://xxxxx>
   * 
   * @gendoc no-children
   */
  hooks: Record<HookName, (data: Object) => any>  // trailingComments is supressed by leadingComments

  /** 
   * sample data
   * dfd
   * 
   * aaa
   * bbbb
   */
  guestInfo: UserInfo

  /**
   * this is hidden from document
   * 
   * @gendoc hidden
   */
  hiddenField: string

  vipInfos: UserInfo[]
}

export function xxx(a: number, b: string) {
  return a + b
}
