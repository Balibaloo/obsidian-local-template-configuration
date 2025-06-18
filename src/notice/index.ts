import { Notice } from "obsidian";


export class FilteredOpenerMissingNotice extends Notice {
  constructor( message: string|DocumentFragment = "", duration:number = 18_000 ){

    if ( ! message ){
      message = "Error: The Filtered Opener plugin is not installed.\nClick this message to install it from the community plugins tab."
    }

    super(message, duration);

    this.noticeEl.onClickEvent( ev => {
      window.open("obsidian://show-plugin?id=filtered-opener")
    })
  }
}