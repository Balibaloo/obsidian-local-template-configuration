
import { getVariableValues } from "./templateVariables";
import { TemplateVariableType, TemplateVariableVariables, variableProviderVariableParsers } from "./providers";

export enum ReservedVariableName {
  new_note_name = "new_note_name",
  intent_name = "intent_name",
}

export type TemplateVariable = {
  name: string,
  type: TemplateVariableType,
  disable: boolean,
  required?: boolean,
  use_selection?: boolean,
  initial?: string,
  placeholder?: string,
  prompt?: string,
  description?: string,
} & TemplateVariableVariables

export {
  getVariableValues,
  TemplateVariableType,
  variableProviderVariableParsers, 
};