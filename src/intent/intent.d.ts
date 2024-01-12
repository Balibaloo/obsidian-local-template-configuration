import { hasNewNoteProperties } from "..";
import { Template } from "..";

export type Intent = hasNewNoteProperties & {
	name: string;
	disable: boolean;
	templates: Template[];
}