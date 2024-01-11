import { hasNewNoteProperties } from "..";
import { Template } from "..";

export type Intent = hasNewNoteProperties & {
	name: string;
	hide: boolean;
	templates: Template[];
}