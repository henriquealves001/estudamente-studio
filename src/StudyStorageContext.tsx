import { createContext, useContext } from 'react';
import type { StudyStorage } from './accountStorage';
export const StudyStorageContext = createContext<{ local: StudyStorage; session: StudyStorage } | null>(null);
export function useStudyStorage(kind: 'local' | 'session' = 'local') {
  const context = useContext(StudyStorageContext);
  if (!context) throw Error('Espaço de estudo indisponível.');
  return context[kind];
}
