import { App } from "obsidian";
import { GenericInputPrompt, TemplateVariable, TemplateVariableType } from "./types";

export async function getVariableValues(app:App, variables:TemplateVariable[]) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val;
    if (variable.type == TemplateVariableType.text) {
      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, undefined, undefined, variable.required);
      } catch {}
      
      if ( variable.required && (val === "" || val === undefined || val === null)){
        return gatheredValues;
      }
		}
    
    gatheredValues[variable.name] = val;
  }
  
  console.log("Gathered values", gatheredValues);

  return gatheredValues;
}
