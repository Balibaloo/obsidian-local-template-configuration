import { Plugin, Notice, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PTSettingTab } from './config';
import { Intent, PTSettings, ReservedVariableName, TemplateVariableType } from './types/';
import { getFrontmatter, getIntentsFromFM, namedObjectDeepMerge } from './frontmatter';
import { runIntent } from './runIntent';


const PLUGIN_LONG_NAME = "Project Templater";
const PLUGIN_ACRONYM = "pt";

export default class PTPlugin extends Plugin {
	settings: PTSettings;

	async onload() {
		await this.loadSettings();
		this.settings.intents.forEach(i => this.createCommandForIntent(i));

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

				const fm = await getFrontmatter(this.app, pluginConfigFile);

				this.settings.intents = getIntentsFromFM(fm);
				this.settings.intents.forEach(i=>
					i.newNoteProperties.variables.push({
						name: ReservedVariableName.newNoteName,
						type: TemplateVariableType.text,
					}))
				this.settings.intents.forEach((intent) => {
					this.createCommandForIntent(intent);
				});


				console.log("Loaded intents", this.settings.intents);
				this.settings.pluginConfigured = true;
				return this.saveSettings();
			}
		});		
	}

	createCommandForIntent(intent: Intent) {
		const commandID = `create-${intent.name.toLowerCase().replaceAll(/\s/g, "-")}`;

		this.addCommand({
			id: commandID,
			name: `Create a new ${intent.name} note`,
			callback: async () => {
				const projectNote = await (this.app as any).plugins.plugins["filtered-note-opener"].api()
				if (!(projectNote instanceof TFile)) {
					new Notice("Error: Project note is not a file");
					console.log("Project note", projectNote);
					return;
				}

				// include project config
				const projectIntents = getIntentsFromFM(await getFrontmatter(this.app, projectNote));
				const settingsWithProjectIntents = namedObjectDeepMerge(this.settings.intents, projectIntents) as Intent[];
				const chosenIntent = settingsWithProjectIntents.find(i => i.name === intent.name);

				if (!chosenIntent){
					new Notice(`Error: Failed to get ${intent.name} project intent`);
					return;
				}

				runIntent(this, chosenIntent, projectNote);
			}
		})
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