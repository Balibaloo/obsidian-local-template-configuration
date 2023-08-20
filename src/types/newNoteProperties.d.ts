import { TemplateVariable } from "./";

export type hasNewNoteProperties = {
	newNoteProperties: NewNoteProperties;
}

export type NewNoteProperties = {
	output_path: string,
	note_name: string,
	note_name_template: string,
	variables: TemplateVariable[],
}