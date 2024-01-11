import { App, PluginSettingTab, Setting } from "obsidian";
import { PTSettings } from "..";
import PTPlugin from "../main";


export const DEFAULT_SETTINGS: PTSettings = {
  pluginConfigNote: '',
  pluginConfigured: false,
  intents: [],
  configNoteFilterSetName: "default"
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
      .setName('Global Configuration Note Path')
      .setDesc('Path to global configuration note')
      .addText(text => 
        
        text.setPlaceholder('Path')
        .setValue(this.plugin.settings.pluginConfigNote)
        .onChange(async (value) => {
          this.plugin.settings.pluginConfigNote = value + !value.endsWith(".md") ? ".md" : "";

          await this.plugin.saveSettings();
        })

      );

    

    new Setting(containerEl)
        .setName("Configuration Note Filter Set Name")
        .setDesc("The name of the Note Filter Set in the Picker plugin that defines a Configuration Note")
        .addText(text => {
          text.setValue(this.plugin.settings.configNoteFilterSetName)
          text.onChange(async v => {
            this.plugin.settings.configNoteFilterSetName = v;
            await this.plugin.saveSettings();
          })
        })
  }
}