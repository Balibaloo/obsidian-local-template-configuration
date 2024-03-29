// https://github.com/chhoumann/quickadd/blob/master/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L24
import { App, ButtonComponent, Modal, Notice, TextComponent } from "obsidian";
import { TemplateVariable } from ".";


export class GenericInputPrompt extends Modal {
	public waitForClose: Promise<string>;

	private resolvePromise: (input: string) => void;
	private rejectPromise: (reason?: unknown) => void;
	private didSubmit = false;
	private inputComponent: TextComponent;
	private input: string;
	private readonly placeholder: string;
	private readonly required: boolean;
	private validator: ((text:string) => boolean) | undefined;
  private errorMessage: string;

	public static Prompt(
		app: App,
		variable: TemplateVariable,
    validator?: (text:string) => boolean,
    validationErrorMessage?: string,
	): Promise<string> {
		const newPromptModal = new GenericInputPrompt(
			app,
			variable.prompt || variable.name,
			variable.description,
			variable.placeholder,
			variable.initial,
			variable.required,
      validator,
      validationErrorMessage,
		);
		return newPromptModal.waitForClose;
	}

	protected constructor(
		app: App,
		private header: string,
		private description?: string,
		placeholder?: string,
		value?: string,
		required?: boolean,
    validator?: (text:string) => boolean,
    validationErrorMessage?: string,
	) {
		super(app);
		this.placeholder = placeholder ?? "";
		this.input = value ?? "";
		this.required = required ?? false;
    this.validator = validator;
    this.errorMessage = validationErrorMessage ?? "Error: Input invalid";

		this.waitForClose = new Promise<string>((resolve, reject) => {
			this.resolvePromise = resolve;
			this.rejectPromise = reject;
		});

		this.display();
		this.open();

	}

	private display() {
		this.contentEl.empty();
		this.titleEl.textContent = this.header;

		if (this.required){
			this.titleEl.addClass("requiredInputHeader");
		}

		
		const mainContentContainer: HTMLDivElement = this.contentEl.createDiv();
		if (this.description){
			mainContentContainer.createDiv({text:this.description, cls:"modal-description"});
		}
		this.inputComponent = this.createInputField(
			mainContentContainer,
			this.input,
			this.placeholder,
		);
		this.createButtonBar(mainContentContainer);
	}

	protected createInputField(
		container: HTMLElement,
		value: string,
		placeholder?: string,
	) {
		const textComponent = new TextComponent(container);
		textComponent.inputEl.classList.add("text-input");
		textComponent
		.setPlaceholder(placeholder ?? "")
    .setValue( value.toString() )
		.onChange((value) => {
      this.input = value
      this.updateInputValidation(textComponent, value);
    })
		.inputEl.addEventListener("keydown", this.submitEnterCallback);
		
    this.updateInputValidation(textComponent, value);
		
		return textComponent;
	}

  protected updateInputValidation(textComponent:TextComponent, value:string){
    if (this.validator){
      if (this.validator(value)){
        textComponent.inputEl.removeClass("requiredInput");
      } else {
        textComponent.inputEl.addClass("requiredInput");
      }
    }
  }

	private createButton(
		container: HTMLElement,
		text: string,
		callback: (evt: MouseEvent) => unknown
	) {
		const btn = new ButtonComponent(container);
		btn.setButtonText(text).onClick(callback);

		return btn;
	}

	private createButtonBar(mainContentContainer: HTMLDivElement) {
		const buttonBarContainer: HTMLDivElement =
			mainContentContainer.createDiv();
		this.createButton(
			buttonBarContainer,
			"Ok",
			this.submitClickCallback
		).setCta().buttonEl.classList.add("ok-button");
		this.createButton(
			buttonBarContainer,
			"Cancel",
			this.cancelClickCallback
		);
		
		buttonBarContainer.classList.add("button-bar");
	}

	private submitClickCallback = (evt: MouseEvent) => this.submit();
	private cancelClickCallback = (evt: MouseEvent) => this.cancel();

	private submitEnterCallback = (evt: KeyboardEvent) => {
		if (!evt.isComposing && evt.key === "Enter") {
			evt.preventDefault();
			this.submit();
		}
	};

	private submit() {
    if (this.validator && !this.validator(this.input))
      return new Notice(this.errorMessage);
    
		this.didSubmit = true;

		this.close();
	}

	private cancel() {
		this.close();
	}

	private resolveInput() {
		if (!this.didSubmit) this.rejectPromise("No input given.");
		else this.resolvePromise(this.input);
	}

	private removeInputListener() {
		this.inputComponent.inputEl.removeEventListener(
			"keydown",
			this.submitEnterCallback
		);
	}

	onOpen() {
		super.onOpen();

		this.inputComponent.inputEl.focus();
		this.inputComponent.inputEl.select();
	}

	onClose() {
		super.onClose();
		this.resolveInput();
		this.removeInputListener();
	}
}