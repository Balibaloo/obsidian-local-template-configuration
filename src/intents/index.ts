import { TAbstractFile } from "obsidian";
import { Template } from "../templates";
import { TemplateVariable } from "../variables";
import { getIntentsFromTFile,  resolvePathRelativeToAbstractFile, namedObjectDeepMerge } from "./frontmatter";
import { choseIntent, getReplacedVariablesText, runIntent } from "./intents";

export type Intent = hasNewNoteProperties & {
	name: string;
	disable: boolean;
	templates: Template[];
	sourceNotePath: string;
}

export type hasNewNoteProperties = {
	newNoteProperties: NewNoteProperties;
}

export type NewNoteProperties = {
	output_filename: string,
	output_folder_path: string,
	variables: TemplateVariable[],
	selection_replace_template?: string,
}

export {
	getIntentsFromTFile,
	resolvePathRelativeToAbstractFile,
	namedObjectDeepMerge,
	choseIntent,
	runIntent,
	getReplacedVariablesText,
};