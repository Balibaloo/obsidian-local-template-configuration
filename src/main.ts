import { Notice, Plugin, TFile } from 'obsidian';
import { Intent, PTSettings, ReservedVariableName, TemplateVariableType } from '.';
import { getFrontmatter, getIntentsFromFM, namedObjectDeepMerge } from './frontmatter';
import { choseIntent, runIntent } from './intent/intents';
import { DEFAULT_SETTINGS, PTSettingTab } from './settings/config';


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


				console.log("Loaded intents", this.settings.intents);
				this.settings.pluginConfigured = true;
				return this.saveSettings();
			}
		});		

		this.addCommand({
			id: 'run-global-intent',
			name: 'Chose global intent',
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

		this.app.workspace.onLayoutReady(() => {
			const NLDates = (this.app as any).plugins.getPlugin("nldates-obsidian");
			if (!NLDates) {
				new Notice("Error: Natural Language dates is required for natural date parsing. Please install it from the community plugin settings");
			}
	});
	}

	createCommandForIntent(intent: Intent) {
		const commandID = `create-${intent.name.toLowerCase().replaceAll(/\s/g, "-")}`;

		this.addCommand({
			id: commandID,
			name: `Create a new ${intent.name} note`,
			callback: async () => {
				const projectNote = await (this.app as any).plugins.plugins["picker"].api_getNote()
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