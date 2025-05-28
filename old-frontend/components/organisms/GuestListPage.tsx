import { SmallButton } from 'components/molecules/ButtonComponents';
import PhoneOrEmailInput from 'components/molecules/PhoneOrEmailInput';
import {
  TransparentScrollView,
  WhiteFullPageScrollView
} from 'components/molecules/ScrollViewComponents';
import {
  FullPageSpinner,
  PaddedSpinner,
  SmallSpinner
} from 'components/molecules/Spinners';
import {
  TransparentView,
  WhitePaddedView
} from 'components/molecules/ViewComponents';
import { validate } from 'email-validator';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Table, Row } from 'react-native-table-component';

import {
  useCreateGuestListInviteMutation,
  useDeleteGuestListInviteMutation,
  useGetGuestListInvitesQuery,
  useSendGuestListInviteMutation,
  useSendGuestListInvitesForEntityMutation
} from 'reduxStore/services/api/guestListInvites';
import {
  CreateGuestListInviteRequest,
  GuestListInvite
} from 'types/guestListInvites';
import { useIsFocused } from '@react-navigation/native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useGetUserMinimalDetailsFromIdQuery } from 'reduxStore/services/api/user';
import PhoneContactSelector from 'components/molecules/PhoneContactSelector';
import { Modal } from 'components/molecules/Modals';
import { TextInput } from 'components/Themed';

const styles = StyleSheet.create({
  container: { paddingBottom: 50, height: '100%' },
  innerContainer: { height: '100%', flex: 0 },
  buttonWrapper: {
    marginTop: 20
  },
  tableContainer: {
    marginBottom: 20
  },
  tableContent: { flexDirection: 'row' },
  tableBorder: { borderWidth: 1 },
  tableText: {
    textAlign: 'center',
    margin: 4
  },
  tableHeaderText: {
    fontWeight: 'bold'
  },
  bottomActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  addButton: { marginTop: 10 },
  actionButton: { marginBottom: 4 }
});

