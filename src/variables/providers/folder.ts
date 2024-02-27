import { App, TFolder, normalizePath } from "obsidian";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Folder = {
  root_folder: string,
  depth: number,
  include_roots: boolean,
  folder_filter_set_name: string,
};

export const parseFolderVariableFrontmatter = (app: App, fm:any) => ({
  root_folder: fm.in_folder,
  depth: fm.at_depth,
  include_roots: typeof fm?.includes_roots === "undefined" ? undefined :
    typeof fm?.includes_roots === "boolean" ? fm?.includes_roots :
      Boolean(fm?.includes_roots?.[0]?.toUpperCase() === "T"),
  folder_filter_set_name: fm.folder_filter_set_name,
})

export async function getFolderVariableValue(app: App,variable: TemplateVariable&TemplateVariableVariables_Folder, existingValue:string):Promise<string>{
  if (!validateFolder(app, variable, existingValue, false)) {
    
    try {
      const filteredOpener = (this.app as any).plugins.plugins["filtered-opener"];
      if (!filteredOpener) {
        throw new Error("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
      }

      const newProjectFolder = await filteredOpener.api_getFolder(variable.root_folder, variable.depth, variable.include_roots, variable.folder_filter_set_name);
      if (!(newProjectFolder instanceof TFolder))
        throw new Error(`Error: Filtered Opener plugin did not return a folder for variable ${variable.name}`);
      
      existingValue = newProjectFolder.path;
    } catch (e){
      console.log(e);
    }
    validateFolder(app, variable, existingValue, true);
  }

  return existingValue;
}


function validateFolder(app: App, variable: TemplateVariable & TemplateVariableVariables_Folder, value: string, throwErrors: boolean): boolean {
  if (!(app.vault.getAbstractFileByPath(normalizePath(value)) instanceof TFolder)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required folder variable ${variable.name}`);
    return false;
  }

  return true;
}