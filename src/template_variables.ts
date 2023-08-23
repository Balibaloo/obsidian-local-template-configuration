import { App } from "obsidian";
import { GenericInputPrompt, TemplateVariable, TemplateVariableType } from "./types";

export async function getVariableValues(app:App, variables:TemplateVariable[]) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val = "";
    if (variable.type == TemplateVariableType.text) {
      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, undefined, undefined, variable.required);
      } catch {}
      
      if (variable.required && (val === "" || !val)) {
        throw new Error(`Error: missing required text variable ${variable.name}`);
      }
    } else if (variable.type === TemplateVariableType.number) {
      const minString = variable.min ? `${variable.min} <= ` : "";
      const maxString = variable.max ? ` <= ${variable.max}` : "";
      const placeholderString = minString + variable.name + maxString;

      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, placeholderString, undefined, variable.required);
      } catch { }

      const parsedNum = parseFloat(val);
      const isValidNum: boolean = Boolean(parsedNum);
      if (variable.required && !isValidNum) {
        throw new Error(`Error: missing required number variable ${variable.name}`);
      }

      if (variable.min && parsedNum < variable.min) {
        val = "";
        if (variable.required){
          throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is below the minimum (${variable.min})`);
        }
      }
      
      if (variable.max && parsedNum > variable.max) {
        val = "";
        if (variable.required){
          throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is above the maximum (${variable.max})`);
        }
      }
    }
    
    gatheredValues[variable.name] = val;
  }
  
  console.log("Gathered values", gatheredValues);

  return gatheredValues;
}
