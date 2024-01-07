interface Validator {
  validator: (value: any) => boolean;
  errorMessage: string;
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
  
    clearListeners(controlName: string): void {
      delete this.listeners[controlName];
    }
  }
  
export  class FormControl {
    value: any;
    name: string = '';
    validators: Validator[];
    valid: boolean;
    dirty: boolean;
    private valueChangeEmitter = new EventEmitter();

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
  
    setValue(newValue: any): void {
      this.value = newValue;
      this.valueChangeEmitter.emit(this.name, this.value);
    }
  
    subscribe(callback: (value: any) => void): void {
      this.valueChangeEmitter.subscribe(this.name, callback);
    }
  
    getValue(): any {
      return this.value;
    }

    clearValue(): void {
      this.setValue(null);
    }

  }
  
export  class FormGroup {
  controls: { [key: string]: FormControl | FormGroup | FormArray } = {};
  private valueChangeEmitter = new EventEmitter();
  name: string = '';
  eventListeners: Record<string, { eventName: string; listener: EventListenerOrEventListenerObject }>;

  constructor() {
    this.controls = {};
    this.eventListeners = {};
  }

  addControl(name: string, initialValue = '', validators: Validator[] = []): void {
    const control = new FormControl(initialValue, validators);
    control.name = name;

    this.controls[name] = control;
    this.addGenericListener(name);

  }
  
  addGroup(name: string, group: FormGroup): void {
    this.controls[name] = group;
  }

  addFormArray(name: string, formArray: FormArray): void {
    this.controls[name] = formArray;
  }

  setValue(values: { [key: string]: any }): void {
    // Loop thru FormControl to setValue & Revalidate
    for (const controlName in values) {
      if (values.hasOwnProperty(controlName) && this.controls.hasOwnProperty(controlName)) {
        this.controls[controlName].setValue(values[controlName]);
        this.validate(controlName); // auto validate 
      }
    }

    // emit the value who ever subscribe on this control
    this.valueChangeEmitter.emit(this.name, this.getValue());
  }

  subscribe(callback: (value: any) => void): void {
    this.valueChangeEmitter.subscribe(this.name, callback);
  }

  subscribeControl(controlName: string, callback: (value: any) => void): void {
    const control = this.controls[controlName];
    if (control instanceof FormControl || control instanceof FormGroup || control instanceof FormArray) {
      control.subscribe(callback);
    }
  }

  getValue(): { [key: string]: any } {
    // Loop thru FormControl to getValue
    const value: { [key: string]: any } = {};

    for (const controlName in this.controls) {
      if (this.controls.hasOwnProperty(controlName)) {
        value[controlName] = this.controls[controlName].getValue();
      }
    }

    return value;
  }

  get valid(): boolean {
    return Object.values(this.controls).every(control => control.valid);
  }

  validate(name: string): void {
    if (this.controls[name]) {
      const element = document.getElementById(name);

      // @ts-ignore
      element.value = this.controls[name].value

      // execute validator for this control
      this.controls[name].validateAll();

      // then display error message ( if any )
      this.displayErrorMessage(name)
    }
  }

  addGenericListener(name: string): void {
    if (!(this.controls[name] instanceof FormGroup) && !(this.controls[name] instanceof FormArray) && !this.eventListeners[name]) {
      const element = document.getElementById(name);

      if (element) {
        const listener = (event: Event) => {
          //this.setValue(name, (event.target as HTMLInputElement).value);
          this.setValue({ [name]: (event.target as HTMLInputElement).value });
          this.validate(name);
        };

        // Use 'change' event for select elements, 'input' for others
        const eventName = element.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        element.addEventListener(eventName, listener);

        
        this.eventListeners[name] = { eventName, listener };

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
      this.validate(name);
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
    if (errorElement) {
      errorElement.innerHTML = ''; // Clear all error messages
    }
  }

  getErrorMessage(name: string) {
    const control = this.controls[name];
    if (control instanceof FormControl) {
      if (control && !control.valid && control.validators) {
        for (const { validator, errorMessage } of control.validators) {
          if (!validator(control.value)) {
            return errorMessage;
          }
        }
      }
    }
    return '';
  
  }

  clearValue() {
    // Loop through until it goes to FormControl clearValue
    for (const controlName in this.controls) {
      if (this.controls.hasOwnProperty(controlName)) {
        const control = this.controls[controlName];
        if (control instanceof FormControl || control instanceof FormGroup || control instanceof FormArray) {
          control.clearValue();
        }
      }
    }

    // Revalidate after clear value
    this.validateAll()

    // Emit the updated value after clearing
    this.valueChangeEmitter.emit(this.name, this.getValue());

  }

}
  
export class FormArray {
  controls: (FormControl | FormGroup | FormArray)[] = [];
  private valueChangeEmitter = new EventEmitter();

  push(control: FormControl): void {
      this.controls.push(control);
  }


  setValue(values: any[]): void {
    // Loop through until it goes to FormGroup setValue
    this.controls.forEach((control, index) => {
      if (control instanceof FormGroup || control instanceof FormArray || control instanceof FormControl) {
        if (values[index] !== undefined) {
          control.setValue(values[index]);
        }
      }
    });

    this.valueChangeEmitter.emit('FormArray', this.getValue());
  }

  subscribe(callback: (value: any) => void): void {
    this.valueChangeEmitter.subscribe('FormArray', callback);
  }

  subscribeControl(controlName: string, callback: (value: any) => void): void {
    this.valueChangeEmitter.subscribe(controlName, callback);
  }

  getValue(): any[] {
    return this.controls.map(control => {
      if (control instanceof FormGroup || control instanceof FormArray || control instanceof FormControl) {
        return control.getValue();
      }
      return null;
    });
  }

  validateAll(): void { // FormArray validateAll
    this.controls.forEach(control => control.validateAll());
  }

  clearValue() {
    // Loop through until it goes to FormGroup clearValue
    this.controls.forEach((control) => {
      if (control instanceof FormControl || control instanceof FormGroup || control instanceof FormArray) {
        control.clearValue();
      }
    });

    // Revalidate after clear value
    this.validateAll();

    // Emit the updated value after clearing
    this.valueChangeEmitter.emit('FormArray', this.getValue());

  }

  get valid(): boolean {
    return Object.values(this.controls).every(control => control.valid);
  }

}
