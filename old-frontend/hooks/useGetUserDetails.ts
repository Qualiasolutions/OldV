import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  selectLoadingReduxUserDetails,
  selectReduxUserDetails
} from 'reduxStore/slices/users/selectors';

export default function useGetUserFullDetails() {
  const isLoadingUserDetails = useSelector(selectLoadingReduxUserDetails);
  const userDetails = useSelector(selectReduxUserDetails);

  return useMemo(() => {
    return {
      data: userDetails,
      isLoading: isLoadingUserDetails
    };
  }, [userDetails, isLoadingUserDetails]);
}
