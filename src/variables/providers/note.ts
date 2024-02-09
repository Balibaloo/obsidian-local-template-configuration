import { App, TFile, normalizePath } from "obsidian";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Note = {
  note_filter_set_name: string,
};

export const parseNoteVariableFrontmatter = (app: App, fm:any) : TemplateVariableVariables_Note => ({
  note_filter_set_name: fm.note_filter_set_name,
})

export async function getNoteVariableValue(app: App, variable: TemplateVariable&TemplateVariableVariables_Note, existingValue:string):Promise<string>{
  if (!validateNote(app, variable, existingValue, false)) {
    
    try {
      const selectedNote = await (app as any).plugins.plugins["filtered-opener"].api_getNote(variable.note_filter_set_name);
      if (!(selectedNote instanceof TFile))
        throw new Error(`Error: picker plugin did not return a note for variable ${variable.name}`);
                  
      existingValue = selectedNote.path;
    } catch (e){
      console.log(e);
    }
    validateNote(app, variable, existingValue, true);
  }

  return existingValue;
}


function validateNote(app: App, variable: TemplateVariable & TemplateVariableVariables_Note, value: string, throwErrors: boolean): boolean {
  if (!(app.vault.getAbstractFileByPath(normalizePath(value)) instanceof TFile)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required note variable ${variable.name}`);
    return false;
  }

  return true;
}