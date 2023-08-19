import { App } from "obsidian";
import { GenericInputPrompt, TemplateVariable, TemplateVariableType } from "./types";

export async function getVariableValues(app:App, variables:TemplateVariable[]) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val;
    if (variable.type == TemplateVariableType.text) {
			val = await GenericInputPrompt.Prompt(app, variable.name);
		}
    
    gatheredValues[variable.name] = val;
  }
  
  console.log("Gathered values", gatheredValues);

  return gatheredValues;
}
