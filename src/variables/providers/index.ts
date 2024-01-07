import { TemplateVariable } from "../templateVariables";
import { 
  TemplateVariableVariables_Text, 
  getTextVariableValue, 
  parseTextVariableFrontmatter 
} from "./text";
import { TemplateVariableVariables_Number, 
  getNumberVariableValue, 
  parseNumberVariableFrontmatter 
} from "./number";
import {
  TemplateVariableVariables_NaturalDate,
  getNaturalDateVariableValue, 
  parseNaturalDateVariableFrontmatter
} from "./natural_date";
import {
  TemplateVariableVariables_Directory,
  getDirectoryVariableValue,
  parseDirectoryVariableFrontmatter
} from "./directory";

export enum TemplateVariableType {
  text = "text",
  number = "number",
  natural_date = "natural_date",
  directory = "directory",
}

export type TemplateVariableVariables =
  | TemplateVariableVariables_Text
  | TemplateVariableVariables_Number
  | TemplateVariableVariables_NaturalDate
  | TemplateVariableVariables_Directory;


export type TemplateVariableVariablesLut = {
  [T in TemplateVariableType]: {
    [TemplateVariableType.text]: TemplateVariableVariables_Text,
    [TemplateVariableType.number]: TemplateVariableVariables_Number,
    [TemplateVariableType.natural_date]: TemplateVariableVariables_NaturalDate,
    [TemplateVariableType.directory]: TemplateVariableVariables_Directory,
  }[T]
};


export const variableProviderVariableParsers: {
  [K in keyof TemplateVariableVariablesLut]: (fm: any) => TemplateVariableVariablesLut[K];
} = {
  [TemplateVariableType.text]: parseTextVariableFrontmatter,
  [TemplateVariableType.number]: parseNumberVariableFrontmatter,
  [TemplateVariableType.natural_date]: parseNaturalDateVariableFrontmatter,
  [TemplateVariableType.directory]: parseDirectoryVariableFrontmatter,
};

export const variableProviderVariableGetters: {
  [K in keyof TemplateVariableVariablesLut]: (variable: TemplateVariable & TemplateVariableVariablesLut[K], value: string) => Promise<string>;
} = {
  [TemplateVariableType.text]: getTextVariableValue,
  [TemplateVariableType.number]: getNumberVariableValue,
  [TemplateVariableType.natural_date]: getNaturalDateVariableValue,
  [TemplateVariableType.directory]: getDirectoryVariableValue,
};

