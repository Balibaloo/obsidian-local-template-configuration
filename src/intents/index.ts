import { Template } from "../templates";
import { TemplateVariable } from "../variables";
import { getIntentsFromFM, getFrontmatter, resolvePathRelativeToAbstractFile, namedObjectDeepMerge } from "./frontmatter";
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
}

export {
	getIntentsFromFM,
	getFrontmatter,
	resolvePathRelativeToAbstractFile,
	namedObjectDeepMerge,
	choseIntent,
	runIntent,
};