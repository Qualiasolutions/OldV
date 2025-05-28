/* This type specifies the actual values of the fields.

  e.g. {
    name: 'Tim',
    age: 28
  }
*/
export type FieldValueTypes = {
  [key: string]: any;
};

export type FieldErrorTypes = {
  [key: string]: string;
};
