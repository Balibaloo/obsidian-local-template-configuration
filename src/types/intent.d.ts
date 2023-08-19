import { hasNewNoteProperties } from "./newNoteProperties";
import { Template } from "./template";

export type Intent = hasNewNoteProperties & {
	name: string;
	templates: Template[];
}