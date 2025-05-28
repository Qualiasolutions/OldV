import {
  ColourField,
  DateField,
  ImageField,
  StringField
} from 'components/forms/formFieldTypes';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type MyAccountFormFieldTypes = {
  profile_image: ImageField;
  first_name: StringField;
  last_name: StringField;
  dob: DateField;
  member_colour: ColourField;
};

export const useMyAccountForm = (): MyAccountFormFieldTypes => {
  const { t } = useTranslation('modelFields');

  return useMemo(() => {
    return {
      profile_image: {
        type: 'Image',
        required: false,
        displayName: '',
        sourceField: 'presigned_profile_image_url',
        centered: true
      },
      first_name: {
        type: 'string',
        required: true,
        displayName: t('familyMember.first_name')
      },
      last_name: {
        type: 'string',
        required: true,
        displayName: t('familyMember.last_name')
      },
      dob: {
        type: 'Date',
        required: true,
        displayName: t('familyMember.dob')
      },
      member_colour: {
        type: 'colour',
        required: true,
        displayName: t('familyMember.member_colour')
      }
    };
  }, [t]);
};
