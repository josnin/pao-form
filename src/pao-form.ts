
interface Validator {
  validator: (value: any) => boolean;
  errorMessage: string;
}

interface FormControls {
  [key: string]: FormControl | FormGroup | FormArray;
}


export class FormControl {
  value: string;
  //name: string = '';
  validators: Validator[];
  valid: boolean;
  dirty: boolean;
  //private valueChangeEmitter = new EventEmitter();
  //parent: FormGroup | null = null; // Reference to the parent FormGroup

  constructor(initialValue = '', validators: Validator[] = []) {
    this.value = initialValue;
    this.validators = validators;
    this.valid = validators.every(({ validator }) => validator(initialValue));
    this.dirty = false;
    //this.valueChangeEmitter.emit(this.value); // Notify subscribers
  }

  validateAll(): void { // FormControl validateAll
    this.dirty = true;
    this.valid = this.validators.every(({ validator }) => validator(this.value));
  }

  //setValue(newVal: string): void {
  //  if (this.parent) {
  //      this.parent.setValue(this.name, newVal);
  //      this.valueChangeEmitter.emit(this.name, newVal); // Notify subscribers
  //  } else {
  //      console.warn(`Error: Missing Parent FormGroup, FormControl ${this.name} is not assigned to any parent FormGroup`)
  //  }
  //}

  //subscribe(controlName: string, callback: (value: any) => void): void {
  //  this.valueChangeEmitter.subscribe(controlName, callback);
  //}
}

export class FormArray {
  controls: FormControl[];
  private valueChangeEmitter = new EventEmitter();

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

  setValue(values: any[]): void { // FormArray
    this.controls.forEach((control, index) => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        //control.setValue(control.name, values[index]);
        // @ts-ignore
        control.setValue(values[index]);
      } else if (control instanceof FormControl) {
        control.value = values[index];
        control.dirty = true;
      }
    });

  }

}

export class FormGroup {
  controls: FormControls;
  eventListeners: Record<string, { eventName: string; listener: EventListenerOrEventListenerObject }>;
  private valueChangeEmitter = new EventEmitter();

  constructor() {
    this.controls = {};
    this.eventListeners = {};
  }

  addControl(name: string, initialValue = '', validators: Validator[] = []): void {
    const control = new FormControl(initialValue, validators);

    // @ts-ignore
    // control.name = name;
    // @ts-ignore
    // control.parent = this;
    
    this.controls[name] = control;
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
    if (control instanceof FormGroup || control instanceof FormArray) {
      // @ts-ignore
      control.setValue(name, value);
    } else if (control instanceof FormControl) {
      control.value = value;
      control.dirty = true;
      this.validate(name); // auto validate 
      this.valueChangeEmitter.emit(name, value); // Notify subscribers
    }
  }


  validate(name: string): void {
    if (this.controls[name]) {
      let element = document.getElementById(name);

      // @ts-ignore
      element.value = this.controls[name].value

      // execute validator for this control
      this.controls[name].validateAll();

      // then display error message ( if any )
      this.displayErrorMessage(name)
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
      this.validate(name);
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
      console.warn(`Error: Missing error element for control '${name}' in the template. Add a <div id="${name}Error"></div> for error messages.`);
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

  getErrorMessage(name: string) {
    const control = this.controls[name];
    // @ts-ignore
    if (control && !control.valid && control.validators) {
      // @ts-ignore
      for (const { validator, errorMessage } of control.validators) {
        if (!validator(control.value)) {
          return errorMessage;
        }
      }
    }
    return '';
  
  }

  subscribe(controlName: string, callback: (value: any) => void): void {
    this.valueChangeEmitter.subscribe(controlName, callback);
  }


}


class EventEmitter {
  private listeners: { [key: string]: ((value: any) => void)[] } = {};

  subscribe(controlName: string, callback: (value: any) => void): void {
    if (!this.listeners[controlName]) {
      this.listeners[controlName] = [];
    }
    this.listeners[controlName].push(callback);
  }

  emit(controlName: string, value: any): void {
    if (this.listeners[controlName]) {
      this.listeners[controlName].forEach(listener => listener(value));
    }
  }

  clearAllListeners(): void {
    this.listeners = {};
  }

  clearListeners(controlName: string): void {
    delete this.listeners[controlName];
  }

}