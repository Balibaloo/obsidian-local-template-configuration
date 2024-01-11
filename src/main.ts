import { Notice, Plugin, TFile } from 'obsidian';
import { Intent, PTSettings } from '.';
import { getFrontmatter, getIntentsFromFM, namedObjectDeepMerge } from './frontmatter';
import { choseIntent, runIntent } from './intent/intents';
import { DEFAULT_SETTINGS, PTSettingTab } from './settings/config';
import { TemplateVariableType } from './variables/providers';
import { ReservedVariableName } from './variables/templateVariables';


const PLUGIN_LONG_NAME = "Project Templater";
const PLUGIN_ACRONYM = "pt";

export default class PTPlugin extends Plugin {
	settings: PTSettings;

	async onload() {
		await this.loadSettings();
		this.settings.intents.forEach(i => this.createCommandForIntent(i));

		this.addSettingTab(new PTSettingTab(this.app, this));

		this.addCommand({
			id: 'reload-config',
			name: 'Reload config',
			callback: async () => {
				const pluginConfigNote = this.app.vault.getAbstractFileByPath(this.settings.pluginConfigNote);
				if (!(pluginConfigNote instanceof TFile)) {
					new Notice(`Error: Please add a configuration note for ${PLUGIN_LONG_NAME}`);
					this.settings.pluginConfigured = false;
					return this.saveSettings();
				}

				try {
					const fm = await getFrontmatter(this.app, pluginConfigNote);

					this.settings.intents = getIntentsFromFM(fm);
					this.settings.intents.forEach(i =>
						i.newNoteProperties.variables = namedObjectDeepMerge(
							[{
								name: ReservedVariableName.new_note_name,
								type: TemplateVariableType.text,
								required: true,
								use_selection: true,
							}],
							i.newNoteProperties.variables
						))
					this.settings.intents.forEach((intent) => {
						this.createCommandForIntent(intent);
					});
				} catch (e) {
					new Notice(e);
				}


				console.log("Loaded intents", this.settings.intents);
				this.settings.pluginConfigured = true;
				return this.saveSettings();
			}
		});		

		this.addCommand({
			id: 'run-global-intent',
			name: 'Run global intent',
			callback: async () => {

				
				// TODO expose intent config to user
				// const newProjectFolder = (await (this.app as any).plugins.plugins["picker"].api_getDir()) as TFolder;
				// if (newProjectFolder == null) return;
				// DOCS paths are relative to chosen folder
				const chosenIntent = await choseIntent(this.settings.intents);
				if (!choseIntent) 
					return;
				
				runIntent(this, chosenIntent, this.app.vault.getRoot());
			}
		});

		this.addCommand({
			id: 'run-local-intent',
			name: 'Run local intent',
			callback: async () => {

				const configNote = await (this.app as any).plugins.plugins["picker"].api_getNote(this.settings.configNoteFilterSetName)
				if (!(configNote instanceof TFile)) {
					new Notice("Error: Configuration note is not a file");
					console.log("Project note", configNote);
					return;
				}

				const noteIntents = getIntentsFromFM(await getFrontmatter(this.app, configNote));

				const chosenIntent = await choseIntent(noteIntents);
				if (!choseIntent) 
					return;
				
				runIntent(this, chosenIntent, this.app.vault.getRoot());
				
			}
		});

	}

	createCommandForIntent(intent: Intent) {
		const commandID = `create-${intent.name.toLowerCase().replaceAll(/\s/g, "-")}`;

		this.addCommand({
			id: commandID,
			name: `Create a new ${intent.name} note`,
			callback: async () => {
				const projectNote = await (this.app as any).plugins.plugins["picker"].api_getNote(this.settings.configNoteFilterSetName)
				if (!(projectNote instanceof TFile)) {
					new Notice("Error: Configuration note is not a file");
					console.log("Project note", projectNote);
					return;
				}

				// include project config
				try {
					const projectIntents = getIntentsFromFM(await getFrontmatter(this.app, projectNote));
					const settingsWithProjectIntents = namedObjectDeepMerge(this.settings.intents, projectIntents) as Intent[];
					const chosenIntent = settingsWithProjectIntents.find(i => i.name === intent.name);

					if (!chosenIntent) {
						new Notice(`Error: Failed to get ${intent.name} project intent`);
						return;
					}

					runIntent(this, chosenIntent, projectNote);
				} catch (e) {
					new Notice(e);
				}
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