import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ListLink from 'components/molecules/ListLink';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import { StyleSheet } from 'react-native';
import SafePressable from 'components/molecules/SafePressable';
import { ScheduledTaskResponseType } from 'types/tasks';
import { getUTCValuesFromDateString } from 'utils/datesAndTimes';

const styles = StyleSheet.create({
  container: {
    marginBottom: 0
  },
  noEntitiesText: {
    fontSize: 20,
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 27,
    fontWeight: '700'
  },
  showOlderWrapper: {
    padding: 20,
    paddingBottom: 0
  },
  showOlderText: {
    fontSize: 20
  },
  showNewerText: {
    fontSize: 20
  }
});

function DefaultLink({ task }: { task: ScheduledTaskResponseType }) {
  return (
    <ListLink
      text={task.title || ''}
      toScreen="EditTask"
      toScreenParams={{ taskId: task.id }}
      navMethod="push"
    />
  );
}

type DatedTaskListPageProps = {
  tasks: ScheduledTaskResponseType[];
  card?: ({ task }: { task: ScheduledTaskResponseType }) => JSX.Element | null;
};

export default function DatedTaskListPage({
  card,
  tasks
}: DatedTaskListPageProps) {
  const { t } = useTranslation();
  const [monthsBack, setMonthsBack] = useState(0);
  const [monthsAhead, setMonthsAhead] = useState(12);

  const [previousEntityData, datetimeFilteredEntityData, futureEntityData] =
    useMemo(() => {
      const earliestDate = new Date();
      earliestDate.setMonth(earliestDate.getMonth() - monthsBack);

      const latestDate = new Date();
      latestDate.setMonth(latestDate.getMonth() + monthsAhead);

      const prev = tasks.filter((task) => {
        const taskStartDate = task.date || task.start_date;
        return taskStartDate && new Date(taskStartDate) < earliestDate;
      });
      const future = tasks.filter((task) => {
        const taskStartDate = task.date || task.start_date;
        return taskStartDate && new Date(taskStartDate) > latestDate;
      });

      const datetimeFiltered = tasks.filter((task) => {
        return ![...prev, ...future].includes(task);
      });

      return [prev, datetimeFiltered, future];
    }, [monthsBack, monthsAhead, tasks]);

  const sections = {} as { [key: string]: ScheduledTaskResponseType[] };

  for (const task of datetimeFilteredEntityData) {
    const taskStartDate = task.date || task.start_date;
    if (taskStartDate) {
      const sectionName = taskStartDate.slice(0, 7);
      if (sections[sectionName]) {
        sections[sectionName].push(task);
      } else {
        sections[sectionName] = [task];
      }
    }
  }

  const listLinks = Object.keys(sections)
    .sort()
    .map((key, i) => {
      const { monthName, year } = getUTCValuesFromDateString(`${key}-01`);
      const sectionTitle = `${monthName} ${year}`;
      const sectionTasks = sections[key].sort((a, b) => {
        const aDate = a.date || a.start_date || '1000-01-01';
        const bDate = b.date || b.start_date || '1000-01-01';

        return aDate < bDate ? -1 : 1;
      });
      return (
        <TransparentView key={i}>
          <AlmostBlackText style={styles.sectionTitle} text={sectionTitle} />
          {sectionTasks.map((task) => {
            const Link = card || DefaultLink;
            return <Link key={task.id} task={task} />;
          })}
        </TransparentView>
      );
    });

  const showPreviousButton = monthsBack < 24 &&
    previousEntityData.length > 0 && (
      <SafePressable
        onPress={() => setMonthsBack(monthsBack + 6)}
        style={styles.showOlderWrapper}
      >
        <AlmostBlackText
          text={t('components.calendar.showOlderEvents')}
          style={styles.showOlderText}
        />
      </SafePressable>
    );

  const showFutureButton = monthsAhead < 36 && futureEntityData.length > 0 && (
    <SafePressable
      onPress={() => setMonthsAhead(monthsAhead + 6)}
      style={styles.showOlderWrapper}
    >
      <AlmostBlackText
        text={t('components.calendar.showNewerEvents')}
        style={styles.showNewerText}
      />
    </SafePressable>
  );

  if (listLinks.length === 0) {
    return null;
  }

  return (
    <TransparentView>
      <TransparentPaddedView style={styles.container}>
        {showPreviousButton}
        {listLinks}
        {showFutureButton}
      </TransparentPaddedView>
    </TransparentView>
  );
}
