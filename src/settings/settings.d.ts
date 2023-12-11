import { Intent } from "..";

export interface PTSettings {
	pluginConfigFile: string;
	pluginConfigured: boolean;
	intents: Intent[];
}