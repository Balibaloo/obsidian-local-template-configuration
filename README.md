Configure note templating locally in frontmatter and insert values using prompts.

## You should use this plugin if:
- you use templates to create notes
- you want to insert variables into your templates and prompt to capture their values
- you want to group your templates by intent
	- eg: a task, a meeting, …
- some of your intents have multiple templates
	- a normal task, a graded task, a research task
	- daily stand-up meeting, project catch-up meeting, catch-up with a colleague
- you want to override or extend your intents and templates locally
	- use a local version of a template
	- add variables to an intent/template
	- add more intents/templates

### Additional features:
- prepopulate variables using selected text
	- select multiple lines to create multiple notes
- many variable types eg text, number
	- support for other variable providers eg: natural date, folder
- import other config files

# introduction
Notes are created by triggering intents.

## intents
Intents group together templates and are the core unit of configuration in this plugin.
They are different intents for creating a note.
eg "The intent to create a meeting note".

Intents are stored in lists in the frontmatter of any note.

Example
```
---
intents:
- name: task ✅
- name: meeting 🤝
- name: person 🙋‍♂️
---
```

## templates
Intents can have many templates

Templates contain a path
```
---
intents:
- name: task ✅
	templates: 
	  - name: default
	    path: path/to/task template.md
	  - name: graded
	    path: path/to/graded task template.md
	  - name: worksheet
	    path: path/to/worksheet task template.md
- name: meeting 🤝
	templates: 
	  - name: default
	    path: path/to/meeting template.md
	  - name: project review
	    path: path/to/project review meeting template.md
	  - name: standup
	    path: path/to/standup meeting template.md
- name: person 🙋‍♂️
	templates: 
	  - name: default
	    path: path/to/person template.md
	  - name: work coleague
	    path: path/to/work coleague person template.md
---
```

