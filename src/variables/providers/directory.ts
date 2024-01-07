import { TFolder } from "obsidian";
import { TemplateVariable } from "../templateVariables";

export type TemplateVariableVariables_Directory = {
  root_dir: string,
  depth: number,
  include_roots: boolean,
  dir_filter_set_name: string,
};

export const parseDirectoryVariableFrontmatter = (fm:any) => ({
  root_dir: fm.root_dir,
  depth: fm.depth,
  include_roots: typeof fm?.include_roots === "undefined" ? undefined :
    typeof fm?.include_roots === "boolean" ? fm?.include_roots :
      Boolean(fm?.include_roots?.[0]?.toUpperCase() === "T"),
  dir_filter_set_name: fm.dir_filter_set_name,
})

export async function getDirectoryVariableValue(variable: TemplateVariable&TemplateVariableVariables_Directory, existingValue:string):Promise<string>{
  if (!validateDirectory(variable, existingValue, false)) {
    
    try {
      const newProjectFolder = (await (this.app as any).plugins.plugins["picker"].api_getDir(variable.root_dir, variable.depth, variable.include_roots, variable.dir_filter_set_name)) as TFolder;
      existingValue = newProjectFolder.path;
    } catch (e){
      console.log(e);
    }
    validateDirectory(variable, existingValue, true);
  }

  return existingValue;
}


function validateDirectory(variable: TemplateVariable & TemplateVariableVariables_Directory, value: string, throwErrors: boolean): boolean {
  if (!(app.vault.getAbstractFileByPath(value) instanceof TFolder)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required directory variable ${variable.name}`);
    return false;
  }

  return true;
}