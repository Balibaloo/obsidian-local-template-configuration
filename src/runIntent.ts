import { Notice, TFile, TFolder } from "obsidian";
import * as path from "path";
import PTPlugin from "./main";
import { Intent } from "./types";


export async function runIntent(plugin:PTPlugin, intent: Intent, projectFile:TFile) {
  console.log("Running", intent);

  const newFileName = intent.name;
  const newFileContents = intent.name;

  const newFileFolderPath = getFileOutputPath(intent, projectFile);
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

function getFileOutputPath(intent:Intent, projectFile: TFile): string | void{
  if (!intent.output_path)
    return;

  const newFileFolderPath: string | void = intent.output_path[0] === "." ?
				path.join(projectFile.parent?.path as string, intent.output_path).replaceAll("\\", "/") :
				intent.output_path;
  if (!newFileFolderPath)
    return;

  if (newFileFolderPath.endsWith("/"))
    return newFileFolderPath.slice(0, -1);

  return newFileFolderPath;
}