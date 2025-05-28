import React from 'react';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  memberColour: {
    height: 9,
    width: 30,
    borderRadius: 5
  },
  usernameAndColor: { justifyContent: 'center', alignItems: 'flex-end' },
  nameText: { fontSize: 12 }
});

type UserProp = {
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
  member_colour: string;
};

export default function UserInitialsWithColor({
  user,
  isPending,
  style
}: {
  user: UserProp;
  isPending?: boolean;
  style?: ViewStyle;
}) {
  const { t } = useTranslation();
  const displayName = user.first_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user.phone_number ||
      user.email ||
      t('components.userInitials.setupPending');
  return (
    <TransparentView style={[styles.container, style || {}]}>
      <TransparentView style={styles.usernameAndColor}>
        <AlmostBlackText
          text={`${displayName}${isPending ? ` (${t('common.pending')})` : ''}`}
          style={styles.nameText}
        />
        {user.member_colour && (
          <View
            style={[
              styles.memberColour,
              { backgroundColor: `#${user.member_colour}` }
            ]}
          />
        )}
      </TransparentView>
    </TransparentView>
  );
}
