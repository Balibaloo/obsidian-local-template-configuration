import { App, EditorPosition, EditorSelection, FuzzySuggestModal, Notice, TFile, TFolder } from "obsidian";
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


export async function runIntent(plugin:PTPlugin, intent: Intent) {
  // console.log("Running intent:", intent);

  let variablesToGather = intent.newNoteProperties.variables;

  const abstractIntentSource = plugin.app.vault.getAbstractFileByPath( intent.sourceNotePath );
  if ( ! abstractIntentSource ){
    new Notice("Error: Intent source doesn't exist anymore. Please reload this intent.");
    return;
  }

  // If templates configured
  let templateContents = "";
  if (intent.templates.length !== 0) {
    const chosenTemplate = await getIntentTemplate(intent);
    // console.log("Chosen template:", chosenTemplate);
    if (!chosenTemplate) {
      new Notice("Error: No template selected");
      return;
    }

    // get template
    const templatePath: string | void = resolvePathRelativeToAbstractFile(chosenTemplate.path, abstractIntentSource);
    if (!templatePath) {
      new Notice(`Error: Invalid path for the ${chosenTemplate.name} template of the ${intent.name} intent`);
      return;
    }

    const templateNote = this.app.vault.getAbstractFileByPath(templatePath+".md");
    if (!(templateNote instanceof TFile)) {
      new Notice("Error: Template does not exist: " + templatePath);
      return;
    }

    templateContents = await this.app.vault.cachedRead(templateNote);
    variablesToGather = namedObjectDeepMerge(variablesToGather, chosenTemplate.newNoteProperties.variables);
    intent.newNoteProperties = namedObjectDeepMerge(intent.newNoteProperties, chosenTemplate.newNoteProperties);
  }

  variablesToGather = variablesToGather.filter(v => !v.disable);

  const selections:(EditorSelection|null)[] = plugin.app.workspace.activeEditor?.editor?.listSelections() ?? [ null ];
  const showNewNote = plugin.settings.showNewNotes && ! ( selections.length !== 0 && !plugin.settings.showNewMultiNotes);

  for (let selection of selections){
    runIntentWithSelection( plugin, intent, variablesToGather, templateContents, selection, showNewNote )
  }

}

async function runIntentWithSelection(plugin:PTPlugin, intent: Intent, variablesToGather:TemplateVariable[], templateContents:string, selection:EditorSelection|null, showNewNote:boolean){
  const abstractIntentSource = plugin.app.vault.getAbstractFileByPath( intent.sourceNotePath );
  if ( ! abstractIntentSource ){
    new Notice("Error: Intent source doesn't exist anymore. Please reload this intent.");
    return;
  }

  const variablesToSelect = variablesToGather.filter(v => v.use_selection);
  
  let selectionVariables = {};
  if ( selection ){
    const [selectionStart, selectionEnd] = getOrderedSelectionBounds(selection);
    const selectionText = plugin.app.workspace.activeEditor?.editor?.getRange( selectionStart, selectionEnd ) || "";
    const selectionSplit = selectionText.split(new RegExp(`[${plugin.settings.selectionDelimiters}]`,"g"))
      .map(v=>v.trim());

    selectionVariables = variablesToSelect.reduce((acc:any, variable:TemplateVariable, index) => {
      acc[variable.name] = selectionSplit[index] ?? "";
      return acc;
    }, {});
    // console.log("Found selection variables:", selectionVariables);
  }

  let gatheredValues;
  try {
    gatheredValues = await getVariableValues(plugin.app, variablesToGather, selectionVariables);
  } catch (e) {
    new Notice(e);
    return console.error("Error: failed to gather all variables");
  }
  

  const newNoteContents = getReplacedVariablesText(templateContents, gatheredValues);

  const newNotePathName = getNewNotePathName(intent, gatheredValues);
  const newNotePathNameResolved = resolvePathRelativeToAbstractFile(newNotePathName, abstractIntentSource);
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

  if ( selection ){    
    const newNoteNameResolved = newNotePathNameResolved.split("/").at(-1);
    const selectionTemplate = intent.newNoteProperties.selection_replace_template || `[[${newNoteNameResolved}]]`;
    const selectionReplacement = getReplacedVariablesText( selectionTemplate, gatheredValues );
    
    // TODO fix selection replacement when focus changes, when creating multiple files
    const [selectionStart, selectionEnd] = getOrderedSelectionBounds(selection);
    plugin.app.workspace.activeEditor?.editor?.replaceRange( selectionReplacement, selectionStart, selectionEnd );
  }

  if ( showNewNote ){
    const newLeaf = plugin.app.workspace.getLeaf( plugin.settings.showNewNotesStyle );
    await newLeaf.openFile(newNote);
  }
  // console.log("New note created:", newNotePathNameResolved);

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

function getOrderedSelectionBounds( selection:EditorSelection ):[ head:EditorPosition, tail:EditorPosition ]{ 
  const {anchor, head} = selection;

  if ( anchor.line > head.line )
    return [head, anchor];
  
  if ( anchor.line < head.line )
    return [anchor, head];
  
  if ( anchor.ch > head.ch )
    return [head, anchor];
  
  return [anchor, head];
}