import { useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

export function Autosave({
  experimentData,
  saveDataToDb
}: {
  experimentData: any;
  saveDataToDb(args: any): void;
}) {
  const debouncedSave = useCallback(
    debounce(async (experimentData: any) => {
      await saveDataToDb(experimentData);
    }, 2000),
    []
  );

  useEffect(() => {
    if (experimentData) {
      debouncedSave(experimentData);
    }
  }, [experimentData, debouncedSave]);

  return null;
}
