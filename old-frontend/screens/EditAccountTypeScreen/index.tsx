import { Button } from 'components/molecules/ButtonComponents';
import SafePressable from 'components/molecules/SafePressable';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  PageSubtitle,
  PageTitle,
  PrimaryText
} from 'components/molecules/TextComponents';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { useGetAllSubscriptionsQuery } from 'reduxStore/services/api/subscriptions';
import { Text } from 'components/Themed';

const vuetWebUrl = Constants.expoConfig?.extra?.vuetWebUrl;
const stripeCustomerPortalUrl =
  Constants.expoConfig?.extra?.stripeCustomerPortalUrl;

const FamilyMemberName = ({ userId }: { userId: number }) => {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserFullDetails();
  const planOwner = userDetails?.family.users.find(
    (user) => user.id === userId
  );

  return (
    <Text>
      {t('screens.editAccountType.ownedBy')} {planOwner?.first_name}{' '}
      {planOwner?.last_name}
    </Text>
  );
};

export function EditAccountTypeScreen() {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserFullDetails();
  const { data: subscriptions } = useGetAllSubscriptionsQuery(
    userDetails?.id || -1,
    {
      skip: !userDetails,
      pollingInterval: 10000
    }
  );

  const loading = !userDetails || !subscriptions;
  if (loading) {
    return <FullPageSpinner />;
  }

  const firstSubscription = subscriptions.length > 0 ? subscriptions[0] : null;

  const renewalDate = firstSubscription
    ? new Date(firstSubscription.current_period_end * 1000).toDateString()
    : null;

  return (
    <TransparentPaddedView>
      {firstSubscription ? (
        <TransparentView>
          <PageTitle
            text={`${t('screens.editAccountType.currentAccountType')}: ${
              firstSubscription.is_family
                ? t('screens.editAccountType.familyPlan')
                : t('screens.editAccountType.premiumPlan')
            }`}
          />
          {firstSubscription.user !== userDetails.id && (
            <TransparentView>
              <FamilyMemberName userId={firstSubscription.user} />
            </TransparentView>
          )}
          <PageSubtitle
            text={`${
              firstSubscription.cancel_at_period_end
                ? t('screens.editAccountType.willCancelOn')
                : t('screens.editAccountType.renewsOn')
            } ${renewalDate}`}
          />
          <SafePressable
            onPress={() => {
              Linking.openURL(
                `${stripeCustomerPortalUrl}?prefilled_email=${firstSubscription.customer_email}`
              );
            }}
          >
            <PrimaryText text={t('screens.editAccountType.changePlan')} />
          </SafePressable>
        </TransparentView>
      ) : (
        <TransparentView>
          <PageTitle
            text={`${t('screens.editAccountType.currentAccountType')}: ${t(
              'screens.editAccountType.standardPlan'
            )}`}
          />
          <PageSubtitle text={t('screens.editAccountType.upgradeNow')} />
          <PageSubtitle text="..." />
          <Button
            title={t('screens.editAccountType.upgrade')}
            onPress={() => {
              Linking.openURL(vuetWebUrl);
            }}
          />
        </TransparentView>
      )}
    </TransparentPaddedView>
  );
}
