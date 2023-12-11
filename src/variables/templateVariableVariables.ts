import { TemplateVariableType } from "..";

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

export type TemplateVariableVariables_Text = {
  regex ?: string,
};

export type TemplateVariableVariables_Number = {
  min ?: number,
  max ?: number,
};

export type TemplateVariableVariables_NaturalDate = {
};

export type TemplateVariableVariables_Directory = {
  root_dir: string,
  depth: number,
  include_roots: boolean,
};