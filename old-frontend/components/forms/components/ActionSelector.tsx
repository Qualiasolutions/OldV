import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskAction } from 'types/taskActions';
import TimedeltaSelector from './TimedeltaSelector';

type TaskActionFields = Pick<TaskAction, 'action_timedelta'>;

export default function ActionSelector({
  value,
  onChange
}: {
  value: TaskActionFields[];
  onChange: (actions: TaskActionFields[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <TimedeltaSelector
      value={value.map((action) => ({ timedelta: action.action_timedelta }))}
      onChange={(timedeltas) =>
        onChange(timedeltas.map((td) => ({ action_timedelta: td.timedelta })))
      }
      placeholder={t('components.actionSelector.placeholder')}
      intervalTypes={['DAY', 'WEEK']}
      open={open}
      setOpen={setOpen}
      max={3}
    />
  );
}
