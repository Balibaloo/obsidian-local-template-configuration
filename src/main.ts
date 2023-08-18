import { Plugin, Notice } from 'obsidian';


const PLUGIN_LONG_NAME = "Project Templater";
const PLUGIN_ACRONYM = "pt";

export default class PTPlugin extends Plugin {

	async onload() {	
		this.addCommand({
			id: `trigger-${PLUGIN_ACRONYM}`,
			name: `Trigger ${PLUGIN_LONG_NAME}`,
			callback: () => {
				new Notice("Hello World");
			}
		});

	}


	onunload() {

	}
}