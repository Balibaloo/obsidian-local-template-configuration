import { App, FrontMatterCache, TAbstractFile, TFile, normalizePath } from "obsidian";
import { join as joinPath } from "path";
import { Intent, NewNoteProperties, } from ".";
import { 
  Template, 
} from "../templates";
import { 
  TemplateVariable, 
  TemplateVariableType, 
  variableProviderVariableParsers,
} from "../variables";

export function getIntentsFromFM(app: App, fm: FrontMatterCache): Intent[] {
  const newIntents: Intent[] = (fm?.intents_to || []).map((iFm: any): Intent => {
    return {
      name: iFm.make_a,
      disable: typeof iFm?.is_disabled === "undefined" ? undefined :
      typeof iFm?.is_disabled === "boolean" ? iFm?.is_disabled :
        Boolean(iFm?.is_disabled?.[0]?.toUpperCase() === "T"),
      templates: getFMTemplates(app, iFm),
      newNoteProperties: getNewNoteProperties(app, iFm),
    }
  });

  return newIntents;
}

function getFMTemplates(app: App, fm: any): Template[] {
  return (fm?.with_templates || []).map((tFm: any): Template =>
  ({
    name: tFm.called,
    disable: typeof tFm?.is_disabled === "undefined" ? undefined :
    typeof tFm?.is_disabled === "boolean" ? tFm?.is_disabled :
      Boolean(tFm?.is_disabled?.[0]?.toUpperCase() === "T"),
    path: tFm.at_path,
    newNoteProperties: getNewNoteProperties(app, tFm),
  })
  );
}

function getNewNoteProperties(app: App, fm: any): NewNoteProperties {
  return {
    output_pathname: fm.outputs_to_pathname,
    output_pathname_template: fm.outputs_to_templated_pathname,
    variables: getVariablesFromFM(app,fm),
  }
}


function getVariablesFromFM(app: App, fm: any) {
  return (fm?.with_variables || []).map((v: any): TemplateVariable => {
    const type: TemplateVariableType = TemplateVariableType[v.of_type as keyof typeof TemplateVariableType]
      || TemplateVariableType.text;

    const baseVariables: TemplateVariable = {
      name: v.called,
      type: type,
      disable: typeof v?.is_disabled === "undefined" ? undefined :
        typeof v?.is_disabled === "boolean" ? v?.is_disabled :
          Boolean(v?.is_disabled?.[0]?.toUpperCase() === "T"),
      required: typeof v?.is_required === "undefined" ? undefined :
        typeof v?.is_required === "boolean" ? v?.is_required :
          Boolean(v?.is_required?.[0]?.toUpperCase() === "T"),
      use_selection: typeof v?.uses_selection === "undefined" ? undefined :
        typeof v?.uses_selection === "boolean" ? v?.uses_selection :
          Boolean(v?.uses_selection?.[0]?.toUpperCase() === "T"),
      initial: v.is_initially,
      placeholder: v.hinted_as,
      prompt: v.that_prompts,
      description: v.described_as,
    }

    return Object.assign(baseVariables, variableProviderVariableParsers[type](app,v))
  })
}



export async function getFrontmatter(app: App, note: TFile, visited: string[]| null = null): Promise<FrontMatterCache> {
  return new Promise((resolve, reject) => {
    app.fileManager.processFrontMatter(note, async fm => {
      visited = visited || new Array<string>();

      // Resolve note import contents
      const importPathsFM: string[] | string[][] = [fm.intents_imported_from || []];
      const importsPaths: string[] = importPathsFM.flat();

      let fmImports = {}
      for (let path of importsPaths) {
        const resolvedPath = resolvePathRelativeToAbstractFile(path, note) + ".md";
        const importFile = app.vault.getAbstractFileByPath(resolvedPath);

        // Check for circular imports
        if (visited.contains(resolvedPath)){
          console.error("Error: Circular dependency of",resolvedPath,"in", visited);
          return reject(`Error getting frontmatter: \nCircular import of ${path} in ${note.name}`);
        }

        if (!(importFile instanceof TFile)) {
          console.error("Error: importing non-note",resolvedPath);
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
  const newNoteFolderPath: string | void = normalizePath(
    path[0] === "."
    ? joinPath(parentFolder?.path || "", path)
    : path)
  if (!newNoteFolderPath)
    return;

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