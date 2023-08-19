import { hasNewNoteProperties } from "./newNoteProperties";

export type Template = hasNewNoteProperties & {
  name: string;
  path: string;
}