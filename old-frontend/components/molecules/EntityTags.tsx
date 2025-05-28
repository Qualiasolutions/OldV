import { StyleSheet } from 'react-native';
import EntityTag from './EntityTag';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    width: '100%'
  }
});

export default function EntityTags({ entities }: { entities: number[] }) {
  return (
    <TransparentView style={styles.container}>
      {entities.map((entity) => (
        <EntityTag entity={entity} key={entity} />
      ))}
    </TransparentView>
  );
}
