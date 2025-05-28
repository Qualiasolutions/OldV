import { Text, View } from 'components/Themed';
import { StyleSheet, ViewStyle } from 'react-native';

const styles = StyleSheet.create({
  premiumTag: {
    backgroundColor: '#FFC700',
    padding: 5,
    margin: 5,
    borderRadius: 5
  },
  premiumTagText: {
    fontSize: 10,
    color: 'white'
  }
});

export default function PremiumTag({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.premiumTag, style]}>
      <Text style={styles.premiumTagText}>Premium</Text>
    </View>
  );
}
