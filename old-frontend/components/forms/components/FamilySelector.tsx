import { TransparentView } from 'components/molecules/ViewComponents';
import UserWithColor from 'components/molecules/UserWithColor';
import { StyleSheet } from 'react-native';
import { UserResponse } from 'types/users';
import Checkbox from 'components/molecules/Checkbox';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  memberContainer: {
    marginTop: 10
  },
  checkbox: {
    marginRight: 10
  },
  selectAllText: {
    fontSize: 18
  },
  inlineMembersList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  inlineMember: {
    marginRight: 20
  }
});

export default function FamilySelector({
  data,
  values,
  onValueChange,
  inline = false
}: {
  data: UserResponse[];
  values: number[];
  onValueChange: (val: number[]) => void;
  inline?: boolean;
}) {
  const { t } = useTranslation();

  const onSelectMember = (member: UserResponse) => {
    if (values.includes(member.id)) {
      onValueChange([...values.filter((i) => member.id != i)]);
    } else {
      onValueChange([...values, member.id]);
    }
  };

  const selectAllButton = (
    <TransparentView style={styles.rowContainer}>
      <Checkbox
        checked={values && data.length === values.length}
        onValueChange={async () => {
          if (values.length === data.length) {
            onValueChange([]);
          } else {
            onValueChange(data.map((member) => member.id));
          }
        }}
        style={styles.checkbox}
      />
      <AlmostBlackText
        text={t('common.selectAll')}
        style={styles.selectAllText}
      />
    </TransparentView>
  );

  const membersList = () => {
    return data.map((member: any) => (
      <TransparentView
        key={member.id}
        style={[
          styles.rowContainer,
          styles.memberContainer,
          inline ? styles.inlineMember : {}
        ]}
      >
        <Checkbox
          checked={values && values.includes(member.id)}
          onValueChange={async () => {
            onSelectMember(member);
          }}
          style={styles.checkbox}
        />
        <UserWithColor
          name={`${member.first_name} ${member.last_name}`}
          memberColour={member.member_colour}
          showUserImage={false}
        />
      </TransparentView>
    ));
  };

  return (
    <TransparentView>
      {selectAllButton}
      <TransparentView style={inline ? styles.inlineMembersList : {}}>
        {membersList()}
      </TransparentView>
    </TransparentView>
  );
}
