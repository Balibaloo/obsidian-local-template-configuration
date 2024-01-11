import { TemplateVariable } from "../variables";

export type hasNewNoteProperties = {
	newNoteProperties: NewNoteProperties;
}

export type NewNoteProperties = {
	output_pathname: string,
	output_pathname_template: string,
	variables: TemplateVariable[],
}