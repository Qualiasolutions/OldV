import React, { useEffect, useState } from 'react';

import { Image, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Button } from 'components/molecules/ButtonComponents';

import { PageTitle, PageSubtitle } from 'components/molecules/TextComponents';
import { AlmostWhiteContainerView } from 'components/molecules/ViewComponents';
import { ErrorBox } from 'components/molecules/Errors';
import { useUpdateUserDetailsMutation } from 'reduxStore/services/api/user';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { PaddedSpinner } from 'components/molecules/Spinners';

const styles = StyleSheet.create({
  confirmButton: {
    marginTop: 30,
    marginBottom: 15
  },
  tickIcon: {
    height: 50,
    width: 50,
    marginBottom: 40
  }
});

const setupTextPages = [
  `
Our app is meant to provide a way to organise task, appointments, due dates, references, lists all in one place.

In order to do this, users must first set up entities within each category they would like to stay organised in. Social, Transport, Travel, Pets, Health & Beauty, Education & Career, Finance or Home & Garden.
  `,
  `
All items entered into the app must be tagged to one or more of these entities.

This allows organisation, communication and always being up to date!
  `,
  `
To make everything straightforward, all of these category tasks come together on the Home screen!

Premium users will be able to see which items have been completed and have access to Routines, Flexible scheduling, Smart Scheduling with Preferred and Blocked Days snd more.
  `,
  `
To get started, choose a Category and start adding. Each Category will have ideas of how we can help you stay on top of items, plan ahead and not miss deadlines.
  `
];

const WelcomeToVuetScreen = () => {
  const { data: userFullDetails } = useGetUserFullDetails();
  const [pageNumber, setPageNumber] = useState(0);
  const [isShowingSetupText, setIsShowingSetupText] = useState(false);

  const [updateUserDetails, updateUserDetailsResult] =
    useUpdateUserDetailsMutation();

  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const { t } = useTranslation();

  useEffect(() => {
    if (updateUserDetailsResult.error) {
      setErrorMessage(t('common.errors.generic'));
    }
  }, [t, updateUserDetailsResult]);

  const errorContent = errorMessage ? (
    <ErrorBox errorText={errorMessage} />
  ) : null;

  return (
    <AlmostWhiteContainerView>
      {isShowingSetupText ? (
        <>
          <PageSubtitle text={setupTextPages[pageNumber]} />
          {updateUserDetailsResult.isLoading ? (
            <PaddedSpinner />
          ) : (
            <Button
              title={t('common.continue')}
              onPress={() => {
                if (pageNumber === setupTextPages.length - 1) {
                  if (userFullDetails?.id) {
                    updateUserDetails({
                      user_id: userFullDetails?.id,
                      has_done_setup: true
                    });
                  }
                } else {
                  setPageNumber(pageNumber + 1);
                }
              }}
              style={styles.confirmButton}
            />
          )}
        </>
      ) : (
        <>
          <Image
            source={require('../../assets/images/icons/tick-circle.png')}
            style={styles.tickIcon}
          />
          <PageTitle
            text={t('screens.welcomeToVuet.title', {
              name: userFullDetails?.first_name
            })}
          />
          <PageSubtitle text={t('screens.welcomeToVuet.createdSuccessfully')} />
          {errorContent}
          <Button
            title={t('common.continue')}
            onPress={() => {
              setIsShowingSetupText(true);
            }}
            style={styles.confirmButton}
          />
        </>
      )}
    </AlmostWhiteContainerView>
  );
};

export default WelcomeToVuetScreen;
