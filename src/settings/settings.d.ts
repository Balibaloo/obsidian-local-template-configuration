import { Intent } from "..";

export interface PTSettings {
	globalIntentsNotePath: string;
	pluginConfigured: boolean;
	intents: Intent[];
	intentNotesFilterSetName: string;
	selectionDelimiters: string;
}