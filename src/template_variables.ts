import { App } from "obsidian";
import { GenericInputPrompt, TemplateVariable, TemplateVariableType } from "./types";

export async function getVariableValues(app: App, variables: TemplateVariable[], existingValues: { [key: string]: string }) {
  // gather variable values
  const gatheredValues: any = {};
  for (let variable of variables) {
    let val = existingValues[variable.name] ?? "";
    if (variable.type == TemplateVariableType.text) {
      if (!validateText(variable, val, false)) {
        try {
          val = await GenericInputPrompt.Prompt(app, variable.name, variable.placeholder, variable.initial, variable.required,
            text => validateText(variable, text, false),
            "Error: Please enter text" + (variable.regex ? ` that matches the following regex "${variable.regex}"` : "")
          );
        } catch { }
        validateText(variable, val, true);
      };

    } else if (variable.type === TemplateVariableType.number) {
      if (!validateNumber(variable, val, false)) {
        const minString = variable.min ? `${variable.min} <= ` : "";
        const maxString = variable.max ? ` <= ${variable.max}` : "";
        const placeholderString = variable.placeholder || minString + variable.name + maxString;

        try {
          val = await GenericInputPrompt.Prompt(app, variable.name, placeholderString, variable.initial, variable.required,
            text => validateNumber(variable, text, false)
            , `Error: Please enter a number` + ((variable.min || variable.max) ? `in the range ${minString} x ${maxString}` : "")
          );
        } catch { }
        validateNumber(variable, val, true);
      }

    } else if (variable.type === TemplateVariableType.natural_date) {
      if (!validateNaturalDate(variable, val, false)) {
        try {
          val = await GenericInputPrompt.Prompt(app, variable.name, variable.placeholder, variable.initial, variable.required,
            text => validateNaturalDate(variable, text, false),
            "Error: Please enter a valid natural language date");
        } catch { }

        validateNaturalDate(variable, val, true);
      }

      const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
      val = NLDates.parseDate(val).formattedString;
    }

    gatheredValues[variable.name] = val;
  }

  console.log("Gathered values", gatheredValues);
  return gatheredValues;
}

function validateText(variable: TemplateVariable, value: string, throwErrors: boolean): boolean {
  if (variable.required) {
    if (variable.regex && !Boolean(value.match(variable.regex))) {
      if (throwErrors)
        throw new Error(`Error: value for ${variable.name} doesn't match the regular expression "${variable.regex}"`)
      return false;

    } else if (value === "" || !value) {
      if (throwErrors)
        throw new Error(`Error: missing required text variable ${variable.name}`);
      return false;
    }
  }

  return true;
}

function validateNumber(variable: TemplateVariable, value: string, throwErrors: boolean): boolean {
  const parsedNum = parseFloat(value);
  const isValidNum: boolean = Boolean(parsedNum);
  if (variable.required && !isValidNum) {
    if (throwErrors)
      throw new Error(`Error: missing required number variable ${variable.name}`);
    return false;
  }

  if (variable.min && parsedNum < variable.min) {
    value = "";
    if (variable.required) {
      if (throwErrors)
        throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is below the minimum (${variable.min})`);
      return false;
    }
  }

  if (variable.max && parsedNum > variable.max) {
    value = "";
    if (variable.required) {
      if (throwErrors)
        throw new Error(`Error: The value entered for ${variable.name} (${parsedNum}) is above the maximum (${variable.max})`);
      return false;
    }
  }

  return true;
}
function validateNaturalDate(variable: TemplateVariable, val: string, throwErrors: boolean): boolean {
  const NLDates = (app as any).plugins.getPlugin("nldates-obsidian");
  const parsedDate = NLDates.parseDate(val);
  if (!parsedDate.moment.isValid()) {
    if (variable.required) {
      if (throwErrors)
        throw new Error(`Error: missing required date variable ${variable.name}`);
      return false;
    }
  }

  return true;
}

