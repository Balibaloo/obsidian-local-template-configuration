import { App } from "obsidian";
import { TemplateVariable } from "..";
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
  TemplateVariableVariables_Folder,
  getFolderVariableValue,
  parseFolderVariableFrontmatter
} from "./folder";
import { 
  TemplateVariableVariables_Note, 
  getNoteVariableValue, 
  parseNoteVariableFrontmatter 
} from "./note";

export enum TemplateVariableType {
  text = "text",
  number = "number",
  natural_date = "natural_date",
  note = "note",
  folder = "folder",
}

export type TemplateVariableVariables =
  | TemplateVariableVariables_Text
  | TemplateVariableVariables_Number
  | TemplateVariableVariables_NaturalDate
  | TemplateVariableVariables_Folder;


export type TemplateVariableVariablesLut = {
  [T in TemplateVariableType]: {
    [TemplateVariableType.text]: TemplateVariableVariables_Text,
    [TemplateVariableType.number]: TemplateVariableVariables_Number,
    [TemplateVariableType.natural_date]: TemplateVariableVariables_NaturalDate,
    [TemplateVariableType.note]: TemplateVariableVariables_Note,
    [TemplateVariableType.folder]: TemplateVariableVariables_Folder,
  }[T]
};


export const variableProviderVariableParsers: {
  [K in keyof TemplateVariableVariablesLut]: (app: App, fm: any) => TemplateVariableVariablesLut[K];
} = {
  [TemplateVariableType.text]: parseTextVariableFrontmatter,
  [TemplateVariableType.number]: parseNumberVariableFrontmatter,
  [TemplateVariableType.natural_date]: parseNaturalDateVariableFrontmatter,
  [TemplateVariableType.note]: parseNoteVariableFrontmatter,
  [TemplateVariableType.folder]: parseFolderVariableFrontmatter,
};

export const variableProviderVariableGetters: {
  [K in keyof TemplateVariableVariablesLut]: (app: App, variable: TemplateVariable & TemplateVariableVariablesLut[K], value: string) => Promise<string>;
} = {
  [TemplateVariableType.text]: getTextVariableValue,
  [TemplateVariableType.number]: getNumberVariableValue,
  [TemplateVariableType.natural_date]: getNaturalDateVariableValue,
  [TemplateVariableType.note]: getNoteVariableValue,
  [TemplateVariableType.folder]: getFolderVariableValue,
};

