import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  WhiteBox
} from 'components/molecules/ViewComponents';
import { Text, useThemeColor } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import {
  useGetGuestListInviteeInvitesQuery,
  useUpdateGuestListInviteeInviteMutation
} from 'reduxStore/services/api/guestListInvites';
import { isEventEntity } from 'types/entities';
import { GuestListInviteeInvite } from 'types/guestListInvites';
import EntityWithDateAndImageData from 'components/molecules/EntityWithDateAndImageData';
import { StyleSheet } from 'react-native';
import { SmallButton } from 'components/molecules/ButtonComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

const styles = StyleSheet.create({
  responseOptions: {
    flexDirection: 'row'
  },
  responseButton: {
    marginHorizontal: 5
  }
});

const EventListing = ({ invite }: { invite: GuestListInviteeInvite }) => {
  const { t } = useTranslation();
  const [updateInvite, updateInviteResult] =
    useUpdateGuestListInviteeInviteMutation();

  const primaryColor = useThemeColor({}, 'primary');
  const greyColor = useThemeColor({}, 'mediumGrey');

  const entity = invite.entity;
  if (!isEventEntity(entity)) {
    return null;
  }

  const responseOptions: ('accepted' | 'rejected' | 'maybe')[] = [
    'accepted',
    'rejected',
    'maybe'
  ];

  return (
    <WhiteBox>
      <EntityWithDateAndImageData
        entity={entity}
        startDateField="start_datetime"
        endDateField="end_datetime"
        utc={false}
      />
      <TransparentPaddedView style={styles.responseOptions}>
        {responseOptions.map((responseOption) => (
          <SmallButton
            key={responseOption}
            disabled={updateInviteResult.isLoading}
            style={[
              styles.responseButton,
              {
                backgroundColor: invite[responseOption]
                  ? primaryColor
                  : greyColor
              }
            ]}
            title={t(`components.eventsList.${responseOption}`)}
            onPress={async () => {
              if (!invite[responseOption]) {
                try {
                  await updateInvite({
                    id: invite.id,
                    [responseOption]: true
                  }).unwrap();
                } catch {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }
            }}
          />
        ))}
      </TransparentPaddedView>
    </WhiteBox>
  );
};

export default function EventsList() {
  const { t } = useTranslation();
  const { data: invites, isLoading: isLoadingInvites } =
    useGetGuestListInviteeInvitesQuery();

  if (!invites || isLoadingInvites) {
    return <FullPageSpinner />;
  }

  return (
    <WhiteFullPageScrollView>
      <TransparentPaddedView>
        {invites.length > 0 ? (
          invites.map((invite) => (
            <EventListing key={invite.id} invite={invite} />
          ))
        ) : (
          <Text>{t('components.eventsList.noInvites')}</Text>
        )}
      </TransparentPaddedView>
    </WhiteFullPageScrollView>
  );
}
