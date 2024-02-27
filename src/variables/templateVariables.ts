import { App } from "obsidian";
import { TemplateVariable } from ".";
import { variableProviderVariableGetters } from "./providers";


export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    const val = existingValues[variable.name] ?? "";
    //@ts-ignore variable is a correct type but TS expects it to be the union of all correct types
    gatheredValues[variable.name] = await variableProviderVariableGetters[variable.type](app, variable, val);
  }

  // console.log("Gathered variable values:", gatheredValues);
  return gatheredValues;
}
