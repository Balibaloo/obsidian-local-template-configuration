import { App } from "obsidian";
import { TemplateVariable } from ".";
import { variableProviderVariableGetters } from "./providers";
import { getReplacedVariablesText } from "src/intents";


export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues = { ...existingValues };

  // Template gathered values with itself
  for ( let key in gatheredValues ){
    gatheredValues[key] = getReplacedVariablesText( gatheredValues[key], gatheredValues);
  }

  for (let variable of variables) {
    const val = gatheredValues[variable.name] ?? "";

    // Template string variable properties
    for (let key in variable){
      if ( typeof key === "string" && typeof variable[key as keyof TemplateVariable ] === "string"){
        // @ts-ignore complains that key isn't a keyof TemplateVariable
        variable[key] = getReplacedVariablesText( variable[key], gatheredValues);
      }
    }
    
    //@ts-ignore variable is a correct type but TS expects it to be the union of all correct types
    gatheredValues[variable.name] = await variableProviderVariableGetters[variable.type](app, variable, val);
    
    // Template gathered values with itself
    for ( let key in gatheredValues ){
      gatheredValues[key] = getReplacedVariablesText( gatheredValues[key], gatheredValues);
    }
  }

  // console.log("Gathered variable values:", gatheredValues);
  return gatheredValues;
}
