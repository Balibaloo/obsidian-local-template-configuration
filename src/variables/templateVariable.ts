import { TemplateVariableType, TemplateVariableVariables } from "..";

export type TemplateVariable = {
  name: string,
  type: TemplateVariableType,
  required?: boolean,
  use_selection?: boolean,
  initial?: string,
  placeholder?: string,
} & TemplateVariableVariables
