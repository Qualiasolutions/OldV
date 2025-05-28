import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import { SmallButton } from './ButtonComponents';
import ListingModal from './ListingModal';
import { PaddedSpinner } from './Spinners';
import parsePhoneNumber from 'libphonenumber-js';

type PhoneContact = {
  name: string;
  phoneNumber: string;
};

export default function PhoneContactSelector({
  open,
  onRequestClose,
  onSelect
}: {
  open: boolean;
  onRequestClose: () => void;
  onSelect: (value: PhoneContact) => void;
}) {
  const [contacts, setContacts] = useState<PhoneContact[] | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers]
        });

        const phoneContacts = data.filter((contact) => !!contact.phoneNumbers);
        const newContacts: PhoneContact[] = [];
        const addedNumbers: { [key: string]: boolean } = {};
        for (const contact of phoneContacts) {
          if (contact.phoneNumbers) {
            for (const phoneNumber of contact.phoneNumbers) {
              if (phoneNumber.number) {
                // const simpleNumber = phoneNumber.number.replace(/\s/g, '');
                const parsedNumber = parsePhoneNumber(phoneNumber.number, 'GB');
                if (
                  parsedNumber &&
                  parsedNumber.number &&
                  parsedNumber?.isValid() &&
                  !(parsedNumber.number in addedNumbers)
                ) {
                  newContacts.push({
                    name: contact.name,
                    phoneNumber: parsedNumber.number
                  });
                  addedNumbers[parsedNumber.number] = true;
                }
              }
            }
          }
        }
        setContacts(newContacts);
      }
    })();
  }, []);

  if (!contacts) {
    return null;
  }

  return (
    <>
      <ListingModal
        data={contacts.map((contact) => ({
          name: `${contact.name} (${contact.phoneNumber})`,
          id: contact.phoneNumber,
          data: contact
        }))}
        visible={open}
        onSelect={(option) => {
          onSelect(option.data);
        }}
        onClose={() => {
          onRequestClose();
        }}
      />
    </>
  );
}
