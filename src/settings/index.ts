import { Intent } from "../intents";
import { DEFAULT_SETTINGS, PTSettingTab } from "./config";

export interface PTSettings {
	globalIntentsNotePath: string;
	pluginConfigured: boolean;
	intents: Intent[];
	intentNotesFilterSetName: string;
	selectionDelimiters: string;
}

export {
	DEFAULT_SETTINGS,
	PTSettingTab,
}