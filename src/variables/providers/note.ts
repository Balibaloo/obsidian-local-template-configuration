import { App, TFile, normalizePath } from "obsidian";
import { join as joinPath } from "path";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Note = {
  filter_set_name: string,
  include_path_name: string,
  exclude_path_name: string,
  include_note_name: string,
  exclude_note_name: string,
  include_tags: string,
  exclude_tags: string,
};

export const parseNoteVariableFrontmatter = (app: App, fm:any) : TemplateVariableVariables_Note => ({
  filter_set_name: fm.filter_set_name,
  include_path_name: fm.include_path_name,
  exclude_path_name: fm.exclude_path_name,
  include_note_name: fm.include_note_name,
  exclude_note_name: fm.exclude_note_name,
  include_tags: fm.include_tags,
  exclude_tags: fm.exclude_tags,
})

export async function getNoteVariableValue( app:App, variable:TemplateVariable&TemplateVariableVariables_Note, existingValue:string, sourceNotePath:string ): Promise<string> {
  if (!validateNote(app, variable, existingValue, false)) {
    
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

      const selectedNote = await filteredOpener.api_getNote( variable.filter_set_name ?? {
        includePathName: include_path_name,
        excludePathName: exclude_path_name,
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
    validateNote(app, variable, existingValue, true);
  }

  return existingValue;
}


function validateNote(app: App, variable: TemplateVariable & TemplateVariableVariables_Note, value: string, throwErrors: boolean): boolean {
  if (!value || !(app.vault.getAbstractFileByPath(normalizePath(value)) instanceof TFile)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required note variable ${variable.name}`);
    return false;
  }

  return true;
}