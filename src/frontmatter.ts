import { App, FrontMatterCache, TAbstractFile, TFile } from "obsidian";
import {
  Intent,
  NewNoteProperties,
  Template,
} from ".";
import { join as joinPath } from "path";
import { TemplateVariable } from "./variables";
import { TemplateVariableType, variableProviderVariableParsers } from "./variables/providers";


export function getIntentsFromFM(fm: FrontMatterCache): Intent[] {
  const newIntents: Intent[] = (fm?.intents_to || []).map((iFm: any): Intent => {
    return {
      name: iFm.make_a,
      disable: typeof iFm?.disable === "undefined" ? undefined :
      typeof iFm?.disable === "boolean" ? iFm?.disable :
        Boolean(iFm?.disable?.[0]?.toUpperCase() === "T"),
      templates: getFMTemplates(iFm),
      newNoteProperties: getNewNoteProperties(iFm),
    }
  });

  return newIntents;
}

function getFMTemplates(fm: any): Template[] {
  return (fm?.templates || []).map((tFm: any): Template =>
  ({
    name: tFm.called,
    disable: typeof tFm?.disable === "undefined" ? undefined :
    typeof tFm?.disable === "boolean" ? tFm?.disable :
      Boolean(tFm?.disable?.[0]?.toUpperCase() === "T"),
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


export function getVariablesFromFM(fm: any) {
  return (fm?.variables || []).map((v: any): TemplateVariable => {
    const type: TemplateVariableType = TemplateVariableType[v.of_type as keyof typeof TemplateVariableType]
      || TemplateVariableType.text;

    const baseVariables: TemplateVariable = {
      name: v.called,
      type: type,
      disable: typeof v?.disable === "undefined" ? undefined :
        typeof v?.disable === "boolean" ? v?.disable :
          Boolean(v?.disable?.[0]?.toUpperCase() === "T"),
      required: typeof v?.is_required === "undefined" ? undefined :
        typeof v?.is_required === "boolean" ? v?.is_required :
          Boolean(v?.is_required?.[0]?.toUpperCase() === "T"),
      use_selection: typeof v?.use_selection === "undefined" ? undefined :
        typeof v?.use_selection === "boolean" ? v?.use_selection :
          Boolean(v?.use_selection?.[0]?.toUpperCase() === "T"),
      initial: v.initial,
      placeholder: v.placeholder,
      prompt: v.prompt,
      description: v.description,
    }

    return Object.assign(baseVariables, variableProviderVariableParsers[type](v))
  })
}



export async function getFrontmatter(app: App, note: TFile, visited: string[]| null = null): Promise<FrontMatterCache> {
  return new Promise((resolve, reject) => {
    app.fileManager.processFrontMatter(note, async fm => {
      visited = visited || new Array<string>();

      // Resolve note import contents
      const importPathsFM: string[] | string[][] = [fm.intents_import || []];
      const importsPaths: string[] = importPathsFM.flat();

      let fmImports = {}
      for (let path of importsPaths) {
        const resolvedPath = resolvePathRelativeToAbstractFile(path, note) + ".md";
        const importFile = app.vault.getAbstractFileByPath(resolvedPath);

        // Check for circular imports
        if (visited.contains(resolvedPath)){
          console.log(resolvedPath,"in", visited);
          return reject(`Error getting frontmatter: \nCircular import of ${path} in ${note.name}`);
        }

        if (!(importFile instanceof TFile)) {
          console.log(resolvedPath, "is not a note");
          continue;
        }

        try {
          const fmI = await getFrontmatter(app, importFile, [...visited, resolvedPath])
          fmImports = namedObjectDeepMerge(fmImports, fmI);
        } catch (e){
          reject(e)
        }
      }

      resolve(namedObjectDeepMerge(fmImports, fm));
    })
  })
}


export function resolvePathRelativeToAbstractFile(path: string | void, projectFile: TAbstractFile): string | void {
  if (!path)
    return;

  const parentFolder = projectFile instanceof TFile ? projectFile.parent : projectFile;
  const newNoteFolderPath: string | void = path[0] === "." ?
    joinPath(parentFolder?.path as string, path).replaceAll("\\", "/") :
    path;
  if (!newNoteFolderPath)
    return;

  // Remove directory trailing "/"
  if (newNoteFolderPath.endsWith("/"))
    return newNoteFolderPath.slice(0, -1);

  // Remove leading "/"
  if (newNoteFolderPath.startsWith("/"))
    return newNoteFolderPath.slice(1);

  return newNoteFolderPath.replace(new RegExp("\.md$",), "");
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