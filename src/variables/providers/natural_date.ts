import { Notice } from "obsidian";
import { GenericInputPrompt } from "../suggest";
import { TemplateVariable } from "../templateVariables";

export type TemplateVariableVariables_NaturalDate = {
};

export const parseNaturalDateVariableFrontmatter = (fm: any) => ({
});

export async function getNaturalDateVariableValue(variable: TemplateVariable&TemplateVariableVariables_NaturalDate, existingValue:string): Promise<string>{
  if (!validateNaturalDate(variable, existingValue, false)) {
    try {
      existingValue = await GenericInputPrompt.Prompt(app, variable,
        text => validateNaturalDate(variable, text, false),
        "Error: Please enter a valid natural language date");
    } catch (e){
      console.log(e);
    }

    validateNaturalDate(variable, existingValue, true);
  }

  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
  existingValue = NLDates.parseDate(existingValue).formattedString;
  return existingValue;
}

function validateNaturalDate(variable: TemplateVariable & TemplateVariableVariables_NaturalDate, val: string, throwErrors: boolean): boolean {
  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
  if (!NLDates) {
    throw new Error("Natural Language dates is required for natural date parsing. Please install it from the community plugin settings");
  }
  const parsedDate = NLDates.parseDate(val);
  if (!parsedDate.moment.isValid()) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required date variable ${variable.name}`);
    return false;
  }

  return true;
}