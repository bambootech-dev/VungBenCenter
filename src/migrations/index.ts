import * as migration_20261007_163610_baseline from './20261007_163610_baseline';
import * as migration_20261007_163617_lessons from './20261007_163617_lessons';
import * as migration_20261021_174608_worksheets from './20261021_174608_worksheets';
import * as migration_20261021_180934_worksheet_submissions from './20261021_180934_worksheet_submissions';
import * as migration_20261023_075749_worksheet_templates from './20261023_075749_worksheet_templates';

export const migrations = [
  {
    up: migration_20261007_163610_baseline.up,
    down: migration_20261007_163610_baseline.down,
    name: '20261007_163610_baseline',
  },
  {
    up: migration_20261007_163617_lessons.up,
    down: migration_20261007_163617_lessons.down,
    name: '20261007_163617_lessons',
  },
  {
    up: migration_20261021_174608_worksheets.up,
    down: migration_20261021_174608_worksheets.down,
    name: '20261021_174608_worksheets',
  },
  {
    up: migration_20261021_180934_worksheet_submissions.up,
    down: migration_20261021_180934_worksheet_submissions.down,
    name: '20261021_180934_worksheet_submissions',
  },
  {
    up: migration_20261023_075749_worksheet_templates.up,
    down: migration_20261023_075749_worksheet_templates.down,
    name: '20261023_075749_worksheet_templates'
  },
];
