import { Intent } from "./intent/intent"
import { PTSettings } from "./settings/settings"
import { hasNewNoteProperties, NewNoteProperties } from "./intent/newNoteProperties";
import { Template } from "./template/template";
import { TemplateVariable } from "./variables/templateVariable"
import { TemplateVariableType } from "./variables/templateVariableType";
import {
  TemplateVariableVariables,
  TemplateVariableVariablesLut,
  TemplateVariableVariables_Text,
  TemplateVariableVariables_Number,
  TemplateVariableVariables_NaturalDate,
  TemplateVariableVariables_Directory,
} from "./variables/templateVariableVariables";
import { ReservedVariableName } from "./variables/reservedVariableName";
import { GenericInputPrompt } from "./variables/suggest";

export { TemplateVariableType, ReservedVariableName, GenericInputPrompt };
export type {
  PTSettings, Intent, hasNewNoteProperties, NewNoteProperties, Template, 
  TemplateVariable,
  TemplateVariableVariables,
  TemplateVariableVariablesLut,
  TemplateVariableVariables_Text,
  TemplateVariableVariables_Number,
  TemplateVariableVariables_NaturalDate,
  TemplateVariableVariables_Directory,
};