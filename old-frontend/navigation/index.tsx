import { NavigationContainer } from '@react-navigation/native';
import { ColorSchemeName } from 'react-native';

import LinkingConfiguration from './LinkingConfiguration';

import { useDispatch, useSelector } from 'react-redux';
import {
  selectAccessToken,
  selectRefreshToken
} from 'reduxStore/slices/auth/selectors';

import { UnauthorisedNavigator } from './UnauthorisedNavigator';
import { SetupNavigator } from './SetupNavigator';
import { FamilyRequestNavigator } from './FamilyRequestNavigator';
import { DarkTheme, DefaultTheme } from 'constants/Colors';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { SideNavigator } from './SideNavigator';
import useActiveInvitesForUser from 'headers/hooks/useActiveInvitesForUser';
import ListItemActionModal from 'components/molecules/ListItemActionModal';
import {
  useGetAllSchoolBreaksQuery,
  useGetAllSchoolTermsQuery,
  useGetAllSchoolYearsQuery
} from 'reduxStore/services/api/schoolTerms';
import PremiumModal from 'components/molecules/PremiumModal';
import { selectFiltersModalOpen } from 'reduxStore/slices/calendars/selectors';
import { setFiltersModalOpen } from 'reduxStore/slices/calendars/actions';
import FiltersModal from 'components/organisms/FiltersModal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

interface NavigationProps {
  colorScheme: ColorSchemeName;
}

const Navigation = ({ colorScheme }: NavigationProps) => {
  const [hasJustSignedUp, setHasJustSignedUp] = useState(false);
  const jwtAccessToken = useSelector(selectAccessToken);
  const jwtRefreshToken = useSelector(selectRefreshToken);

  const dispatch = useDispatch();
  const { data: userFullDetails, isLoading: isLoadingUserDetails } =
    useGetUserFullDetails();
  const { data: invitesForUser, isLoading: isLoadingInvitesForUser } =
    useActiveInvitesForUser(true);

  // Force fetch of categories on app load
  useGetAllCategoriesQuery(undefined, { skip: !userFullDetails?.id });

  // Force fetch of School Years etc
  useGetAllSchoolYearsQuery(undefined, { skip: !userFullDetails?.id });
  useGetAllSchoolTermsQuery(undefined, { skip: !userFullDetails?.id });
  useGetAllSchoolBreaksQuery(undefined, { skip: !userFullDetails?.id });

  const firstInviteForUser =
    invitesForUser && invitesForUser.length > 0 ? invitesForUser[0] : null;

  useEffect(() => {
    // If user logs out then set to false
    if (!userFullDetails) {
      setHasJustSignedUp(false);
    }

    if (userFullDetails && !userFullDetails.has_done_setup) {
      setHasJustSignedUp(true);
    }
  }, [userFullDetails]);

  const navigatorComponent = useMemo(() => {
    let component = <FullPageSpinner />;

    const isLoading = isLoadingUserDetails || isLoadingInvitesForUser;

    if (!isLoading) {
      if (!(jwtAccessToken && jwtRefreshToken)) {
        component = <UnauthorisedNavigator />;
      } else {
        if (firstInviteForUser) {
          component = <FamilyRequestNavigator />;
        } else if (userFullDetails && !userFullDetails.has_done_setup) {
          component = <SetupNavigator />;
        } else {
          component = <SideNavigator hasJustSignedUp={hasJustSignedUp} />;
        }
      }
    }

    return component;
  }, [
    firstInviteForUser,
    hasJustSignedUp,
    isLoadingInvitesForUser,
    isLoadingUserDetails,
    jwtAccessToken,
    jwtRefreshToken,
    userFullDetails
  ]);

  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      {navigatorComponent}
    </NavigationContainer>
  );
};

export default Navigation;
