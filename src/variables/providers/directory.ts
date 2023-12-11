import { TFolder } from "obsidian";
import { TemplateVariable } from "../templateVariable";
import { TemplateVariableVariables_Directory } from "../templateVariableVariables";


export async function getDirectoryVariableValue(variable: TemplateVariable&TemplateVariableVariables_Directory, existingValue:string):Promise<string>{
  if (!validateDirectory(variable, existingValue, false)) {
    
    try {
      const newProjectFolder = (await (this.app as any).plugins.plugins["picker"].api_getDir(variable.root_dir, variable.depth, variable.include_roots)) as TFolder;
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