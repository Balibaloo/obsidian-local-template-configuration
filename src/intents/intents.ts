import { App, EditorPosition, EditorSelection, FuzzySuggestModal, Notice, TFile, TFolder } from "obsidian";
import PTPlugin from "../main";
import { Intent, namedObjectDeepMerge, resolvePathRelativeToAbstractFile } from ".";
import { ReservedVariableName, TemplateVariable, getVariableValues } from "../variables";
import { getIntentTemplate } from "../templates";

type NoteDestination = {
  destinationFolder:string,
  destinationFilename:string,
}

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
      return rejects();
    }

    const shownIntents = intents.filter(i => !i.disable);
    if (shownIntents.length === 0) {
      new Notice(`Error: All intents are hidden`);
      return rejects();
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
  const creatingMultipleNotes = selections.length > 1;

  for (let selection of selections){
    await runIntentWithSelection( plugin, intent, variablesToGather, templateContents, selection, creatingMultipleNotes )
  }

}

async function runIntentWithSelection(plugin:PTPlugin, intent: Intent, variablesToGather:TemplateVariable[], templateContents:string, selection:EditorSelection|null, creatingMultipleNotes:boolean){
  const abstractIntentSource = plugin.app.vault.getAbstractFileByPath( intent.sourceNotePath );
  if ( ! abstractIntentSource ){
    new Notice("Error: Intent source doesn't exist anymore. Please reload this intent.");
    return;
  }

  let propertyValues: { [key:string] : string } = {
    [ReservedVariableName.intent_name]:intent.name,
    [ReservedVariableName.in_folder]: intent.newNoteProperties.output_folder_path?.trim() ?? "./",
    [ReservedVariableName.with_name]: intent.newNoteProperties.output_filename?.trim() ?? "",
    [ReservedVariableName.replaces_selection_with]: intent.newNoteProperties.selection_replace_template?.trim() ?? `[[{{${ReservedVariableName.with_name}}}]]`,
  };

  // Note name fallbacks
  if ( ! propertyValues[ReservedVariableName.with_name] ){
    if ( variablesToGather.some( v => v.name === ReservedVariableName.new_note_name) ){
      propertyValues[ReservedVariableName.with_name] = `{{${ReservedVariableName.new_note_name}}}`;
    } else {
      propertyValues[ReservedVariableName.with_name] = intent.name;
    }
  }


  let selectionValues = {};
  if ( selection ){
    const [selectionStart, selectionEnd] = getOrderedSelectionBounds(selection);
    const selectionText = plugin.app.workspace.activeEditor?.editor?.getRange( selectionStart, selectionEnd ) || "";
    const selectionSplit = selectionText.split(new RegExp(`[${plugin.settings.selectionDelimiters}]`,"g"))
      .map(v=>v.trim());

    const variablesToSelect = variablesToGather.filter(v => v.use_selection);

    selectionValues = variablesToSelect.reduce((acc:any, variable:TemplateVariable, index) => {
      if (selectionSplit[index])
        acc[variable.name] = selectionSplit[index];
      return acc;
    }, {});
    // console.log("Found selection variables:", selectionVariables);
  }

  let gatheredValues;
  try {
    gatheredValues = await getVariableValues(plugin.app, variablesToGather, selectionValues, propertyValues);
  } catch (e) {
    new Notice(e);
    return console.error("Error: failed to gather all variables");
  }

  console.log("Gathered", gatheredValues);

  const newNoteFolderRelativePath = gatheredValues[ReservedVariableName.in_folder];
  const newNoteFolder = resolvePathRelativeToAbstractFile( newNoteFolderRelativePath, abstractIntentSource);
  if (!newNoteFolder){
    new Notice(`Error: Failed to determine ${intent.name} output path`);
    return;
  }

  // create folder if not exists
  if ( ! (this.app.vault.getAbstractFileByPath( newNoteFolder ) instanceof TFolder)) {
    await this.app.vault.createFolder( newNoteFolder );
  }

  let newNote;
  try {
    const newNoteContents = getReplacedVariablesText(templateContents, gatheredValues);
    const newNoteFileName = gatheredValues[ReservedVariableName.with_name];
    newNote = await plugin.app.vault.create(
      `${newNoteFolder}/${newNoteFileName}.md`,
      newNoteContents
    );
  } catch (e){
    new Notice(`Error: Could not create ${newNoteFolder}, ${e.message}`, 6_000)
    return;
  }

  if ( selection && ! selectionIsEmpty( selection )){
    const replacementText = gatheredValues[ReservedVariableName.replaces_selection_with];
    
    // TODO fix selection replacement when focus changes, when creating multiple files
    const [selectionStart, selectionEnd] = getOrderedSelectionBounds(selection);
    plugin.app.workspace.activeEditor?.editor?.replaceRange( replacementText, selectionStart, selectionEnd );
  }

  if ( plugin.settings.showNewNotes && ( ! creatingMultipleNotes || plugin.settings.showNewMultiNotes) ){
    const newLeaf = plugin.app.workspace.getLeaf( plugin.settings.showNewNotesStyle );
    await newLeaf.openFile(newNote, { active: !creatingMultipleNotes });
  }
  // console.log("New note created:", newNotePathNameResolved);

}


export function getReplacedVariablesText(text: string, values:{[key: string]: string}): string{
  function escapeRegExp(str:string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Prevent insertion of values that contain templates
  const primalKeys = Object.keys( values ).filter( k => ! values[k].match(`\\{\\{\\s*.*\\s*\\}\\}`))
  values = Object.fromEntries( Object.entries(values).filter( ([ k ]) => primalKeys.includes( k ) ))

  return Object.keys(values).reduce((text, varName)=>
    text.replaceAll(new RegExp(`\\{\\{\\s*${escapeRegExp(varName)}\\s*\\}\\}`, "g"), values[varName])
    , text);
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

function selectionIsEmpty( selection:EditorSelection ): boolean {
  if (selection.anchor.line !== selection.head.line)
    return false;

  if (selection.anchor.ch !== selection.head.ch)
    return false;

  return true;
}