import { App } from "obsidian";
import {
  TemplateVariable,
  TemplateVariableType,
  TemplateVariableVariablesLut,
  TemplateVariableVariables_Directory,
  TemplateVariableVariables_NaturalDate,
  TemplateVariableVariables_Number,
  TemplateVariableVariables_Text,
} from "..";
import {
  getDirectoryVariableValue,
  getNaturalDateVariableValue,
  getNumberVariableValue,
  getTextVariableValue,
} from "./providers";


const variableProviderVariableGetters: {
  [K in keyof TemplateVariableVariablesLut]: (variable:TemplateVariable&TemplateVariableVariablesLut[K], value:string) => Promise<string>;
} = {
  [TemplateVariableType.text]: getTextVariableValue,
  [TemplateVariableType.number]: getNumberVariableValue,
  [TemplateVariableType.natural_date]: getNaturalDateVariableValue,
  [TemplateVariableType.directory]: getDirectoryVariableValue,
};


export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val = existingValues[variable.name] ?? "";
    gatheredValues[variable.name] = variableProviderVariableGetters[variable.type](variable as any, val);
  }

  console.log("Gathered values", gatheredValues);
  return gatheredValues;
}




