import {
  AlmostBlackText,
  LightBlackText
} from 'components/molecules/TextComponents';
import { WhiteBox } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import {
  getDateWithoutTimezone,
  getLongDateFromDateObject
} from 'utils/datesAndTimes';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from 'components/Themed';
import { EntityResponseType } from 'types/entities';
import SafePressable from 'components/molecules/SafePressable';

export default function DaysOffCard({
  entity
}: {
  entity: EntityResponseType;
}) {
  const styles = StyleSheet.create({
    card: {
      marginTop: 10,
      alignItems: 'center',
      borderColor: useThemeColor({}, 'almostBlack')
    },
    listEntryText: {
      fontSize: 20
    }
  });

  const startDateString = getLongDateFromDateObject(
    getDateWithoutTimezone(entity?.start_date)
  );
  const endDateString = getLongDateFromDateObject(
    getDateWithoutTimezone(entity?.end_date)
  );

  const navigation = useNavigation();

  return (
    <SafePressable
      onPress={() => {
        (navigation as any).push('EntityScreen', { entityId: entity.id });
      }}
    >
      <WhiteBox style={styles.card}>
        <LightBlackText text={entity.name || ''} style={styles.listEntryText} />
        <AlmostBlackText
          style={{ fontSize: 18 }}
          text={`${startDateString} - ${endDateString}`}
        />
      </WhiteBox>
    </SafePressable>
  );
}
