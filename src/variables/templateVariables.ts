import { App } from "obsidian";
import { TemplateVariable } from ".";
import { variableProviderVariableGetters } from "./providers";


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
