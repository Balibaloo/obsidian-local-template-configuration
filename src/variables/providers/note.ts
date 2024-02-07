import { TFile, normalizePath } from "obsidian";
import { TemplateVariable } from "..";

export type TemplateVariableVariables_Note = {
  note_filter_set_name: string,
};

export const parseNoteVariableFrontmatter = (fm:any) : TemplateVariableVariables_Note => ({
  note_filter_set_name: fm.note_filter_set_name,
})

export async function getNoteVariableValue(variable: TemplateVariable&TemplateVariableVariables_Note, existingValue:string):Promise<string>{
  if (!validateNote(variable, existingValue, false)) {
    
    try {
      const selectedNote = (await (app as any).plugins.plugins["picker"].api_getNote(variable.note_filter_set_name)) as TFile;
      console.log("got note");
      console.log(selectedNote);
      existingValue = selectedNote.path;
    } catch (e){
      console.log(e);
    }
    validateNote(variable, existingValue, true);
  }

  return existingValue;
}


function validateNote(variable: TemplateVariable & TemplateVariableVariables_Note, value: string, throwErrors: boolean): boolean {
  if (!(app.vault.getAbstractFileByPath(normalizePath(value)) instanceof TFile)) {
    if (variable.required && throwErrors)
      throw new Error(`Error: missing required note variable ${variable.name}`);
    return false;
  }

  return true;
}