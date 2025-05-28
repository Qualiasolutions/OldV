import { useThemeColor } from 'components/Themed';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { UserResponse } from 'types/users';

export default function MemberCircle({ member }: { member: UserResponse }) {
  const styles = StyleSheet.create({
    memberCircle: {
      backgroundColor: `#${member.member_colour}`,
      width: 40,
      height: 40,
      borderRadius: 30,
      color: useThemeColor({}, 'white'),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    text: {
      color: useThemeColor({}, 'almostBlack'),
      fontSize: 20
    }
  });

  return (
    <View key={member.id} style={styles.memberCircle}>
      <Text style={styles.text}>{member.first_name.charAt(0)}</Text>
    </View>
  );
}
