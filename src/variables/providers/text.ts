import { App } from "obsidian";
import { TemplateVariable } from "..";
import { GenericInputPrompt } from "../suggest";

export type TemplateVariableVariables_Text = {
  regex ?: string,
};

export const parseTextVariableFrontmatter = (app: App, fm:any) => ({
  regex: fm.matches_regex,
})

export async function getTextVariableValue(app: App, variable: TemplateVariable&TemplateVariableVariables_Text, existingValue:string):Promise<string>{
  if (!validateText(app, variable, existingValue, false)) {
    try {
      existingValue = await GenericInputPrompt.Prompt(app, variable,
        text => validateText(app, variable, text, false),
        "Error: Please enter text" + (variable.regex ? ` that matches the following regex "${variable.regex}"` : "")
      );
    } catch (e){
      console.log(e);
    }
    validateText(app, variable, existingValue, true);
  };

  return existingValue
}

function validateText(app: App, variable: TemplateVariable & TemplateVariableVariables_Text , value: string, throwErrors: boolean): boolean {
  if (variable.regex && !Boolean(value.match(variable.regex))) {
    if (variable.required && throwErrors)
      throw new Error(`Error: value for ${variable.name} doesn't match the regular expression "${variable.regex}"`)
    return false;

  } else if (value === "" || !value) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required text variable ${variable.name}`);
    return false;
  }


  return true;
}
