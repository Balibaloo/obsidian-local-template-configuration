import { Intent } from "./intent"
import { PTSettings } from "./settings"
import { hasNewNoteProperties, NewNoteProperties } from "./newNoteProperties";
import { Template } from "./template";
import { TemplateVariable } from "./templateVariable"
import { TemplateVariableType } from "./templateVariableType";
import { ReservedVariableName } from "./reservedVariableName";
import { GenericInputPrompt } from "./suggest";

export { TemplateVariableType, ReservedVariableName, GenericInputPrompt };
export type { PTSettings, Intent, hasNewNoteProperties, NewNoteProperties, Template, TemplateVariable};