const GuestListInviter = ({ entityId }: { entityId: number }) => {
  const { t } = useTranslation();
  const [createInvite, createInviteResult] = useCreateGuestListInviteMutation();
  const [usingEmail, setUsingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [showContactSelectorModal, setShowContactSelectorModal] =
    useState(false);
  const [showNewDetailsModal, setShowNewDetailsModal] = useState(false);

  return (
    <TransparentView>
      <SmallButton
        title={t('screens.guestList.selectContacts')}
        onPress={() => {
          setShowContactSelectorModal(true);
        }}
        style={styles.addButton}
      />
      <PhoneContactSelector
        open={showContactSelectorModal}
        onRequestClose={() => setShowContactSelectorModal(false)}
        onSelect={async (contact) => {
          try {
            setShowContactSelectorModal(false);
            await createInvite({
              entity: entityId,
              phone_number: contact.phoneNumber,
              name: contact.name
            });
          } catch {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
      />
      <SmallButton
        title={t('screens.guestList.inviteByPhone')}
        onPress={() => {
          setShowNewDetailsModal(true);
        }}
        style={styles.addButton}
      />
      <Modal
        boxStyle={{ width: '100%' }}
        onRequestClose={() => setShowNewDetailsModal(false)}
        visible={showNewDetailsModal}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('common.name')}
        />
        <PhoneOrEmailInput
          usingEmail={usingEmail}
          value={usingEmail ? email : phoneNumber}
          changeUsingEmail={setUsingEmail}
          onValueChange={(val) => {
            if (usingEmail) {
              setEmail(val);
            } else {
              setPhoneNumber(val);
            }
          }}
        />
        <TransparentView style={styles.buttonWrapper}>
          {createInviteResult.isLoading ? (
            <PaddedSpinner />
          ) : (
            <SmallButton
              onPress={async () => {
                const body: CreateGuestListInviteRequest = {
                  entity: entityId,
                  name
                };
                if (usingEmail) {
                  body.email = email;
                } else {
                  body.phone_number = phoneNumber;
                }
                try {
                  await createInvite(body).unwrap();
                  setEmail('');
                  setPhoneNumber('');
                  setName('');
                } catch {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
              title={t('common.add')}
              disabled={
                (usingEmail && !validate(email)) ||
                (!usingEmail && phoneNumber.length < 9) ||
                !name
              }
            />
          )}
        </TransparentView>
      </Modal>
    </TransparentView>
  );
};

const InviteActions = ({ invite }: { invite: GuestListInvite }) => {
  const { t } = useTranslation();
  const [deleteInvite, deleteInviteResult] = useDeleteGuestListInviteMutation();
  const [sendInvite, sendInviteResult] = useSendGuestListInviteMutation();

  return (
    <TransparentView style={styles.tableText}>
      {deleteInviteResult.isLoading || sendInviteResult.isLoading ? (
        <SmallSpinner />
      ) : (
        <>
          <SmallButton
            title={t('common.delete')}
            onPress={async () => {
              try {
                await deleteInvite(invite.id).unwrap();
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              }
            }}
            style={styles.actionButton}
          />
          {!invite.sent && (
            <SmallButton
              title={t('common.send')}
              onPress={async () => {
                try {
                  await sendInvite(invite.id).unwrap();
                } catch (err) {
                  Toast.show({
                    type: 'error',
                    text1: t('common.errors.generic')
                  });
                }
              }}
            />
          )}
        </>
      )}
    </TransparentView>
  );
};

const InviteRow = ({ invite }: { invite: GuestListInvite }) => {
  const { t } = useTranslation();
  const { data: userDetails, isLoading: isLoadingUserDetails } =
    useGetUserMinimalDetailsFromIdQuery(invite.user, { skip: !invite.user });
  const inviteStatus = useMemo(() => {
    if (invite.accepted) return t('common.accepted');
    if (invite.rejected) return t('common.rejected');
    if (invite.maybe) return t('common.maybe');
    if (invite.sent) {
      return t('common.pending');
    }

    return t('common.unsent');
  }, [t, invite]);

  const inviteContactDetails =
    invite.email ||
    invite.phone_number ||
    userDetails?.phone_number ||
    userDetails?.email;
  const inviteName = invite.name
    ? `${invite.name} (${inviteContactDetails})`
    : inviteContactDetails;

  return (
    <Row
      data={[inviteName, inviteStatus, <InviteActions invite={invite} />]}
      textStyle={StyleSheet.flatten([styles.tableText])}
      // @ts-ignore
      borderStyle={styles.tableBorder}
    />
  );
};

export default function GuestListPage({ entityId }: { entityId: number }) {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const [sendForEntity, sendForEntityResult] =
    useSendGuestListInvitesForEntityMutation();

  const { isLoading: isLoadingInvites, data: invites } =
    useGetGuestListInvitesQuery(undefined, {
      pollingInterval: 10000,
      skip: !isFocused
    });

  if (!invites || isLoadingInvites) {
    return <FullPageSpinner />;
  }

  const entityInvites = invites.filter((invite) => invite.entity === entityId);
  const hasUnsentInvite = entityInvites?.some((invite) => !invite.sent);

  return (
    <WhiteFullPageScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    >
      <WhitePaddedView style={styles.innerContainer}>
        {entityInvites.length > 0 && (
          <TransparentScrollView style={styles.tableContainer}>
            <Table borderStyle={styles.tableBorder}>
              <Row
                data={[t('common.invitee'), t('common.status'), '']}
                textStyle={StyleSheet.flatten([
                  styles.tableText,
                  styles.tableHeaderText
                ])}
              />
              {entityInvites.map((invite) => {
                return <InviteRow invite={invite} />;
              })}
            </Table>
            {hasUnsentInvite && (
              <TransparentView style={styles.bottomActions}>
                {sendForEntityResult.isLoading ? (
                  <SmallSpinner />
                ) : (
                  <SmallButton
                    title={t('screens.guestList.inviteAll')}
                    onPress={async () => {
                      try {
                        await sendForEntity(entityId).unwrap();
                      } catch {
                        Toast.show({
                          type: 'error',
                          text1: t('common.errors.generic')
                        });
                      }
                    }}
                  />
                )}
              </TransparentView>
            )}
          </TransparentScrollView>
        )}
        <GuestListInviter entityId={entityId} />
      </WhitePaddedView>
    </WhiteFullPageScrollView>
  );
}
