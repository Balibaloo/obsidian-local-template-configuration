import { App, FuzzySuggestModal, Notice } from "obsidian";
import { Intent, Template } from "..";
import { namedObjectDeepMerge } from "../frontmatter";

export async function getIntentTemplate(intent: Intent): Promise<Template | null> {
  if (intent.templates.length == 0) {
    new Notice(`Error: ${intent.name} has no templates`);
    return null;
  }
  
  if (intent.templates.length == 1)
    return intent.templates[0];

  const selectedTemplate = await runTemplateSelectModal(this.app, intent.templates);
  if (!selectedTemplate){
    return null;
  }

  // merge template and intent newNoteProperties
  selectedTemplate.newNoteProperties =  namedObjectDeepMerge(intent.newNoteProperties, selectedTemplate.newNoteProperties);
  return selectedTemplate;
}

export function runTemplateSelectModal(app: App, items: Template[]): Promise<Template> {
	return new Promise((resolve, reject) => {
		new TemplateSelectModal(app, items, resolve).open()
	});
}

class TemplateSelectModal extends FuzzySuggestModal<Template> {
	constructor(app: App, items: Template[], callback: (item: Template) => void) {
		super(app);
		this.items = items;
		this.callback = callback;
	}

	items: Template[];
	callback: (item: Template) => void;

	getItems(): Template[] {
		return this.items;
	}

	getItemText(item: Template): string {
		return item.name;
	}
	onChooseItem(item: Template, evt: MouseEvent | KeyboardEvent): void {
		this.callback(item);
	}
}