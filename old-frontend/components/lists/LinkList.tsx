import React from 'react';
import {
  ContentTabParamList,
  RootTabParamList,
  SettingsTabParamList
} from 'types/base';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useTranslation } from 'react-i18next';
import ListLink from 'components/molecules/ListLink';
import { StyleSheet, ViewStyle } from 'react-native';

export type LinkListLink = {
  name: string;
  navMethod: 'push' | 'navigate';
  toScreen: string;
  toScreenParams: any;
};

type Props = {
  links: LinkListLink[];
  linkStyle?: ViewStyle;
};

export default function LinkList({ links, linkStyle }: Props) {
  const { t } = useTranslation();

  const listLinks = links?.map((link) => {
    return (
      <ListLink
        text={t(`linkTitles.${link.name}`)}
        key={link.name}
        navMethod={(link.navMethod || 'push') as 'navigate' | 'push'}
        toScreen={
          link.toScreen as
            | keyof ContentTabParamList
            | keyof RootTabParamList
            | keyof SettingsTabParamList
        }
        toScreenParams={link.toScreenParams}
        style={linkStyle || {}}
      />
    );
  });

  return <TransparentView>{listLinks}</TransparentView>;
}
