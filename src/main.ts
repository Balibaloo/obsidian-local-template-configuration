import { Plugin, Notice, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PTSettingTab} from './config';
import { PTSettings } from './types/';


const PLUGIN_LONG_NAME = "Project Templater";
const PLUGIN_ACRONYM = "pt";

export default class PTPlugin extends Plugin {
	settings: PTSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new PTSettingTab(this.app, this));


		this.addCommand({
			id: `trigger-${PLUGIN_ACRONYM}`,
			name: `Trigger ${PLUGIN_LONG_NAME}`,
			callback: () => {
				new Notice("Hello World");
			}
		});

		this.addCommand({
			id: 'reload-config',
			name: 'Reload config',
			callback: async () => {
				const pluginConfigFile = this.app.vault.getAbstractFileByPath(this.settings.pluginConfigFile);
				if (!(pluginConfigFile instanceof TFile)) {
					new Notice(`Error: Please add a configuration file for ${PLUGIN_LONG_NAME}`);
					this.settings.pluginConfigured = false;
					return this.saveSettings();
				}

				console.log("Loading file", pluginConfigFile);
				
				this.settings.pluginConfigured = true;
				return this.saveSettings();
			}
		});

	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}