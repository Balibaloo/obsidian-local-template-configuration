import { App, Notice, TFolder } from "obsidian";
import { getRelativePath, TemplateVariable } from "..";

export type TemplateVariableVariables_Folder = {
  root_folder: string,
  depth: number,
  include_roots: boolean,
  filter_set_name: string,
  include_path_name: string,
  exclude_path_name: string,
  include_folder_name: string,
  exclude_folder_name: string,
  folder_output_format: string,
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
  folder_output_format: fm.folder_output_format,
})

export async function getFolderVariableValue( app:App, variable:TemplateVariable&TemplateVariableVariables_Folder, existingValue:string, sourceNotePath:string ): Promise<string> {
  const parentFolderPath = sourceNotePath?.split("/").slice(0, -1).join("/") ?? "/";

  if (!validateFolder(app, variable, existingValue, parentFolderPath, false)) {
    if ( existingValue )
      new Notice(`Invalid selection: ${existingValue}`);
    
    try {
      const filteredOpener = (app as any).plugins.plugins["filtered-opener"];
      if (!filteredOpener) {
        throw new Error("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
      }

      const newProjectFolder = await filteredOpener.api_getFolder(
        variable.filter_set_name ?? {
          rootFolder: variable.root_folder,
          includePathName: getRelativePath( variable.include_path_name, parentFolderPath ),
          excludePathName: getRelativePath( variable.exclude_path_name, parentFolderPath ),
          includeFolderName: variable.include_folder_name,
          excludeFolderName: variable.exclude_folder_name,
          includeParents: variable.include_roots,
          depth: variable.depth,
        });
      if (!(newProjectFolder instanceof TFolder))
        throw new Error(`Error: Filtered Opener plugin did not return a folder for variable ${variable.name}`);
      
      existingValue = newProjectFolder.path;
    } catch (e){
      console.log(e);
    }
    validateFolder(app, variable, existingValue, parentFolderPath, true);
  }

  
  if ( !["path","name"].contains( variable.folder_output_format ) ){
    variable.folder_output_format = "path";

    if ( variable.folder_output_format )
      console.warn("Unrecognized folder_output_format value:", variable.folder_output_format);
  }
  
  // @ts-ignore earlier validateFolder ensured that return value is a valid folder
  const absolutePath = getRelativePath( existingValue, parentFolderPath ) as string;
  if ( variable.folder_output_format === "name" ){
    // If absolute path has no slash then it is in root
    return absolutePath.split("/").at(-1) || absolutePath;
  }
  
  return absolutePath;
}


function validateFolder(app: App, variable: TemplateVariable & TemplateVariableVariables_Folder, value: string, relativeRootPath:string, throwErrors: boolean): boolean {
  const resolvedPath = getRelativePath( value, relativeRootPath );

  if (!resolvedPath || !(app.vault.getAbstractFileByPath( resolvedPath ) instanceof TFolder)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required folder variable ${variable.name}`);
    return false;
  }

  return true;
}