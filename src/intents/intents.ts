import { App, FuzzySuggestModal, Notice, TAbstractFile, TFile, TFolder } from "obsidian";
import PTPlugin from "../main";
import { Intent, namedObjectDeepMerge, resolvePathRelativeToAbstractFile } from ".";
import { ReservedVariableName, TemplateVariable, getVariableValues } from "../variables";
import { getIntentTemplate } from "../templates";


class IntentSuggestModal extends FuzzySuggestModal<Intent> {
	constructor(app: App, items: Intent[], callback: (item: Intent) => void) {
		super(app);
		this.items = items;
		this.callback=callback;
	}
	
	items: Intent[];
	callback: (item: Intent) => void;

	getItems(): Intent[] {
		return this.items;
	}

	getItemText(item: Intent): string {
		return `${item.name}`;
	}
	onChooseItem(item: Intent, evt: MouseEvent | KeyboardEvent): void {
		this.callback(item);
	}
}

export async function choseIntent(intents:Intent[]):Promise<Intent> {
  return new Promise((resolve,rejects) => {
    if (intents.length === 0) {
      new Notice(`Error: No intents found`);
      return rejects("No intents found");
    }

    const shownIntents = intents.filter(i => !i.disable);
    if (shownIntents.length === 0) {
      new Notice(`Error: All intents are hidden`);
      return rejects("All intents are hidden");
    }

    if (shownIntents.length === 1) {
      return resolve(shownIntents[0]);
    }
    new IntentSuggestModal(this.app, shownIntents, resolve).open();
  })
}


export async function runIntent(plugin:PTPlugin, intent: Intent, abstractFileOfIntent:TAbstractFile) {
  console.log("Running", intent);

  let variablesToGather = intent.newNoteProperties.variables;

  const selection:string = plugin.app.workspace.activeEditor?.editor?.getSelection() ?? "";
  const selectionSplit = selection.split(new RegExp(`[${plugin.settings.selectionDelimiters}]`,"g"))
    .map(v=>v.trim());
  const usingSelection:boolean = selection !== "";


  // If templates configured
  let newNoteContents = "";
  if (intent.templates.length !== 0) {
    const chosenTemplate = await getIntentTemplate(intent);
    console.log("Chosen template", chosenTemplate);
    if (!chosenTemplate) {
      new Notice("Error: No template selected");
      return;
    }

    // get template
    const templatePath: string | void = resolvePathRelativeToAbstractFile(chosenTemplate.path, abstractFileOfIntent);
    if (!templatePath) {
      new Notice(`Error: Invalid path for the ${chosenTemplate.name} template of the ${intent.name} intent`);
      return;
    }

    const templateNote = this.app.vault.getAbstractFileByPath(templatePath+".md");
    if (!(templateNote instanceof TFile)) {
      new Notice("Error: Template does not exist: " + templatePath);
      return;
    }

    newNoteContents = await this.app.vault.cachedRead(templateNote);
    variablesToGather = namedObjectDeepMerge(variablesToGather, chosenTemplate.newNoteProperties.variables);
    intent.newNoteProperties = namedObjectDeepMerge(intent.newNoteProperties, chosenTemplate.newNoteProperties);
  }

  variablesToGather = variablesToGather.filter(v => !v.disable);
  const variablesToSelect = variablesToGather.filter(v => v.use_selection);
  const selectionVariables = variablesToSelect.reduce((acc:any, variable:TemplateVariable, index) => {
    acc[variable.name] = selectionSplit[index] ?? "";
    return acc;
  }, {});
  console.log("section", selectionVariables);


  let gatheredValues;
  try {
    gatheredValues = await getVariableValues(plugin.app, variablesToGather, selectionVariables);
  } catch (e) {
    new Notice(e);
    return console.log("Failed to gather all variables");
  }
  

  newNoteContents = getReplacedVariablesText(newNoteContents, gatheredValues);

  const newNotePathName = getNewNotePathName(intent, gatheredValues);
  const newNotePathNameResolved = resolvePathRelativeToAbstractFile(newNotePathName, abstractFileOfIntent);
  if (!newNotePathNameResolved){
    new Notice(`Error: Failed to determine ${intent.name} output path`);
    return;
  }

  // create folder if not exists
  const newNoteResolvedDir = newNotePathNameResolved.split("/").slice(0,-1).join("/") || "/";
  if (!(this.app.vault.getAbstractFileByPath(newNoteResolvedDir) instanceof TFolder)) {
    await this.app.vault.createFolder(newNoteResolvedDir);
  }

  const newNote = await this.app.vault.create(
    newNotePathNameResolved+".md",
    newNoteContents
  );

  if (usingSelection){
    const noteName = newNotePathName.split("/").at(-1)?.replace(".md","");
    plugin.app.workspace.activeEditor?.editor?.replaceSelection(`[[${noteName}]]`);
  }

  // open new note in tab
  const newLeaf = this.app.workspace.getLeaf("tab");
  await newLeaf.openFile(newNote); // TODO Add toggle setting
  console.log("New note created");

}


function getReplacedVariablesText(text: string, values:{[key: string]: string}): string{
  function escapeRegExp(str:string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return Object.keys(values).reduce((text, varName)=>
    text.replaceAll(new RegExp(`\\{\\{\\s*${escapeRegExp(varName)}\\s*\\}\\}`, "g"), values[varName])
    , text);
}

function getNewNotePathName(intent:Intent, values:{[key: string]: string}):string{
  const newNoteProps = intent.newNoteProperties;

  if (newNoteProps.output_pathname_template &&
    newNoteProps.output_pathname_template?.trim())
    return getReplacedVariablesText(newNoteProps.output_pathname_template, values);

  if (newNoteProps.output_pathname &&
    newNoteProps.output_pathname?.trim())
    return newNoteProps.output_pathname; 

  if (values[ReservedVariableName.new_note_name] &&
    values[ReservedVariableName.new_note_name]?.trim())
    return "./"+values[ReservedVariableName.new_note_name];
  
  return intent.name;
}