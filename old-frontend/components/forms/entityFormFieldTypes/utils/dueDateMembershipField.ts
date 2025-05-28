import { Field } from 'components/forms/formFieldTypes';

export default function dueDateMembershipField(
  dueDateFieldName: string,
  hidden: boolean,
  displayName: string,
  changeMembersText: string
) {
  return {
    type: 'addMembers',
    required: true,
    valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
    displayName,
    hidden,
    changeMembersText,
    initialValue: [],
    shownFields: [
      {
        [dueDateFieldName]: true
      }
    ]
  } as Field;
}
