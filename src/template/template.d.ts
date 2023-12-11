import { hasNewNoteProperties } from "..";

export type Template = hasNewNoteProperties & {
  name: string;
  path: string;
}