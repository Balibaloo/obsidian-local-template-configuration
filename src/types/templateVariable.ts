import { TemplateVariableType } from "./";

export type TemplateVariable = {
  name: string,
  type: TemplateVariableType,
  required: boolean,
  min?: number,
  max?: number,
}
