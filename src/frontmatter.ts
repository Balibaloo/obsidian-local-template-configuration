import { App, TFile, FrontMatterCache } from "obsidian";
import { Intent } from "./types";


export function getIntentsFromFM(fm: FrontMatterCache): Intent[] {
  const newIntents: Intent[] = (fm?.intents || []).map((iFm: any): Intent => {
    return {
      name: iFm.name,
      output_path: iFm.output_path,
    }
  });

  return newIntents;
}


export async function getFrontmatter(app: App, file: TFile): Promise<FrontMatterCache> {
  return new Promise((resolve, reject) => {
    app.fileManager.processFrontMatter(file, fm => {
      resolve(fm);
    })
  })
}