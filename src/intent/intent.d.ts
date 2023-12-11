import { hasNewNoteProperties } from "..";
import { Template } from "..";

export type Intent = hasNewNoteProperties & {
	name: string;
	templates: Template[];
}