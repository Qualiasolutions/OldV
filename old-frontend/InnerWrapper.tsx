import { FullPageSpinner } from 'components/molecules/Spinners';
import useSyncUserDetails from 'hooks/useSyncUserDetails';
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectLoadingReduxUserDetails } from 'reduxStore/slices/users/selectors';

export default function InnerWrapper({ children }: { children: ReactNode }) {
  useSyncUserDetails();
  const loading = useSelector(selectLoadingReduxUserDetails);

  if (loading) {
    return <FullPageSpinner />;
  }

  return <>{children}</>;
}
