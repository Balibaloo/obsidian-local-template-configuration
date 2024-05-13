import { PaneType } from "obsidian";
import { Intent } from "../intents";
import { DEFAULT_SETTINGS, PTSettingTab } from "./config";

export interface PTSettings {
	globalIntentsNotePath: string;
	pluginConfigured: boolean;
	intents: Intent[];
	intentNotesFilterSetName: string;
	selectionDelimiters: string;
	showNewNotes: boolean;
	showNewNotesStyle: PaneType|false;
	showNewMultiNotes: boolean;
}

export {
	DEFAULT_SETTINGS,
	PTSettingTab,
}