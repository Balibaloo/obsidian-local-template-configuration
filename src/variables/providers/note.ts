import { App, TFile } from "obsidian";
import { getRelativePath, TemplateVariable } from "..";

export type TemplateVariableVariables_Note = {
  filter_set_name: string,
  include_path_name: string,
  exclude_path_name: string,
  include_note_name: string,
  exclude_note_name: string,
  include_tags: string,
  exclude_tags: string,
  note_output_format: string,
};

export const parseNoteVariableFrontmatter = (app: App, fm:any) : TemplateVariableVariables_Note => ({
  filter_set_name: fm.filter_set_name,
  include_path_name: fm.include_path_name,
  exclude_path_name: fm.exclude_path_name,
  include_note_name: fm.include_note_name,
  exclude_note_name: fm.exclude_note_name,
  include_tags: fm.include_tags,
  exclude_tags: fm.exclude_tags,
  note_output_format: fm.note_output_format,
})

export async function getNoteVariableValue( app:App, variable:TemplateVariable&TemplateVariableVariables_Note, existingValue:string, sourceNotePath:string ): Promise<string> {
  const parentFolderPath = sourceNotePath?.split("/").slice(0, -1).join("/") ?? "/";

  if (!validateNote(app, variable, existingValue, parentFolderPath, false)) {
    
    try {
      const filteredOpener = (app as any).plugins.plugins["filtered-opener"];
      if (!filteredOpener) {
        throw new Error("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
      }
       

      const selectedNote = await filteredOpener.api_getNote( variable.filter_set_name ?? {
        includePathName: getRelativePath( variable.include_path_name, parentFolderPath ),
        excludePathName: getRelativePath( variable.exclude_path_name, parentFolderPath ),
        includeNoteName: variable.include_note_name,
        excludeNoteName: variable.exclude_note_name,
        includeTags: variable.include_tags,
        excludeTags: variable.exclude_tags,
      });

      if (!(selectedNote instanceof TFile))
        throw new Error(`Error: Filtered Opener plugin did not return a note for variable ${variable.name}`);
                  
      existingValue = selectedNote.path;
    } catch (e){
      console.log(e);
    }
    validateNote(app, variable, existingValue, parentFolderPath, true);
  }

    
  if ( !["path","name"].contains( variable.note_output_format ) ){
    variable.note_output_format = "path";

    if ( variable.note_output_format )
      console.warn("Unrecognized note_output_format value:", variable.note_output_format);
  }
  
  // @ts-ignore earlier validateNote ensured that return value is a valid note
  const absolutePath = getRelativePath( existingValue, parentFolderPath ) as string;
  if ( variable.note_output_format === "name" ){
    // If absolute path has no slash then it is in root
    return absolutePath.split("/").at(-1) || absolutePath;
  }
  
  return absolutePath;
}


function validateNote(app: App, variable: TemplateVariable & TemplateVariableVariables_Note, value: string, relativeRootPath:string, throwErrors: boolean): boolean {
  const resolvedPath = getRelativePath( value , relativeRootPath );

  if ( ! resolvedPath || ! (app.vault.getAbstractFileByPath( resolvedPath + ".md" ) instanceof TFile)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required note variable ${variable.name}`);
    return false;
  }

  return true;
}