import { App } from "obsidian";
import { GenericInputPrompt, TemplateVariable, TemplateVariableType } from "./types";

export async function getVariableValues(app:App, variables:TemplateVariable[]) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val = "";
    if (variable.type == TemplateVariableType.text) {
      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, variable.placeholder, variable.initial, variable.required, text => 
          text.length > 0 && (variable.regex ? Boolean(text.match(variable.regex)) : true),
          "Error: Please enter text" + ( variable.regex ? ` that matches the following regex "${variable.regex}"` : "")
          );
      } catch {}
      
      if (variable.required){
        if (variable.regex && !Boolean(val.match(variable.regex))){
          throw new Error(`Error: value for ${variable.name} doesn't match the regular expression "${variable.regex}"`)
        
        } else if (val === "" || !val) {
          throw new Error(`Error: missing required text variable ${variable.name}`);
        }
      }
    } else if (variable.type === TemplateVariableType.number) {
      const minString = variable.min ? `${variable.min} <= ` : "";
      const maxString = variable.max ? ` <= ${variable.max}` : "";
      const placeholderString = variable.placeholder || minString + variable.name + maxString;

      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, placeholderString, variable.initial, variable.required, text => {
          const parsed = parseFloat(text);
          return Boolean(parsed) &&
            (variable.min ? variable.min <= parsed : true) &&
            (variable.max ? parsed <= variable.max : true)
          }, `Error: Please enter a number` + ((variable.min || variable.max)? `in the range ${minString } x ${maxString}`: "")
            );
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
    } else if (variable.type === TemplateVariableType.natural_date) {
      const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");

      try {
        val = await GenericInputPrompt.Prompt(app, variable.name, variable.placeholder, variable.initial, variable.required, text => {
          return NLDates.parseDate(text).moment.isValid();
        }, "Error: Please enter a valid natural language date");
      } catch { }


      const parsedDate = NLDates.parseDate(val);
      if (!parsedDate.moment.isValid()){
        val = "";

        if (variable.required) {
          throw new Error(`Error: missing required date variable ${variable.name}`);
        }
      } else {
        val = parsedDate.formattedString;
      }
    }
    
    gatheredValues[variable.name] = val;
  }
  
  console.log("Gathered values", gatheredValues);

  return gatheredValues;
}
