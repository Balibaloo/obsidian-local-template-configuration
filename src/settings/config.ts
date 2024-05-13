import { App, PaneType, PluginSettingTab, Setting, normalizePath } from "obsidian";
import PTPlugin from "../main";
import { PTSettings } from ".";


export const DEFAULT_SETTINGS: PTSettings = {
  globalIntentsNotePath: '',
  pluginConfigured: false,
  intents: [],
  intentNotesFilterSetName: "default",
  selectionDelimiters: ",|",
  showNewNotes: true,
	showNewNotesStyle: "split",
	showNewMultiNotes: true,
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
      .setName('Global intents note path')
      .setDesc('Path to note containing global intents')
      .addText(text => 
        
        text.setPlaceholder('Path')
        .setValue(this.plugin.settings.globalIntentsNotePath)
        .onChange(async (value) => {
          value = normalizePath(value);
          this.plugin.settings.globalIntentsNotePath = value + (!value.endsWith(".md") ? ".md" : "");
          await this.plugin.saveSettings();
        })

      );

    

    new Setting(containerEl)
        .setName("Intent note filter set name")
        .setDesc("The name of the Filtered Opener File Filter Set used to display a list of notes with intents.")
        .addText(text => {
          text.setValue(this.plugin.settings.intentNotesFilterSetName)
          text.onChange(async v => {
            this.plugin.settings.intentNotesFilterSetName = v;
            await this.plugin.saveSettings();
          })
        })

    new Setting(containerEl)
      .setName("Selection delimiters")
      .setDesc(`The set of characters that will be used to split the selection into separate values. Used with the "use_selection" variable property.`)
      .addText(text => {
        text.setValue(this.plugin.settings.selectionDelimiters)
        text.onChange(async v => {
          if (v === "") return;
          this.plugin.settings.selectionDelimiters = v;
          await this.plugin.saveSettings();
        })
      })
    
    new Setting(containerEl)
      .setName("Open newly created notes")
      .addToggle( tg => {
        tg.setTooltip("Yes/No")
          .setValue(this.plugin.settings.showNewNotes)
          .onChange( async v => {
            this.plugin.settings.showNewNotes = v;
            await this.plugin.saveSettings();
            this.hide();
            this.display();
          })
      }).addDropdown( dd => {
        dd.setDisabled( ! this.plugin.settings.showNewNotes)
          .addOptions({
            "false": "in active window",
            "tab": "in new tab",
            "split": "in new split",
            "window": "in new window",
          })
          .setValue( String(this.plugin.settings.showNewNotesStyle) )
          .onChange(async v => {
            let nv: PaneType|false;
            if (v === "false") {
              nv = false;
            } else if (v === "tab" || v === "split" || v === "window") {
              nv = v;
            } else {
              throw Error("Error: Unknown open new note style");
            }

            this.plugin.settings.showNewNotesStyle = nv;
            await this.plugin.saveSettings();
          })
          
      })
    
    new Setting(containerEl)
      .setName("Open new notes when creating multiple notes")
      .addToggle( tg => {
        tg.setValue( this.plugin.settings.showNewMultiNotes && this.plugin.settings.showNewNotes)
          .setDisabled( ! this.plugin.settings.showNewNotes )
          .onChange( async v => {
            this.plugin.settings.showNewMultiNotes = v;
            await this.plugin.saveSettings();
          })
      })

  }
}