import { TemplateVariable } from "..";

export type hasNewNoteProperties = {
	newNoteProperties: NewNoteProperties;
}

export type NewNoteProperties = {
	output_pathname: string,
	output_pathname_template: string,
	variables: TemplateVariable[],
}