
interface Validator {
  validator: (value: any) => boolean;
  errorMessage: string;
}

interface FormControls {
  [key: string]: FormControl | FormGroup | FormArray;
}

export class FormControl {
  value: string;
  validators: Validator[];
  valid: boolean;
  dirty: boolean;

  constructor(initialValue = '', validators: Validator[] = []) {
    this.value = initialValue;
    this.validators = validators;
    this.valid = validators.every(({ validator }) => validator(initialValue));
    this.dirty = false;
  }

  validateAll(): void { // FormControl validateAll
    this.dirty = true;
    this.valid = this.validators.every(({ validator }) => validator(this.value));
  }
}

export class FormArray {
  controls: FormControl[];

  constructor() {
    this.controls = [];
  }

  push(control: FormControl): void {
    this.controls.push(control);
  }

  remove(index: number): void {
    this.controls.splice(index, 1);
  }

  get value(): string[] {
    return this.controls.map(control => control.value);
  }

  get valid(): boolean {
    return this.controls.every(control => control.valid);
  }

  validateAll(): void { // FormArray validateAll
    this.controls.forEach(control => control.validateAll());
  }
}

export class FormGroup {
  controls: FormControls;
  //controls: { [key: string]: FormControl | FormGroup | FormArray };
  eventListeners: Record<string, { eventName: string; listener: EventListenerOrEventListenerObject }>;
  customErrorMessages: Record<string, string>;

  constructor() {
    this.controls = {};
    this.eventListeners = {};
    this.customErrorMessages = {};
  }

  addControl(name: string, initialValue = '', validators: Validator[] = []): void {
    this.controls[name] = new FormControl(initialValue, validators);
    this.addGenericListener(name);
  }

  addGroup(name: string, group: FormGroup): void {
    this.controls[name] = group;
  }

  addFormArray(name: string, formArray: FormArray): void {
    this.controls[name] = formArray;
  }


  get value(): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    for (const [name, control] of Object.entries(this.controls)) {
      if (control instanceof FormGroup || control instanceof FormArray) {
        result[name] = control.value;
      } else {
        result[name] = control.value;
      }
    }
    return result;
  }

  get valid(): boolean {
    return Object.values(this.controls).every(control => control.valid);
  }

  // FormGroup setControlValue
  setValue(name: string, value: any): void {
    const control = this.controls[name];
    //if (control instanceof FormGroup || control instanceof FormArray) {
    //  // @ts-ignore
    //  //control.setValue(name, value);
    //} else {
    //  control.value = value;
    //  control.dirty = true;
    //  this.validate(name); // auto validate 
    //}
    if (control instanceof FormControl) {
      control.value = value;
      control.dirty = true;
      this.validate(name); // auto validate 
    }
  }


  validate(name: string): void {
    if (this.controls[name]) {

      // make sure it coming from FormControl instance
      //if (!(this.controls[name] instanceof FormGroup) && !(this.controls[name] instanceof FormArray)) {
      if (this.controls[name] instanceof FormControl) {
        let element = document.getElementById(name);

        // set element value by the controls value
        // @ts-ignore
        element.value = this.controls[name].value

        // execute validator for this control
        this.controls[name].validateAll();

        // then display error message ( if any )
        this.displayErrorMessage(name)
      }
    }
  }

  displayErrorMessage(name: string) {
      const errorMessage = this.getErrorMessage(name);
      if (errorMessage) {
        this.showErrorMessage(name, errorMessage);
      } else {
        this.hideErrorMessage(name);
      }

  }

  validateAll() { // FormGroup validateAll
    for (const name in this.controls) {
      //if (!(this.controls[name] instanceof FormGroup) && !(this.controls[name] instanceof FormArray)) {
      //  this.controls[name].validateAll();
      //} else {
      //  this.controls[name].validateAll();
      //}

      this.controls[name].validateAll();

      let element = document.getElementById(name);
      console.log(name)
      // @ts-ignore
      element.value = this.controls[name].value

      this.displayErrorMessage(name) // @todo should apply for all?
    }
  }
  

  addGenericListener(name: string): void {
    if (!(this.controls[name] instanceof FormGroup) && !(this.controls[name] instanceof FormArray) && !this.eventListeners[name]) {
      const element = document.getElementById(name);

      if (element) {
        const listener = (event: Event) => {
          this.setValue(name, (event.target as HTMLInputElement).value);
          this.validate(name);
        };

        // Use 'change' event for select elements, 'input' for others
        const eventName = element.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        element.addEventListener(eventName, listener);

        
        this.eventListeners[name] = { eventName, listener };

      }
    }
  }

  removeGenericListener(name: string): void {
    if (this.eventListeners[name]) {
      const { eventName, listener } = this.eventListeners[name];
      const element = document.getElementById(name);

      if (element) {
        element.removeEventListener(eventName, listener);
        delete this.eventListeners[name];
      }
    }
  }

  showErrorMessage(name: string, errorMessage: string): void {
    const errorElement = document.getElementById(`${name}Error`);
    if (!errorElement) {
      console.warn(`Error element for control '${name}' is missing in the template.`);
    }
    if (errorElement) {
      errorElement.innerHTML = `<div>${errorMessage}</div>`;
    }
  }

  hideErrorMessage(name: string): void {
    const errorElement = document.getElementById(`${name}Error`);
    if (!errorElement) {
      console.warn(`Error: Missing error element for control '${name}' in the template. Add a <div id="${name}Error"></div> for error messages.`);
    }
    if (errorElement) {
      errorElement.innerHTML = ''; // Clear all error messages
    }
  }

  setCustomErrorMessage(name: string, errorMessage: string): void {
    this.customErrorMessages[name] = errorMessage;
  }

  getErrorMessage(name: string) {
    const control = this.controls[name];
    // @ts-ignore
    if (control && !control.valid && control.validators) {
      // @ts-ignore
      for (const { validator, errorMessage } of control.validators) {
        if (!validator(control.value)) {
          return this.customErrorMessages[name] || errorMessage;
        }
      }
    }
    return '';
  }


}
