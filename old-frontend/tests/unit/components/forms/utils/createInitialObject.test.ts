import createInitialObject from 'components/forms/utils/createInitialObject';

const DEFAULT_USER_RESPONSE = {
  id: 1,
  username: '__USERNAME__',
  family: 1,
  last_login: '__LAST_LOGIN__',
  is_superuser: false,
  first_name: '__FIRST_NAME__',
  last_name: '__LAST_NAME__',
  email: 'EMAIL@TEST.COM',
  phone_number: '07123123123',
  is_staff: false,
  is_active: false,
  date_joined: '__DATE_JOINED__',
  member_colour: 'eeeeee',
  dob: '01-01-2000',
  has_done_setup: false,
  profile_image: '',
  presigned_profile_image_url: ''
};
it('createInitialObject ::: addMembers', () => {
  const initialObj = createInitialObject(
    {
      members: {
        type: 'addMembers',
        required: true,
        permittedValues: {
          family: [],
          friends: []
        },
        valueToDisplay: (val) => `${val.first_name} ${val.last_name}`,
        displayName: 'MEMBERS'
      }
    },
    DEFAULT_USER_RESPONSE,
    {
      members: [1, 2, 3]
    }
  );

  expect(initialObj.members).toEqual([1, 2, 3]);
});

it('createInitialObject ::: duration', () => {
  const initialObj = createInitialObject(
    {
      duration: {
        displayName: 'Duration of task',
        listMode: 'MODAL',
        permittedValues: [
          {
            label: '5 Minutes',
            value: 5
          },
          {
            label: '15 Minutes',
            value: 15
          },
          {
            label: '30 Minutes',
            value: 30
          },
          {
            label: '1 Hour',
            value: 60
          }
        ],
        required: true,
        type: 'dropDown'
      }
    },
    DEFAULT_USER_RESPONSE,
    {
      duration: 30
    }
  );

  expect(initialObj.duration).toEqual(30);
});
