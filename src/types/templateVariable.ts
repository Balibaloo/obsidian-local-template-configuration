import { TemplateVariableType } from "./";

export type TemplateVariable = {
  name: string,
  type: TemplateVariableType,
  required?: boolean,
  min?: number,
  initial?: string,
  max?: number,
  placeholder?: string,
  regex: string,
}
