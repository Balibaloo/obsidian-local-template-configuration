import { App, TFile, FrontMatterCache } from "obsidian";
import { Intent, Template, NewNoteProperties, TemplateVariable, TemplateVariableType } from "./types";


export function getIntentsFromFM(fm: FrontMatterCache): Intent[] {
  const newIntents: Intent[] = (fm?.intents || []).map((iFm: any): Intent => {
    return {
      name: iFm.name,
      templates: getFMTemplates(iFm),
      newNoteProperties: getNewNoteProperties(iFm),
    }
  });

  return newIntents;
}

function getFMTemplates(fm: any): Template[] {
  return (fm?.templates || []).map((tFm: any): Template =>
  ({
    name: tFm.name,
    path: tFm.path,
    newNoteProperties: getNewNoteProperties(tFm),
  })
  );
}

function getNewNoteProperties(fm: any): NewNoteProperties {
  return {
    output_pathname: fm.output_pathname,
    output_pathname_template: fm.output_pathname_template,
    variables: getVariablesFromFM(fm),
  }
}

export function getVariablesFromFM(fm:any){
  return (fm?.variables || []).map((v: any): TemplateVariable => {
    const type: TemplateVariableType = TemplateVariableType[v.type as keyof typeof TemplateVariableType]
      || TemplateVariableType.text;

    return {
      name: v.name,
      type: type,
      required: typeof v?.required === "undefined" ? undefined :
        typeof v?.required === "boolean" ? v?.required : 
        Boolean(v?.required?.[0]?.toUpperCase() === "T"),
      use_selection: typeof v?.use_selection === "undefined" ? undefined :
        typeof v?.use_selection === "boolean" ? v?.use_selection : 
        Boolean(v?.use_selection?.[0]?.toUpperCase() === "T"),
      min: parseFloat(v.min),
      initial: v.initial,
      max: parseFloat(v.max),
      placeholder: v.placeholder,
      regex: v.regex,
    }
  })
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