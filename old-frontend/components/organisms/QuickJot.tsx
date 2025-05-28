import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { useSelector } from 'react-redux';
import { selectEntitiesByEntityTypes } from 'reduxStore/slices/entities/selectors';
import ListEntityPage from 'screens/EntityPages/EntityScreens/components/ListEntityPage';

export default function QuickJot() {
  const listEntityIds = useSelector(selectEntitiesByEntityTypes(['List']));

  if (listEntityIds.length === 0) {
    return null;
  }

  const firstListId = listEntityIds[0];

  return (
    <WhiteFullPageScrollView>
      <ListEntityPage entityId={firstListId} hideHeader={true} />
    </WhiteFullPageScrollView>
  );
}
