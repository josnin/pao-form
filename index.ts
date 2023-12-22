
interface Validator {
    validate: (value: string) => boolean;
    message: string;
}

interface FormControl {
    name: string;
    id: string;
    value: string;
    validators: Validator[];
    valid: boolean;
    touched: boolean;
}

export default class PaoForm {
    private formControls: { [key: string]: FormControl } = {};
    private formElement: HTMLFormElement;

    constructor(formId: string) {
        this.formElement = document.getElementById(formId) as HTMLFormElement;

        this.formElement.addEventListener('input', (event) => {
            const inputElement = event.target as HTMLInputElement;
            const controlName = inputElement.name;

            // Attempt to access the form control
            const control = this.formControls[controlName];

            if (control) {
                control.value = inputElement.value;
                control.touched = true;
                control.valid = this.validateControl(control);

                const errorMessageElement = document.getElementById(`${controlName}Error`);
                if (errorMessageElement) {
                    errorMessageElement.innerHTML = this.getErrorMessages(control);
                }
            }
        });
    }

    control(name: string, validators: Validator[] = []): this {
        this.formControls[name] = {
            name,
            id: name.replace(/\./g, '_'),
            value: '',
            validators,
            valid: true,
            touched: false,
        };
        return this; // Allow method chaining
    }

    addArray(arrayName: string, size = 1): this {
        Array.from({ length: size }, (_, index) => {
            const name = `${arrayName}[${index}]`;
            this.formControls[name] = {
            name,
            id: name.replace(/\./g, '_'),
            value: '',
            validators: [],
            valid: true,
            touched: false,
            };
        });
        return this; // Allow method chaining
    }

    removeFromArray(arrayName: string): this {
        if (this.formControls[arrayName]) {
            delete this.formControls[arrayName];
        }
        return this; // Allow method chaining
    }

    build(): { controls: { [key: string]: FormControl } } {
        return {
            controls: this.formControls,
        };
    }

    validateControl(control: FormControl): boolean {
        return control.validators.every((validator) => validator.validate(control.value));
    }

    getErrorMessages(control: FormControl): string {
        const errorMessages = control.validators
            .filter((validator) => !validator.validate(control.value))
            .map((validator) => validator.message);

        return errorMessages.join('<br>') || '';
    }

    getFormStatus(): boolean {
        return Object.values(this.formControls).every((control) => control.valid);
    }

    renderFormControls() {

        // Iterate over the dynamically added addresses and create input elements
        Object.values(this.formControls).forEach((control) => {
          const inputElement = document.getElementById(control.id) as HTMLInputElement;

          // Update the control's value based on the input element's current value
          control.value = inputElement.value;

          // Update the control's 'touched' and 'valid' properties
          control.touched = true;
          control.valid = this.validateControl(control);

          // Update the error messages
          const errorMessageId = `${control.id}Error`;
          const errorMessageElement = document.getElementById(errorMessageId);
          if (errorMessageElement) {
            errorMessageElement.innerHTML = this.getErrorMessages(control);
          }

        });
    }

    updateErrorMessages() {
      Object.values(this.formControls).forEach((control) => {
        const errorMessageElement = document.getElementById(`${control.id}Error`);
        if (errorMessageElement) {
          errorMessageElement.innerHTML = this.getErrorMessages(control);
        }
      });
    }

    displayFormStatus() {
      // Update error messages for individual controls
      this.updateErrorMessages();

      // Check the overall form status
      const formIsValid = this.getFormStatus();

      // Display or use the form status as needed
      if (formIsValid) {
        console.log('Form is valid!');
      } else {
        console.log('Form has validation errors.');
      }
    }



}

