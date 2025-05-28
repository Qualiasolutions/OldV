import { ContentTabScreenProps } from 'types/base';
import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import EntityTypeNavigator from 'navigation/EntityTypeNavigator';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityTypeName } from 'types/entities';
import { TransparentContainerView } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  useCreateEntityTypeSetupCompletionMutation,
  useGetEntityTypeSetupCompletionsQuery
} from 'reduxStore/services/api/user';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Button } from 'components/molecules/ButtonComponents';
import { Text } from 'components/Themed';

const SETUP_TEXT_PAGES: {
  [key in EntityTypeName]?: string[];
} = {
  SocialPlan: [
    "The Social subcategory allows users to better organise important social activities. Some entities that you might add include 1:1 time with a Family Member, Family Days Out, Supper Club, A Child's Social days if you schedule social activities for young children.",
    'In addition to the tasks and due dates you can add, there are References and List templates to help.'
  ],
  SocialMedia: [
    'The Social Media subcategory allows users to better organise posts on social media. You can set up an entity for each platform eg Instagram, TikTok etc or based on person/people. “My and my kids” versus “My social interests”',
    'In addition to the tasks and due dates you can add, there are References and List templates to help.'
  ],
  Event: [
    'The Events subcategory allows users to better organise Events during the year. All Events for the year will be listed and added to the calendar.',
    'When it is time to start planning, use the subcategory to plan location, food, activities. You can even send invites to a shared guest list and manage RSVPs. In addition to the tasks and due dates, there are References, List templates and Shopping lists to help.'
  ],
  Hobby: [
    'The Interests & Hobbies subcategory allows users to plan and manage the time spent on interests and hobbies. This might be setting aside time to read each day or doing weekend hobbies like sailing or football.',
    'In addition to the tasks, appointments and due dates that are added to the calendar, there are References and List templates to help.'
  ]
};

const setupPagesStyles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start'
  },
  button: { marginTop: 20 }
});

const SetupPages = ({
  pages,
  entityType
}: {
  pages: string[];
  entityType: EntityTypeName;
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: userDetails } = useGetUserFullDetails();
  const [createEntityTypeCompletion, createEntityTypeCompletionResult] =
    useCreateEntityTypeSetupCompletionMutation();

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentContainerView style={setupPagesStyles.container}>
      <Text>{pages[currentPage]}</Text>
      {createEntityTypeCompletionResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={() => {
            if (currentPage === pages.length - 1) {
              createEntityTypeCompletion({
                user: userDetails.id,
                entity_type: entityType
              });
            } else {
              setCurrentPage(currentPage + 1);
            }
          }}
          title={t('common.continue')}
          style={setupPagesStyles.button}
        />
      )}
    </TransparentContainerView>
  );
};

type EntityListScreenProps = ContentTabScreenProps<'EntityList'>;

export default function EntityListScreen({ route }: EntityListScreenProps) {
  useEntityTypeHeader(route.params.entityTypeName);
  const { data: setupCompletions, isFetching: isFetchingSetupCompletions } =
    useGetEntityTypeSetupCompletionsQuery(undefined);

  if (!setupCompletions || isFetchingSetupCompletions) {
    return <FullPageSpinner />;
  }

  const entityTypes = route.params.entityTypes;
  const setupPages = SETUP_TEXT_PAGES[entityTypes[0]];
  if (
    setupPages &&
    !setupCompletions
      .map((completion) => completion.entity_type)
      .includes(entityTypes[0])
  ) {
    return <SetupPages pages={setupPages} entityType={entityTypes[0]} />;
  }

  return (
    <EntityTypeNavigator
      entityTypes={entityTypes}
      entityTypeName={route.params.entityTypeName}
    />
  );
}
