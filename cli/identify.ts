#!/usr/bin/env node

/**
 * Anki File Identifier CLI Tool
 *
 * Identifies and analyzes Anki file formats by inspecting:
 * - Magic bytes / file signatures
 * - SQLite schema versions
 * - Compression formats (ZIP, Zstandard)
 *
 * Usage: npm run identify <file-path>
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import initSqlJs from 'sql.js';
import { identifyFileFormat, bufferToHex } from './utils/magicBytes.js';
import { analyzeAnkiDatabase } from './utils/sqliteAnalysis.js';
import { BlobReader, ZipReader, BlobWriter } from '@zip-js/zip-js';
import { decompressZstd } from './utils/zstdNode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type IdentificationResult = {
  fileName: string;
  fileSize: number;
  containerFormat: string;
  magicBytes: string;
  ankiFormat?: {
    era: string;
    version: number;
    details: string;
    tableStructure: {
      hasNotesTable: boolean;
      hasFactsTable: boolean;
      hasGravesTable: boolean;
      hasDeckConfigTable: boolean;
      hasModelsColumn: boolean;
    };
  };
  zipContents?: string[];
  errors?: string[];
};

async function identifyAnkiFile(filePath: string): Promise<IdentificationResult> {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  // Read file into buffer
  const buffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(buffer);

  // Identify container format
  const format = identifyFileFormat(uint8Array);
  const magicBytes = bufferToHex(uint8Array);

  const result: IdentificationResult = {
    fileName,
    fileSize,
    containerFormat: format.description,
    magicBytes,
    errors: [],
  };

  try {
    switch (format.type) {
      case 'zip':
        await analyzeZipFile(uint8Array, result);
        break;
      case 'sqlite3':
        await analyzeSQLiteFile(uint8Array, result);
        break;
      case 'zstd':
        await analyzeZstdFile(uint8Array, result);
        break;
      default:
        result.errors?.push('Unknown file format - unable to analyze further');
    }
  } catch (error) {
    result.errors?.push(`Analysis error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

async function analyzeZipFile(buffer: Uint8Array, result: IdentificationResult): Promise<void> {
  const blob = new Blob([buffer]);
  const zipReader = new ZipReader(new BlobReader(blob));
  const entries = await zipReader.getEntries();

  result.zipContents = entries.map(e => `${e.filename} (${e.uncompressedSize} bytes)`);

  // Look for collection files
  const collectionEntry = entries.find(e =>
    e.filename === 'collection.anki21b' ||
    e.filename === 'collection.anki21' ||
    e.filename === 'collection.anki2'
  );

  if (!collectionEntry || collectionEntry.directory) {
    result.errors?.push('No collection database found in ZIP archive');
    await zipReader.close();
    return;
  }

  // Extract and analyze collection file
  const collectionBlob = await collectionEntry.getData?.(new BlobWriter());
  if (!collectionBlob) {
    result.errors?.push('Failed to extract collection database');
    await zipReader.close();
    return;
  }

  const collectionBuffer = new Uint8Array(await collectionBlob.arrayBuffer());

  // Check if it's zstd compressed
  if (collectionEntry.filename === 'collection.anki21b') {
    const decompressed = await decompressZstd(collectionBuffer);
    await analyzeSQLiteFile(decompressed, result);
  } else {
    await analyzeSQLiteFile(collectionBuffer, result);
  }

  await zipReader.close();
}

async function analyzeZstdFile(buffer: Uint8Array, result: IdentificationResult): Promise<void> {
  const decompressed = await decompressZstd(buffer);
  await analyzeSQLiteFile(decompressed, result);
}

async function analyzeSQLiteFile(buffer: Uint8Array, result: IdentificationResult): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => {
      // In Node.js environment, we need to resolve the WASM file path
      return path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
    }
  });

  const db = new SQL.Database(buffer);
  const analysis = analyzeAnkiDatabase(db);

  result.ankiFormat = {
    era: analysis.era,
    version: analysis.collectionVersion,
    details: analysis.details,
    tableStructure: {
      hasNotesTable: analysis.hasNotesTable,
      hasFactsTable: analysis.hasFactsTable,
      hasGravesTable: analysis.hasGravesTable,
      hasDeckConfigTable: analysis.hasDeckConfigTable,
      hasModelsColumn: analysis.hasModelsColumn,
    },
  };

  db.close();
}

function printResult(result: IdentificationResult): void {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('           ANKI FILE IDENTIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📁 File Name: ${result.fileName}`);
  console.log(`📊 File Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
  console.log(`🔍 Container Format: ${result.containerFormat}`);
  console.log(`🔢 Magic Bytes: ${result.magicBytes}\n`);

  if (result.zipContents) {
    console.log('📦 ZIP Archive Contents:');
    result.zipContents.forEach(item => console.log(`   - ${item}`));
    console.log('');
  }

  if (result.ankiFormat) {
    console.log('📚 Anki Format Details:');
    console.log(`   Era: ${result.ankiFormat.era}`);
    console.log(`   Collection Version: ${result.ankiFormat.version}`);
    console.log(`   Details: ${result.ankiFormat.details}\n`);

    console.log('🗂️  Database Structure:');
    console.log(`   - notes table: ${result.ankiFormat.tableStructure.hasNotesTable ? '✓' : '✗'}`);
    console.log(`   - facts table: ${result.ankiFormat.tableStructure.hasFactsTable ? '✓' : '✗'}`);
    console.log(`   - graves table: ${result.ankiFormat.tableStructure.hasGravesTable ? '✓' : '✗'}`);
    console.log(`   - deck_config table: ${result.ankiFormat.tableStructure.hasDeckConfigTable ? '✓' : '✗'}`);
    console.log(`   - models column in col: ${result.ankiFormat.tableStructure.hasModelsColumn ? '✓' : '✗'}\n`);
  }

  if (result.errors && result.errors.length > 0) {
    console.log('⚠️  Errors:');
    result.errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// Main CLI execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run identify <file-path>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run identify myDeck.apkg');
    console.error('  npm run identify collection.anki2');
    console.error('  npm run identify collection.anki21b');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const result = await identifyAnkiFile(filePath);
    printResult(result);
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
