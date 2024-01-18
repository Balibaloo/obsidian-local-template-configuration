import { App } from "obsidian";
import { TemplateVariableType, TemplateVariableVariables } from "./providers";
import { variableProviderVariableGetters } from "./providers";

export enum ReservedVariableName {
  new_note_name = "new_note_name",
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
} & TemplateVariableVariables


export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val = existingValues[variable.name] ?? "";
    gatheredValues[variable.name] = await variableProviderVariableGetters[variable.type](variable as any, val);
  }

  console.log("Gathered values", gatheredValues);
  return gatheredValues;
}
