import { App } from "obsidian";
import { TemplateVariable } from ".";
import { variableProviderVariableGetters } from "./providers";
import { getReplacedVariablesText } from "src/intents";


export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    const val = existingValues[variable.name] ?? "";

    for (let key in variable){
      if ( typeof key === "string" && typeof variable[key as keyof TemplateVariable ] === "string"){
        // @ts-ignore complains that key isn't a keyof TemplateVariable
        variable[key] = getReplacedVariablesText( variable[key], { ...gatheredValues, ...existingValues });
      }
    }

    //@ts-ignore variable is a correct type but TS expects it to be the union of all correct types
    gatheredValues[variable.name] = await variableProviderVariableGetters[variable.type](app, variable, val);
  }

  // console.log("Gathered variable values:", gatheredValues);
  return gatheredValues;
}
