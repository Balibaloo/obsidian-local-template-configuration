import { Notice } from "obsidian";
import * as path from "path";
import PTPlugin from "./main";
import { Intent } from "./types";


export async function runIntent(plugin:PTPlugin, intent: Intent) {
  console.log("Running", intent);

  const newFileName = intent.name;
  const newFileContents = intent.name;

  let newFileFolderPath: string | void = intent.output_path;
  if (!newFileFolderPath) {
    new Notice(`Error: Intent ${intent.name} missing output path`);
    return;
  }

  if (newFileFolderPath.endsWith("/"))
    newFileFolderPath = newFileFolderPath.slice(0, -1);

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