import { App, FrontMatterCache, TAbstractFile, TFile } from "obsidian";
import {
  Intent,
  NewNoteProperties,
  Template,
  TemplateVariable,
  TemplateVariableType,
  TemplateVariableVariablesLut
} from ".";
import { join as joinPath } from "path";


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

const variableProviderVariableParsers: {
  [K in keyof TemplateVariableVariablesLut]: (fm: any) => TemplateVariableVariablesLut[K];
} = {
  [TemplateVariableType.text]: (fm) => ({
    regex: fm.regex,
  }),
  [TemplateVariableType.number]: (fm) => ({
    min: parseFloat(fm.min),
    max: parseFloat(fm.max),
  }),
  [TemplateVariableType.natural_date]: (fm) => ({}),
  [TemplateVariableType.directory]: (fm) => ({
    root_dir: fm.root_dir,
    depth: fm.depth,
    include_roots: typeof fm?.include_roots === "undefined" ? undefined :
    typeof fm?.include_roots === "boolean" ? fm?.include_roots :
      Boolean(fm?.include_roots?.[0]?.toUpperCase() === "T"),
  }),
};

export function getVariablesFromFM(fm: any) {
  return (fm?.variables || []).map((v: any): TemplateVariable => {
    const type: TemplateVariableType = TemplateVariableType[v.type as keyof typeof TemplateVariableType]
      || TemplateVariableType.text;

    const baseVariables: TemplateVariable = {
      name: v.name,
      type: type,
      required: typeof v?.required === "undefined" ? undefined :
        typeof v?.required === "boolean" ? v?.required :
          Boolean(v?.required?.[0]?.toUpperCase() === "T"),
      use_selection: typeof v?.use_selection === "undefined" ? undefined :
        typeof v?.use_selection === "boolean" ? v?.use_selection :
          Boolean(v?.use_selection?.[0]?.toUpperCase() === "T"),
      initial: v.initial,
      placeholder: v.placeholder,
    }

    return Object.assign(baseVariables, variableProviderVariableParsers[type](fm))
  })
}



export async function getFrontmatter(app: App, file: TFile): Promise<FrontMatterCache> {
  return new Promise((resolve, reject) => {
    app.fileManager.processFrontMatter(file, async fm => {
      
      // Resolve file import contents
      const importPathsConfig: string[] | string[][] = [fm.intent_import || []];
      const importsPaths: string[] = importPathsConfig.flat();

      let fmImports = {}
      for (let path of importsPaths) {
        const resolvedPath = resolvePathRelativeToAbstractFile(path, file) + ".md";
        const importFile = app.vault.getAbstractFileByPath(resolvedPath);

        console.log("Importing:", resolvedPath);
        if (!(importFile instanceof TFile)) {
          console.log(resolvedPath, "is not a file");
          continue;
        }

        const fmI = await getFrontmatter(app, importFile)

        fmImports = namedObjectDeepMerge(fmImports, fmI);
      }

      resolve(namedObjectDeepMerge(fmImports, fm));
    })
  })
}


export function resolvePathRelativeToAbstractFile(path: string | void, projectFile: TAbstractFile): string | void {
  if (!path)
    return;

  const parentFolder = projectFile instanceof TFile ? projectFile.parent : projectFile;
  const newFileFolderPath: string | void = path[0] === "." ?
    joinPath(parentFolder?.path as string, path).replaceAll("\\", "/") :
    path;
  if (!newFileFolderPath)
    return;

  // Remove directory trailing "/"
  if (newFileFolderPath.endsWith("/"))
    return newFileFolderPath.slice(0, -1);

  return newFileFolderPath;
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