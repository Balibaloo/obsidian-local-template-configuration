import { hasNewNoteProperties } from "../intents";
import { getIntentTemplate } from "./templates";

export type Template = hasNewNoteProperties & {
  name: string;
  path: string;
  disable: boolean;
}

export { 
  getIntentTemplate 
};