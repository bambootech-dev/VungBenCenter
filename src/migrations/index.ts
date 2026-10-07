import * as migration_20261007_163610_baseline from './20261007_163610_baseline';
import * as migration_20261007_163617_lessons from './20261007_163617_lessons';

export const migrations = [
  {
    up: migration_20261007_163610_baseline.up,
    down: migration_20261007_163610_baseline.down,
    name: '20261007_163610_baseline',
  },
  {
    up: migration_20261007_163617_lessons.up,
    down: migration_20261007_163617_lessons.down,
    name: '20261007_163617_lessons'
  },
];
