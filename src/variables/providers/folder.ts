import { TFolder } from "obsidian";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Folder = {
  root_folder: string,
  depth: number,
  include_roots: boolean,
  folder_filter_set_name: string,
};

export const parseFolderVariableFrontmatter = (fm:any) => ({
  root_folder: fm.in_folder,
  depth: fm.at_depth,
  include_roots: typeof fm?.includes_roots === "undefined" ? undefined :
    typeof fm?.includes_roots === "boolean" ? fm?.includes_roots :
      Boolean(fm?.includes_roots?.[0]?.toUpperCase() === "T"),
  folder_filter_set_name: fm.folder_filter_set_name,
})

export async function getFolderVariableValue(variable: TemplateVariable&TemplateVariableVariables_Folder, existingValue:string):Promise<string>{
  if (!validateFolder(variable, existingValue, false)) {
    
    try {
      const newProjectFolder = (await (app as any).plugins.plugins["picker"].api_getFolder(variable.root_folder, variable.depth, variable.include_roots, variable.folder_filter_set_name)) as TFolder;
      existingValue = newProjectFolder.path;
    } catch (e){
      console.log(e);
    }
    validateFolder(variable, existingValue, true);
  }

  return existingValue;
}


function validateFolder(variable: TemplateVariable & TemplateVariableVariables_Folder, value: string, throwErrors: boolean): boolean {
  if (!(app.vault.getAbstractFileByPath(value) instanceof TFolder)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required folder variable ${variable.name}`);
    return false;
  }

  return true;
}