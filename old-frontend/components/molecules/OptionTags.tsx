import { StyleSheet } from 'react-native';
import OptionTag from './OptionTag';
import { TransparentView } from './ViewComponents';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    width: '100%'
  }
});

export default function OptionTags({ tagNames }: { tagNames: string[] }) {
  return (
    <TransparentView style={styles.container}>
      {tagNames.map((tagName) => (
        <OptionTag tagName={tagName} key={tagName} />
      ))}
    </TransparentView>
  );
}
