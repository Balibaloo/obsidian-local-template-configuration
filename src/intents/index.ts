import { TAbstractFile } from "obsidian";
import { Template } from "../templates";
import { TemplateVariable } from "../variables";
import { getIntentsFromTFile,  resolvePathRelativeToAbstractFile, namedObjectDeepMerge } from "./frontmatter";
import { choseIntent, runIntent } from "./intents";

export type Intent = hasNewNoteProperties & {
	name: string;
	disable: boolean;
	templates: Template[];
}

export type hasNewNoteProperties = {
	newNoteProperties: NewNoteProperties;
}

export type NewNoteProperties = {
	output_pathname: string,
	output_pathname_template: string,
	variables: TemplateVariable[],
	selection_replace_template?: string,
}

export {
	getIntentsFromTFile,
	resolvePathRelativeToAbstractFile,
	namedObjectDeepMerge,
	choseIntent,
	runIntent,
};