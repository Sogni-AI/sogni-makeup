import { useEffect, useState } from 'react';

function isDataEntity(entity: unknown): entity is { on: (...args: unknown[]) => unknown; off: (...args: unknown[]) => unknown } {
  return (
    entity !== null &&
    typeof entity === 'object' &&
    'on' in entity &&
    'off' in entity
  );
}

function useEntity<E, V>(entity: E, getter: (entity: E) => V): V {
  const [value, setValue] = useState(getter(entity));

  useEffect(() => {
    setValue(getter(entity));
    if (!isDataEntity(entity)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (entity as any).on('updated', () => {
      setValue(getter(entity));
    });

    return unsubscribe;
  }, [entity, getter]);

  return value;
}

export default useEntity;
