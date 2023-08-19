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


// https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
export function namedObjectDeepMerge(obj1: any, obj2: any) {
  const clone1 = structuredClone(obj1);
  const clone2 = structuredClone(obj2);

  if (clone2 instanceof Array && clone1 instanceof Array) {
    // merge same name items, push new items 
    clone2.forEach((item: any) => {
      const sharedIndex = clone1.findIndex((v: any) => v.name === item.name);
      if (sharedIndex === -1)
        return clone1.push(item);

      clone1[sharedIndex] = namedObjectDeepMerge(clone1[sharedIndex], item);
    })
  } else if (clone2 instanceof Object && clone1 instanceof Object) {
    // Merge items by key
    for (let key in clone2) {
      clone1[key] = namedObjectDeepMerge(clone1[key], clone2[key]);
    }
  } else {
    // Else primitive value
    return ![null, "", undefined].includes(clone2) ? clone2 : clone1;
  }

  return clone1;
};