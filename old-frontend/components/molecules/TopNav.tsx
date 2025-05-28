import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TransparentView, WhitePaddedView } from './ViewComponents';
import { elevation } from 'styles/elevation';
import { Text, useThemeColor, View } from 'components/Themed';
import { Feather } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from 'types/base';
import { TouchableOpacity } from './TouchableOpacityComponents';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectHasUnreadAlert } from 'reduxStore/slices/alerts/selectors';
import { selectFilteredOverdueTasks } from 'reduxStore/slices/tasks/selectors';
import {
  selectHasUnrespondedEvent,
  selectHasUnseenActivity
} from 'reduxStore/slices/misc/selectors';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    justifyContent: 'space-between',
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  rightButtons: {
    flexDirection: 'row',
    paddingRight: 10,
    paddingTop: 10
  },
  myAccountSize: {
    height: 50,
    width: 50,
    borderRadius: 15
  },
  drawerPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible'
  },
  myAccountNullImage: {
    height: 24,
    width: 24
  },
  button: {
    marginLeft: 16,
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 10
  },
  linkMarker: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: 0,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'brown'
  }
});

const PageLink = ({
  pageName,
  iconName,
  title,
  marked
}: {
  pageName: keyof RootTabParamList;
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  marked?: boolean;
}) => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate(pageName);
      }}
      style={styles.button}
    >
      <Feather name={iconName} size={24} color={primaryColor} />
      <Text style={[styles.buttonText, { color: primaryColor }]}>{title}</Text>
      {marked && <View style={styles.linkMarker} />}
    </TouchableOpacity>
  );
};

export default function TopNav() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const primaryColor = useThemeColor({}, 'primary');
  const { t } = useTranslation();
  const hasUnreadAlert = useSelector(selectHasUnreadAlert);
  const overdueTasks = useSelector(selectFilteredOverdueTasks);
  const hasUnseenActivity = useSelector(selectHasUnseenActivity);
  const hasUnrespondedEvent = useSelector(selectHasUnrespondedEvent);

  return (
    <WhitePaddedView style={[styles.container, elevation.elevated]}>
      <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
        <Feather name="align-justify" size={32} color={primaryColor} />
      </TouchableOpacity>
      <TransparentView style={styles.rightButtons}>
        <PageLink
          pageName="Alerts"
          iconName="alert-triangle"
          title={t('pageTitles.alerts')}
          marked={hasUnreadAlert}
        />
        <PageLink
          pageName="NewItems"
          iconName="bell"
          title={t('pageTitles.newItems')}
          // marked={hasUnseenActivity}
        />
        <PageLink
          pageName="QuickJot"
          iconName="edit"
          title={t('pageTitles.quickJot')}
        />
        <PageLink
          pageName="OverdueTasks"
          iconName="flag"
          title={t('pageTitles.overdue')}
          marked={overdueTasks && overdueTasks.length > 0}
        />
        <PageLink
          pageName="Events"
          iconName="star"
          title={t('pageTitles.events')}
          marked={hasUnrespondedEvent}
        />
      </TransparentView>
    </WhitePaddedView>
  );
}
