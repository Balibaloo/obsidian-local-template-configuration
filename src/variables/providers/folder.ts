import { App, TFolder, normalizePath } from "obsidian";
import { join as joinPath } from "path";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Folder = {
  root_folder: string,
  depth: number,
  include_roots: boolean,
  filter_set_name: string,
  include_path_name: string,
  exclude_path_name: string,
  include_folder_name: string,
  exclude_folder_name: string,
};

export const parseFolderVariableFrontmatter = (app: App, fm:any) => ({
  root_folder: fm.in_folder,
  depth: fm.at_depth,
  include_roots: typeof fm?.includes_roots === "undefined" ? undefined :
    typeof fm?.includes_roots === "boolean" ? fm?.includes_roots :
      Boolean(fm?.includes_roots?.[0]?.toUpperCase() === "T"),
  filter_set_name: fm.filter_set_name,
  include_path_name: fm.include_path_name,
  exclude_path_name: fm.exclude_path_name,
  include_folder_name: fm.include_folder_name,
  exclude_folder_name: fm.exclude_folder_name,
})

export async function getFolderVariableValue( app:App, variable:TemplateVariable&TemplateVariableVariables_Folder, existingValue:string, sourceNotePath:string ): Promise<string> {
  if (!validateFolder(app, variable, existingValue, false)) {
    
    try {
      const filteredOpener = (app as any).plugins.plugins["filtered-opener"];
      if (!filteredOpener) {
        throw new Error("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
      }

      const parentFolderPath = sourceNotePath?.split("/").slice(0, -1).join("/") ?? "/";

      const include_path_name = variable.include_path_name && normalizePath(
          variable.include_path_name[0] === "." 
          ? joinPath( parentFolderPath, variable.include_path_name )
          : variable.include_path_name
      );
      
      const exclude_path_name = variable.exclude_path_name && normalizePath(
          variable.exclude_path_name[0] === "." 
          ? joinPath( parentFolderPath, variable.exclude_path_name )
          : variable.exclude_path_name
        );

      const newProjectFolder = await filteredOpener.api_getFolder(
        variable.root_folder, 
        variable.depth, 
        variable.include_roots, 
        variable.filter_set_name ?? {
          includePathName: include_path_name,
          excludePathName: exclude_path_name,
          includeFolderName: variable.include_folder_name,
          excludeFolderName: variable.exclude_folder_name,
        });
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
  if (!value || !(app.vault.getAbstractFileByPath(normalizePath(value)) instanceof TFolder)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required folder variable ${variable.name}`);
    return false;
  }

  return true;
}