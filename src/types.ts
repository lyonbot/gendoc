import * as ts from "typescript";

export interface InfoNode {
  name: string;
  type: ts.Type
  typename: string;
  desc: string;
  children: InfoNode[];
  
  arrayItem?: InfoNode;
}
