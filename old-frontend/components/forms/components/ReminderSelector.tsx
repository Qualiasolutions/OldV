import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Reminder } from 'types/tasks';
import TimedeltaSelector, { TimeDeltaObject } from './TimedeltaSelector';

type TaskReminderFields = Pick<Reminder, 'timedelta'>;

export default function ReminderSelector({
  value,
  onChange
}: {
  value: TaskReminderFields[];
  onChange: (actions: TaskReminderFields[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const changeHandler = (timedeltas: TimeDeltaObject[]) =>
    onChange(timedeltas.map((td) => ({ timedelta: td.timedelta })));

  return (
    <TimedeltaSelector
      value={value.map((action) => ({ timedelta: action.timedelta }))}
      onChange={changeHandler}
      placeholder={t('components.reminderSelector.placeholder')}
      intervalTypes={['MINUTE', 'HOUR', 'DAY', 'WEEK']}
      open={open}
      setOpen={setOpen}
      max={3}
    />
  );
}
