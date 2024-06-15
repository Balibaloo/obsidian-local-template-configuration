import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PTSettings, PTSettingTab } from './settings';
import { ReservedVariableName, TemplateVariable, TemplateVariableType } from './variables';
import { 
	Intent,
	getIntentsFromTFile,
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
	prompt: `New {{${ReservedVariableName.intent_name}}} name`,
}]

const NOTICE_TIMEOUT = 10_000;	

export default class PTPlugin extends Plugin {
	settings: PTSettings;

	async onload() {
		await this.loadSettings();
		this.settings.intents.forEach(i => this.createCommandForIntent(i));

		this.addSettingTab(new PTSettingTab(this.app, this));

		this.addCommand({ id: 'run-active-note-intent',
			name: 'Run intent from active note',
			callback: async () => {
				
				const intentNote = this.app.workspace.getActiveFile()
				if ( ! intentNote) {
					new Notice("Error: No active note");
					return;
				}

				try {
					const noteIntents = await getIntentsFromTFile(this.app, intentNote);
					const noteIntentsWithGlobalIntents = namedObjectDeepMerge( this.settings.intents, noteIntents ) as Intent[];
					const chosenIntent = await choseIntent( noteIntentsWithGlobalIntents );
					if (!choseIntent) 
						return;

					chosenIntent.newNoteProperties.variables = namedObjectDeepMerge(
						DEFAULT_VARIABLES,
						chosenIntent.newNoteProperties.variables
					)
					
					runIntent(this, chosenIntent);
				} catch (e) {
					return new Notice(e, NOTICE_TIMEOUT);
				}
			}
		});

		this.addCommand({ id: 'reload-global-intents',
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
					this.settings.intents = await getIntentsFromTFile(this.app, globalIntentsNote);
					this.settings.intents.forEach(i => {
						i.newNoteProperties.variables = namedObjectDeepMerge(
							DEFAULT_VARIABLES,
							i.newNoteProperties.variables
						)
						i.sourceNotePath = this.app.vault.getRoot().path
					})
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

		this.addCommand({ id: 'run-global-intent',
			name: 'Run global intent',
			callback: async () => {
				const chosenIntent = await choseIntent(this.settings.intents);
				if (!choseIntent) 
					return;
				
				runIntent(this, chosenIntent);
			}
		});

		this.addCommand({ id: 'run-local-intent',
			name: 'Run note intent',
			callback: async () => {
				const filteredOpener = (this.app as any).plugins.plugins["filtered-opener"];
				if (!filteredOpener) {
					new Notice("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
					console.error("Error running note intent, Filtered Opener plugin not found");
					return;
				}

				const intentNote = await filteredOpener.api_getNote(this.settings.intentNotesFilterSetName);
				if (!(intentNote instanceof TFile)) {
					new Notice("Error: Note does not exist");
					console.error("Error running note intent, note does not exist:", intentNote);
					return;
				}

				try {
					const noteIntents = await getIntentsFromTFile(this.app, intentNote);
					const noteIntentsWithGlobalIntents = namedObjectDeepMerge( this.settings.intents, noteIntents ) as Intent[];
					const chosenIntent = await choseIntent( noteIntentsWithGlobalIntents );
					if (!choseIntent) 
						return;

					chosenIntent.newNoteProperties.variables = namedObjectDeepMerge(
						DEFAULT_VARIABLES,
						chosenIntent.newNoteProperties.variables
					)
					
					runIntent(this, chosenIntent);
				} catch (e) {
					return new Notice(e, NOTICE_TIMEOUT);
				}
			}
		});

	}

	createCommandForIntent(intent: Intent) {
		const normalizedIntentName = intent.name.toLowerCase()
			.replaceAll(/[^\w\s]/g,"").replace(/\s+/g,' ').replace(/\s/g,'-');

		this.addCommand({ id: `create-${normalizedIntentName}`,
			name: `Create ${intent.name} for note`,
			callback: async () => {
				const filteredOpener = (this.app as any).plugins.plugins["filtered-opener"];
				if (!filteredOpener) {
					new Notice("Error: Filtered Opener plugin not found. Please install it from the community plugins tab.");
					console.error("Error running note intent, Filtered Opener plugin not found");
					return;
				}

				const intentNote = await filteredOpener.api_getNote(this.settings.intentNotesFilterSetName);
				if (!(intentNote instanceof TFile)) {
					new Notice("Error: Note does not exist");
					console.error("Error running", intent.name ,"intent, note does not exist:", intentNote);
					return;
				}

				try {
					const noteIntents = await getIntentsFromTFile(this.app, intentNote);
					const noteIntentsWithGlobalIntents = namedObjectDeepMerge(this.settings.intents, noteIntents) as Intent[];
					const chosenIntent = noteIntentsWithGlobalIntents.find(i => i.name === intent.name);

					if (!chosenIntent) {
						new Notice(`Error: Failed to get ${intent.name} intent`);
						return;
					}

					chosenIntent.sourceNotePath = intentNote.path;

					runIntent(this, chosenIntent);
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