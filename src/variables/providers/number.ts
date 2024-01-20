import { GenericInputPrompt } from "../suggest";
import { TemplateVariable } from "../templateVariables";


export type TemplateVariableVariables_Number = {
  min?: number,
  max?: number,
};

export const parseNumberVariableFrontmatter = (fm: any) => ({
  min: parseFloat(fm.is_over),
  max: parseFloat(fm.is_under),
})

export async function getNumberVariableValue(variable: TemplateVariable&TemplateVariableVariables_Number, existingValue:string):Promise<string>{
  if (!validateNumber(variable, existingValue, false)) {
    const minString = variable.min ? `${variable.min} <= ` : "";
    const maxString = variable.max ? ` <= ${variable.max}` : "";
    const placeholderString = variable.placeholder || minString + variable.name + maxString;

    try {
      existingValue = await GenericInputPrompt.Prompt(app, variable,
        text => validateNumber(variable, text, false)
        , `Error: Please enter a number` + ((variable.min || variable.max) ? `in the range ${minString} x ${maxString}` : "")
      );
    } catch (e){
      console.log(e);
    }
    validateNumber(variable, existingValue, true);
  }

  return existingValue;
}


function validateNumber(variable: TemplateVariable & TemplateVariableVariables_Number, value: string, throwErrors: boolean): boolean {
  const parsedNum = parseFloat(value);
  const isValidNum: boolean = Boolean(parsedNum);
  if (!isValidNum) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required number variable ${variable.name}`);
    return false;
  }

  if (variable.min && parsedNum < variable.min) {
    value = "";
    if (variable.required && throwErrors)
      throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is below the minimum (${variable.min})`);
    return false;
  }
  if (variable.max && parsedNum > variable.max) {
    value = "";
    if (variable.required && throwErrors)
      throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is above the maximum (${variable.max})`);
    return false;
  }
  return true;
}