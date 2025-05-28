import { TransparentView } from 'components/molecules/ViewComponents';
import { HeaderTitle } from '@react-navigation/elements';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { View } from 'components/Themed';
import { StyleSheet } from 'react-native';
import { DrawerHeaderProps } from '@react-navigation/drawer';

type Props = DrawerHeaderProps & { height?: number };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sideSections: {
    width: 50,
    backgroundColor: 'transparent'
  }
});

const TransparentDrawerHeader = (props: Props) => {
  const height = props.height || 160;

  return (
    <TransparentView style={{ height: height }}>
      <TransparentView style={styles.container}>
        <View style={styles.sideSections}>
          <DrawerToggleButton tintColor={props.options.headerTintColor} />
        </View>
        <HeaderTitle
          tintColor={props.options.headerTintColor}
          style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
        >
          {props.options.title}
        </HeaderTitle>
        <View style={styles.sideSections}>
          {props.options.headerRight ? props.options.headerRight({}) : null}
        </View>
      </TransparentView>
    </TransparentView>
  );
};

export default TransparentDrawerHeader;
