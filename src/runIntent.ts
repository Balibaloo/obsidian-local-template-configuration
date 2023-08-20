import { Notice, TFile, TFolder } from "obsidian";
import { join as pathJoin } from "path";
import PTPlugin from "./main";
import { Intent, ReservedVariableName } from "./types";
import { getIntentTemplate } from "./templates";
import { getVariableValues } from "./template_variables";
import * as path from "path";


export async function runIntent(plugin:PTPlugin, intent: Intent, projectFile:TFile) {
  console.log("Running", intent);

  const variablesToGather = [...intent.newNoteProperties.variables];

  // If templates configured
  let newFileContents = "";
  if (intent.templates.length !== 0) {
    const chosenTemplate = await getIntentTemplate(intent);
    console.log("Chosen template", chosenTemplate);
    if (!chosenTemplate) {
      new Notice("Error: No template selected");
      return;
    }

    // get template
    const templatePath: string | void = resolveFilePath(chosenTemplate.path, projectFile);
    if (!templatePath) {
      new Notice(`Error: Please configure a valid path for the ${intent.name} - ${chosenTemplate.name} template`);
      return;
    }

    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(templateFile instanceof TFile)) {
      new Notice("Error: Template is not a file: " + templatePath);
      return;
    }

    newFileContents = await this.app.vault.cachedRead(templateFile);
    variablesToGather.push(...chosenTemplate.newNoteProperties.variables);
  }

  const gatheredValues = await getVariableValues(plugin.app, variablesToGather);
  for (let variable of variablesToGather){
    console.log(variable.name, gatheredValues[variable.name]);
    if (variable.required && (
      gatheredValues[variable.name] === undefined ||
      gatheredValues[variable.name].length === 0 
    )){
      new Notice(`Error: missing required variable ${variable.name}`);
      return;
    }
  }

  newFileContents = getReplacedVariablesText(newFileContents, gatheredValues);

  const newFileName = getNewFileName(intent, gatheredValues);

  const newFileFolderPath = resolveFilePath(intent.newNoteProperties.output_path, projectFile);
  if (!newFileFolderPath){
    new Notice(`Error: Failed to determine ${intent.name} output path`);
    return;
  }

  // create folder if not exists
  if (!(this.app.vault.getAbstractFileByPath(newFileFolderPath) instanceof TFolder)) {
    await this.app.vault.createFolder(newFileFolderPath);
  }

  const newFilePath = path.join(newFileFolderPath, newFileName).replaceAll("\\", "/");

  const newFile = await this.app.vault.create(
    newFilePath.endsWith(".md") ? newFilePath : newFilePath + ".md",
    newFileContents
  );

  // open new file in tab
  const newLeaf = this.app.workspace.getLeaf("tab");
  await newLeaf.openFile(newFile); // TODO Add toggle setting
  console.log("New file created");

}

function resolveFilePath(path: string | void, projectFile: TFile): string | void {
  if (!path)
    return;

  const newFileFolderPath: string | void = path[0] === "." ?
    pathJoin(projectFile.parent?.path as string, path).replaceAll("\\", "/") :
    path;
  if (!newFileFolderPath)
    return;

  if (newFileFolderPath.endsWith("/"))
    return newFileFolderPath.slice(0, -1);

  return newFileFolderPath;
}

function getReplacedVariablesText(text: string, values:{[key: string]: string}): string{
  return Object.keys(values).reduce((text, varName)=>
    text.replaceAll(new RegExp(`\{\{\s*${varName}\s*\}\}`, "g"), values[varName])
    , text);
}

function getNewFileName(intent:Intent, values:{[key: string]: string}):string{
  if (intent.newNoteProperties.note_name_template)
    return getReplacedVariablesText(intent.newNoteProperties.note_name_template, values);

  if (values[ReservedVariableName.newNoteName])
    return values[ReservedVariableName.newNoteName];
  
  if (intent.newNoteProperties.note_name)
    return intent.newNoteProperties.note_name; 
  
  return intent.name;
}