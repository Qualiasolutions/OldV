import { Field } from 'components/forms/formFieldTypes';

export default function reminderDropDownField(
  dueDateFieldName: string,
  displayName: string,
  hidden: boolean
) {
  return {
    type: 'dropDown',
    permittedValues: [
      {
        label: '1 day before',
        value: 'DAILY'
      },
      {
        label: '1 week before',
        value: 'WEEKLY'
      },
      {
        label: '1 month before',
        value: 'MONTHLY'
      }
    ],
    required: false,
    displayName,
    listMode: 'MODAL',
    hidden,
    initialValue: 'MONTHLY',
    shownFields: [
      {
        [dueDateFieldName]: true
      }
    ]
  } as Field;
}
