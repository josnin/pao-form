# Pao Form Builder

A lightweight form builder library for both TypeScript and plain JavaScript, inspired by Angular's FormBuilder. This library provides a simple API for creating and managing forms with `FormControl`, `FormGroup`, and `FormArray`.

## Getting Started

1. Install the library in your project:

   ```bash
   // via npm
   npm install pao-form

   // ... or just plug & play import
   ```

2. **Import the library into your TypeScript or JavaScript files:**
   
    ``` javascript
      // For TypeScript
      import { FormBuilder, FormGroup, FormControl, FormArray } from 'pao-form';

      // For Plug & Play JavaScript 
      import { FormBuilder, FormGroup, FormControl, FormArray } from 'https://cdn.jsdelivr.net/npm/jong-router@latest/dist/pao-form.min.js';

    ```

## Usage

### Create a Form

``` javascript
  // Initialize the FormBuilder
  const fb = new FormBuilder();
  
  // Create controls with validators
  const nameControl = fb.control('John', [Validator.required]);
  const ageControl = fb.control(25, [Validator.number]);
  
  // Create a form group
  const userFormGroup = fb.group({
    name: nameControl,
    age: ageControl,
  });
  
  // Create an array of controls
  const hobbiesArray = fb.array([
    fb.control('Reading'),
    fb.control('Traveling'),
  ]);

```

### Subscribe to Changes

```javascript
    // Subscribe to changes in the entire form group
    userFormGroup.subscribe(value => {
      console.log('Form value changed:', value);
    });

    // Subscribe to changes in the specific control
    userFormGroup.subscribeControl('nameControl', value => {
      console.log('Name control changed:', value);
    });
    
    // Or Subscribe to changes in a specific control
    nameControl.subscribe(value => {
      console.log('Name control changed:', value);
    });

```

### Set & Clear Values

```javascript
  // Set values for the entire form group
  userFormGroup.setValue({
    name: 'Bob',
    age: 28,
  });

    
  // Clear values for the entire form group
  userFormGroup.clearValue();

 

```

### Nested Group Controls

```javascript
  // Create nested form groups
  const addressGroup = fb.group({
    city: fb.control('New York'),
    postalCode: fb.control('10001'),
  });
  
  // Add nested group to the main form group
  userFormGroup.addControl('address', addressGroup);

```

### Validators example

```javascript
    const Validators = {
          required: {
            validator: (value) => !!value,
            errorMessage: 'This field is required!',
          },      
          number: {
            validator: (value) => !isNaN(value),
            errorMessage: 'Invalid number!',
          }
    }
```

### Dynamically Adding Controls to FormArray

```javascript
  // Dynamically add controls to a FormArray
  hobbiesArray.controls.push(fb.control('Coding'));

```

### Accessing Values

```javascript
  // Access values in the form group
  const formValues = fb.getValue();
  console.log('Form values:', formValues);

```

### HTML Element Association
To associate the form controls with HTML elements, you can use the provided control names when defining your HTML. For example:
```html
<!-- Input for 'name' control -->
<input type="text" id="name" />
<!-- display of 'name' control validator message -->
<div id="nameError"></div>

<!-- Input for 'age' control -->
<input type="number" id="age"/>
<!-- display of 'name' control validator message -->
<div id="ageError"></div>

<!-- Nested group controls -->
<div id="address">
  <input type="text" id="city"/>
  <div id="cityError"></div>

  <input type="text" id="postalCode" />
  <div id="postalCodeError"></div>

</div>

```

## How to run development server? 
```
git clone git@github.com:josnin/pao-form.git 
cd ~/Documents/pao-form/
npm install
npm run dev
```

## Help

Need help? Open an issue in: [ISSUES](https://github.com/josnin/pao-form/issues)


## Contributing
Want to improve and add feature? Fork the repo, add your changes and send a pull request.

## License
This library is released under the MIT License.
