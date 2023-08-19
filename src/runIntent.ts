import { Notice, TFile, TFolder } from "obsidian";
import { join as pathJoin } from "path";
import PTPlugin from "./main";
import { Intent } from "./types";
import { getIntentTemplate } from "./templates";
import * as path from "path";


export async function runIntent(plugin:PTPlugin, intent: Intent, projectFile:TFile) {
  console.log("Running", intent);

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
  }

  const newFileName = intent.newNoteProperties.note_name || intent.name;

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