import type { Database } from 'sql.js';

export type AnkiVersion = {
  era: 'Anki 1.x' | 'Anki 2.0/2.1 (Legacy)' | 'Anki 2.1 (Modern)' | 'Anki 2.1+ (Current)';
  collectionVersion: number;
  schemaModTime: number;
  hasNotesTable: boolean;
  hasFactsTable: boolean;
  hasGravesTable: boolean;
  hasDeckConfigTable: boolean;
  hasModelsColumn: boolean;
  details: string;
};

/**
 * Analyze SQLite database schema to determine Anki version
 */
export function analyzeAnkiDatabase(db: Database): AnkiVersion {
  // Check for tables
  const tables = getTableNames(db);
  const hasNotesTable = tables.includes('notes');
  const hasFactsTable = tables.includes('facts');
  const hasGravesTable = tables.includes('graves');
  const hasDeckConfigTable = tables.includes('deck_config');

  // Anki 1.x check
  if (hasFactsTable && !hasNotesTable) {
    return {
      era: 'Anki 1.x',
      collectionVersion: 0,
      schemaModTime: 0,
      hasNotesTable: false,
      hasFactsTable: true,
      hasGravesTable: false,
      hasDeckConfigTable: false,
      hasModelsColumn: false,
      details: 'Legacy Anki 1.x format with facts-based structure. Pre-2012. Incompatible with modern clients.',
    };
  }

  // Get collection metadata
  const colData = getCollectionMetadata(db);
  const hasModelsColumn = colData.hasModelsColumn;

  // Determine era based on version
  let era: AnkiVersion['era'];
  let details: string;

  if (colData.ver === 11) {
    era = 'Anki 2.0/2.1 (Legacy)';
    details = `Collection version 11. Uses V1 scheduler. Models and deck configs stored as JSON in col table. ${hasGravesTable ? 'Has sync support (graves table).' : ''}`;
  } else if (colData.ver >= 14 && colData.ver <= 16) {
    era = 'Anki 2.1 (Modern)';
    details = `Collection version ${colData.ver}. Introduced V2/V3 schedulers. ${hasDeckConfigTable ? 'Uses deck_config table for optimized storage.' : 'Still uses JSON blobs in col table.'}`;
  } else if (colData.ver >= 18) {
    era = 'Anki 2.1+ (Current)';
    details = `Collection version ${colData.ver}. Latest version (23.10+). Rust backend with FSRS scheduling support. Optimized schema with ${hasDeckConfigTable ? 'deck_config table' : 'legacy storage'}.`;
  } else {
    era = 'Anki 2.0/2.1 (Legacy)';
    details = `Collection version ${colData.ver}. Version between legacy and modern eras.`;
  }

  return {
    era,
    collectionVersion: colData.ver,
    schemaModTime: colData.scm,
    hasNotesTable,
    hasFactsTable,
    hasGravesTable,
    hasDeckConfigTable,
    hasModelsColumn,
    details,
  };
}

/**
 * Get list of table names in the database
 */
function getTableNames(db: Database): string[] {
  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (result.length === 0) {
    return [];
  }

  return result[0].values.map(row => row[0] as string);
}

/**
 * Get collection metadata from the col table
 */
function getCollectionMetadata(db: Database): {
  ver: number;
  scm: number;
  hasModelsColumn: boolean;
} {
  try {
    // Check if models column exists
    const columnsResult = db.exec("PRAGMA table_info(col)");
    const columns = columnsResult.length > 0 ? columnsResult[0].values.map(row => row[1] as string) : [];
    const hasModelsColumn = columns.includes('models');

    // Get ver and scm
    const result = db.exec("SELECT ver, scm FROM col LIMIT 1");
    if (result.length === 0 || result[0].values.length === 0) {
      return { ver: 0, scm: 0, hasModelsColumn };
    }

    const row = result[0].values[0];
    return {
      ver: row[0] as number,
      scm: row[1] as number,
      hasModelsColumn,
    };
  } catch (error) {
    console.error('Error reading collection metadata:', error);
    return { ver: 0, scm: 0, hasModelsColumn: false };
  }
}
