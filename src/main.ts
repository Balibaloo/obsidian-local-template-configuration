import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PTSettings, PTSettingTab } from './settings';
import { ReservedVariableName, TemplateVariable, TemplateVariableType } from './variables';
import { 
	Intent,
	getFrontmatter, 
	getIntentsFromFM, 
	namedObjectDeepMerge, 
	choseIntent, 
	runIntent 
} from './intents';


const DEFAULT_VARIABLES: TemplateVariable[] = [{
	name: ReservedVariableName.new_note_name,
	type: TemplateVariableType.text,
	required: true,
	use_selection: true,
	disable: false,
	prompt: "New note name",
}]

const NOTICE_TIMEOUT = 10_000;	

export default class PTPlugin extends Plugin {
	settings: PTSettings;

	async onload() {
		await this.loadSettings();
		this.settings.intents.forEach(i => this.createCommandForIntent(i));

		this.addSettingTab(new PTSettingTab(this.app, this));

		this.addCommand({
			id: 'reload-global-intents',
			name: 'Reload global intents',
			callback: async () => {
				const globalIntentsNote = this.app.vault.getAbstractFileByPath(this.settings.globalIntentsNotePath);
				
				if (!(globalIntentsNote instanceof TFile)) {
					new Notice(`Error: Please configure the note containing global intents for the ${this.manifest.name} plugin`);
					this.settings.pluginConfigured = false;
					return this.saveSettings();
				}

				try {
					// console.log("Loading global intents from", globalIntentsNote);
					const fm = await getFrontmatter(this.app, globalIntentsNote);

					this.settings.intents = getIntentsFromFM(this.app, fm);
					this.settings.intents.forEach(i =>
						i.newNoteProperties.variables = namedObjectDeepMerge(
							DEFAULT_VARIABLES,
							i.newNoteProperties.variables
						))
					this.settings.intents.forEach((intent) => {
						this.createCommandForIntent(intent);
					});
				} catch (e) {
					return new Notice(e, NOTICE_TIMEOUT);
				}


				// console.log("Loaded intents:", this.settings.intents);
        new Notice(`Success: Loaded ${this.settings.intents.length} intents`);
				this.settings.pluginConfigured = true;
				return this.saveSettings();
			}
		});		

		this.addCommand({
			id: 'run-global-intent',
			name: 'Run global intent',
			callback: async () => {
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
				const filteredOpener = (this.app as any).plugins.plugins["filtered-opener"];
				if (!filteredOpener) {
					new Notice("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
					console.error("Error running local intent, Filtered Opener plugin not found");
					return;
				}

				const intentNote = await filteredOpener.api_getNote(this.settings.intentNotesFilterSetName);
				if (!(intentNote instanceof TFile)) {
					new Notice("Error: Note does not exist");
					console.error("Error running local intent, note does not exist:", intentNote);
					return;
				}

				try {
					const noteIntents = getIntentsFromFM(this.app, await getFrontmatter(this.app, intentNote));
					noteIntents.forEach(i =>
						i.newNoteProperties.variables = namedObjectDeepMerge(
							DEFAULT_VARIABLES,
							i.newNoteProperties.variables
						))
	
					const chosenIntent = await choseIntent(noteIntents);
					if (!choseIntent) 
						return;
					
					runIntent(this, chosenIntent, this.app.vault.getRoot());
				} catch (e) {
					return new Notice(e, NOTICE_TIMEOUT);
				}
			}
		});

	}

	createCommandForIntent(intent: Intent) {
		const normalizedIntentName = intent.name.toLowerCase()
			.replaceAll(/[^\w\s]/g,"").replace(/\s+/g,' ').replace(/\s/g,'-');

		this.addCommand({
			id: `create-${normalizedIntentName}`,
			name: `Create local ${intent.name} note`,
			callback: async () => {
				const filteredOpener = (this.app as any).plugins.plugins["filtered-opener"];
				if (!filteredOpener) {
					new Notice("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
					console.error("Error running local intent, Filtered Opener plugin not found");
					return;
				}

				const intentNote = await filteredOpener.api_getNote(this.settings.intentNotesFilterSetName);
				if (!(intentNote instanceof TFile)) {
					new Notice("Error: Note does not exist");
					console.error("Error running", intent.name ,"intent, note does not exist:", intentNote);
					return;
				}

				try {
					const noteIntents = getIntentsFromFM(this.app, await getFrontmatter(this.app, intentNote));
					const noteIntentsWithGlobalIntents = namedObjectDeepMerge(this.settings.intents, noteIntents) as Intent[];
					const chosenIntent = noteIntentsWithGlobalIntents.find(i => i.name === intent.name);

					if (!chosenIntent) {
						new Notice(`Error: Failed to get ${intent.name} intent`);
						return;
					}

					runIntent(this, chosenIntent, intentNote);
				} catch (e) {
					return new Notice(e, NOTICE_TIMEOUT);
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