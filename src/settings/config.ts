import { App, PluginSettingTab, Setting } from "obsidian";
import PTPlugin from "../main";
import { PTSettings } from ".";


export const DEFAULT_SETTINGS: PTSettings = {
  globalIntentsNotePath: '',
  pluginConfigured: false,
  intents: [],
  intentNotesFilterSetName: "default",
  selectionDelimiters: ",|",
}


export class PTSettingTab extends PluginSettingTab {
  plugin: PTPlugin;

  constructor(app: App, plugin: PTPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Global Intents Note Path')
      .setDesc('Path to note containing global intents')
      .addText(text => 
        
        text.setPlaceholder('Path')
        .setValue(this.plugin.settings.globalIntentsNotePath)
        .onChange(async (value) => {
          this.plugin.settings.globalIntentsNotePath = value + (!value.endsWith(".md") ? ".md" : "");
          await this.plugin.saveSettings();
        })

      );

    

    new Setting(containerEl)
        .setName("Intent Note Filter Set Name")
        .setDesc("The name of the Picker File Filter Set used to display a list of notes with intents.")
        .addText(text => {
          text.setValue(this.plugin.settings.intentNotesFilterSetName)
          text.onChange(async v => {
            this.plugin.settings.intentNotesFilterSetName = v;
            await this.plugin.saveSettings();
          })
        })

    new Setting(containerEl)
      .setName("Selection Delimiters")
      .setDesc(`The set of characters that will be used to split the selection into separate values. Used with the "use_selection" variable property.`)
      .addText(text => {
        text.setValue(this.plugin.settings.selectionDelimiters)
        text.onChange(async v => {
          if (v === "") return;
          this.plugin.settings.selectionDelimiters = v;
          await this.plugin.saveSettings();
        })
      })
  }
}