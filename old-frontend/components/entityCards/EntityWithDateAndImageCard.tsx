import { WhiteBox } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from 'components/Themed';
import { EntityResponseType } from 'types/entities';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import EntityWithDateAndImageData from 'components/molecules/EntityWithDateAndImageData';

type Props = {
  entity: EntityResponseType;
  startDateField: string;
  endDateField: string;
  utc: boolean;
};
export default function EntityWithDateAndImageCard({
  entity,
  startDateField,
  endDateField,
  utc
}: Props) {
  const styles = StyleSheet.create({
    card: {
      marginTop: 10,
      borderColor: useThemeColor({}, 'almostBlack')
    }
  });

  const navigation = useNavigation();

  return (
    <WhiteBox style={styles.card}>
      <TouchableOpacity
        onPress={() => {
          (navigation as any).navigate('EntityScreen', { entityId: entity.id });
        }}
      >
        <EntityWithDateAndImageData
          entity={entity}
          startDateField={startDateField}
          endDateField={endDateField}
          utc={utc}
        />
      </TouchableOpacity>
    </WhiteBox>
  );
}
