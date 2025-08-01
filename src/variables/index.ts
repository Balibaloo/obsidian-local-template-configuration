
import { getVariableValues } from "./templateVariables";
import { TemplateVariableType, TemplateVariableVariables, variableProviderVariableParsers } from "./providers";
import { normalizePath } from "obsidian";
import { join } from "path";

export enum ReservedVariableName {
  intent_name = "intent_name",
  with_name = "with_name",
  in_folder = "in_folder",
  replaces_selection_with = "replaces_selection_with",
}

export type TemplateVariable = {
  name: string,
  type: TemplateVariableType,
  disabled: boolean,
  hidden: boolean,
  required?: boolean,
  use_selection?: boolean,
  initial?: string,
  placeholder?: string,
  prompt?: string,
  description?: string,
} & TemplateVariableVariables

function getRelativePath( path:string|null|undefined, relativeRootPath:string|null|undefined ): string|undefined {
  if ( path === "" || path === null || path === undefined )
    return undefined;

  path = path.replace(new RegExp("\.md$"), "");

  if (path[0] === "."){
    if (relativeRootPath === null || relativeRootPath === undefined)
      return undefined;

    path = join( relativeRootPath, path )
  }

  return normalizePath( path );
}

export {
  getVariableValues,
  TemplateVariableType,
  variableProviderVariableParsers, 
  getRelativePath,
};