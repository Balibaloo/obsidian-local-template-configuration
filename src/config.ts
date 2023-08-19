import { App, PluginSettingTab, Setting, TFile } from "obsidian";
import PTPlugin from "./main";
import { PTSettings } from "./types";


export const DEFAULT_SETTINGS: PTSettings = {
  pluginConfigFile: '',
  pluginConfigured: false,
  intents: [],
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
      .setName('Config note path')
      .setDesc('Path to plugin configuration note')
      .addText(text => 
        
        text.setPlaceholder('Path')
        .setValue(this.plugin.settings.pluginConfigFile)
        .onChange(async (value) => {
          if (value.endsWith(".md")){
            this.plugin.settings.pluginConfigFile = value;
          } else {
            this.plugin.settings.pluginConfigFile = value+".md";
          }

          await this.plugin.saveSettings();
        })

      );
  }
}