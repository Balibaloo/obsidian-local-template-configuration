import { App } from "obsidian";
import { TemplateVariable } from "..";
import { GenericInputPrompt } from "../suggest";

export type TemplateVariableVariables_NaturalDate = {
  after?: string,
  before?: string,
};

export const parseNaturalDateVariableFrontmatter = (app: App, fm: any) => {
  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");

  const dateVariable:TemplateVariableVariables_NaturalDate = {
    after: fm.is_after,
    before: fm.is_before,
  }
  
  if (dateVariable.after && !NLDates.parseDate(dateVariable.after).moment.isValid()){
    throw new Error(`Error: Intent variable ${fm.name}, date after property, ${dateVariable.after} is not a valid natural language date.`);
  };

  if (dateVariable.before && !NLDates.parseDate(dateVariable.before).moment.isValid()){
    throw new Error(`Error: Intent variable ${fm.name}, date before property, ${dateVariable.before} is not a valid natural language date.`);
  };

  return dateVariable;
};

export async function getNaturalDateVariableValue(app: App, variable: TemplateVariable&TemplateVariableVariables_NaturalDate, existingValue:string): Promise<string>{
  if (!validateNaturalDate(app, variable, existingValue, false)) {
    try {
      existingValue = await GenericInputPrompt.Prompt(app, variable,
        text => validateNaturalDate(app, variable, text, false),
        "Error: Please enter a valid natural language date"
          + (variable.after ? ` after ${variable.after}` : "")
          + (variable.before && variable.after ? " and" : "")
          + (variable.before ? ` before ${variable.before}` : ""));
    } catch (e){
      console.log(e);
    }

    validateNaturalDate(app, variable, existingValue, true);
  }

  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
  existingValue = NLDates.parseDate(existingValue).formattedString;
  return existingValue;
}

function validateNaturalDate(app: App, variable: TemplateVariable & TemplateVariableVariables_NaturalDate, val: string, throwErrors: boolean): boolean {
  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
  if (!NLDates) {
    throw new Error("Natural Language dates is required for natural date parsing. Please install it from the community plugin settings");
  }
  const parsedDate = NLDates.parseDate(val);
  if (!parsedDate.moment.isValid()) {
    if (variable.required && throwErrors)
      throw new Error(`Error: The date entered for ${variable.name} is not valid`);
    return false;
  }

  if (variable.after && !parsedDate.moment.isAfter(NLDates.parseDate(variable.after).moment)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: The date entered for ${variable.name}, (${parsedDate.formattedString}) "${val}" must be before "${NLDates.parseDate(variable.after).moment }" (${variable.after})`);
    return false;
  }

  if (variable.before && !parsedDate.moment.isBefore(NLDates.parseDate(variable.before).moment)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: The date entered for ${variable.name}, (${parsedDate.formattedString}) "${val}" must be after "${NLDates.parseDate(variable.before).moment }" (${variable.before})`);
    return false;
  }

  return true;
}