## new note properties
Both intents and templates can configure these properties of new notes:
- `output_pathname` and `output_pathname_template` configure the output location and name of the new file
- `variables` define a list of [variables](#variables) that replace `{{variable_name}}` when templating

The properties of templates are overwritten by the properties of intents.
```
---
intents:
- name: task ✅
    output_pathname_template: "./✅ {{new_note_name}}"
    variables:
      - name: deadline
        type: natural_date
	templates:
	  - name: default
	    path: path/to/task template.md
	  - name: graded
	    path: path/to/graded task template.md
	    variables:
	  	  - name: released
	  	    type: natural_date
		  - name: percent
	  - name: worksheet
	    path: path/to/worksheet task template.md
	    output_pathname_template: "./✅ Worksheet #{{worksheet_number}} - {{new_note_name}}"
	    variables:
	  	  - name: worksheet_number
	  	    type: number
---
```

## variables
There are multiple types of variables but all variables contain a common set of properties:
- `name`: used when inserting values into templates. see [using variable values](#using-variable-values)
- `type`: The type of the variable, see [variable types](#variable-types). `text` by default.
- `required`: If `true`, when you enter an invalid value the note creation process will stop and an error message will be shown.
- `use_selection`: see [using selection](#using-selection).
- `initial`: The value that will be in the input initially.
- `placeholder`: The value displayed inside the input when it is empty.
- `hide`: see [hiding intents, templates and variables](#hiding-intents-templates-and-variables)

### new_note_name
This variable is used to store the new note name.
It is added to every intent.
It is a [text](#text) variable.

### variable types

#### text
Text is the default variable type.

- regex: A regular expression used to validate the text

Example:
```
---
variables:
  - name: word_starting_with_auto
    type: text
    regex: ^auto
---
```

#### number

- min: the minimum allowed value
- max: the maximum allowed value

Example:
```
---
variables:
  - name: a_number
    type: number
    min: -10.8
    max: 11.22
---
```

#### natural date
This variable type requires the [natural language dates](https://github.com/argenos/nldates-obsidian) plugins to function.

It does not take any arguments

Example:
```
---
variables:
  - name: some_date
    type: natural_date
---
```

#### folder
Chose from a list of folders using the [Picker](#Picker) plugin.
- `root_folder`: A folder to start searching from
- `depth`: The depth of folders to include
	- if you have a folder structure `root/inner/leaf`
		- a depth of 2 will only show `leaf`
- `include_roots`: false
- `folder_filter_set_name`: The name of the folder filter set, see [folder picking](#folder-picking).

Example:
```
---
variables:
  - name: a_project_folder
    type: folder
    root_folder: /🏗 projects
	depth: 1
	include_roots: false
	folder_filter_set_name: default
---
```


## choosing configuration notes
When running intents, you must chose the note that contains the list of intents that you want to chose from.
Selecting a note is done using another plugin called "[Picker](#Picker)".

Note: when resolving relative paths the chosen configuration note is used. Meaning templates and output locations can be specified using "./folder/file.md".

## Picker
The [Picker plugin](https://github.com/Balibaloo/obsidian-picker) narrows down the list of notes when choosing a note by using user-defined sets of filters called "note filter sets".

The name of the filter set in Picker allows this plugin to used that set to select a note.

In Picker the default set name is "default" which is also the default value for the "Configuration Note Filter Set Name" setting in this plugin.

Note: If a set of files only contains one file, a prompt will not be shown and that file will be chosen automatically.

### folder picking
The [folder](#folder) variable type uses this plugin to chose folders.

Like the file Picker, the folder Picker uses the name of the filter set to chose a file.

### running local intents
The "Run local intent" command is the simplest way to trigger an intent.

First you will be prompted to chose a file using [Picker](#Picker) and then to chose an intent to run.

Note: If a file contains only one intent, that intent will be chosen automatically and no prompt will be shown.

## global intents
Global intents are intents in the global configuration note.
They can be ran
- in the global context using the "Run global intent" command.
- in a local context by the commands that are generated for them.

When running an intent in a local context the global configuration is imported and merged with the local configuration note.
See [importing configuration](#importing-configuration)

### configuring global intents
The global configuration note is configured by setting the global configuration note path in settings.
This note must be reloaded by using the "Reload global configuration note" command for changes to apply.

## importing configuration
When a note imports another configuration note, the configuration of the other note is loaded first and then overwritten by the local configuration.

Overwriting properties of imported files is useful for:
- adding intents
- adding templates
	- using local, relative paths for templates
- showing and [hiding intents, templates and variables](#hiding-intents-templates-and-variables)
- adding variables to intents and templates

## hiding intents, templates and variables
Intents, templates and variables can be hidden.
Hidden items will be imported and can be un-hidden by overwriting the `hide` field with the value of `true`

## using selection
When running an intent any text that is highlighted will be split using the configured delimiters and used to pre-populate variables.
Variables that enable `use_selection` will be assigned values by the order that they appear in the configuration and selection appropriately.
The selection value will replace the `initial` value.

## using variable values
Variables replace text in the format `{{variable_name}}` with the value of the variable.
Variables in the template file are replaced before the note is created so plugins like [Templater](https://github.com/SilentVoid13/Templater) will run after variable values are inserted.

Properties that end with `_template` also can use variables
- eg `output_pathname_template`.

For the purpose of demonstration this property uses lowercase and underscores instead of spaces but it can contain any characters.


# Examples
## global intent to create a project
This intent creates a project note in its own folder and adds an emoji to the note name.
In this case the `🏗 projects` folder contains subfolders categorising projects.
The directory is used to

```
---
intentes:
  - name: project
    variables:
      - name: output_folder
        required: true
        type: folder
        root_folder: 🏗 projects
        depth: 1
        include_roots: false
        folder_filter_set_name: default
    output_pathname_template: "{{output_folder}}/{{new_note_name}}/🏗 {{new_note_name}}"
    templates:
      - name: default
        path: 🗃 resources/⚙ system config/templates/project template.md
---
```


