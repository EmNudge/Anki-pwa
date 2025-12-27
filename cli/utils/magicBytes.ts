/**
 * Magic byte detection utilities for identifying file formats
 */

export type FileFormat =
  | { type: 'zip'; description: 'ZIP archive (.apkg/.colpkg)' }
  | { type: 'sqlite3'; description: 'SQLite 3 database (.anki2/.anki21)' }
  | { type: 'zstd'; description: 'Zstandard compressed (.anki21b)' }
  | { type: 'unknown'; description: 'Unknown format' };

const MAGIC_BYTES = {
  // ZIP file signature (PK\x03\x04)
  ZIP: [0x50, 0x4B, 0x03, 0x04],
  // SQLite 3 signature ("SQLite format 3\0")
  SQLITE3: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00],
  // Zstandard frame signature (0x28, 0xB5, 0x2F, 0xFD)
  ZSTD: [0x28, 0xB5, 0x2F, 0xFD],
} as const;

/**
 * Check if a buffer starts with a specific magic byte sequence
 */
function matchesMagicBytes(buffer: Uint8Array, magicBytes: readonly number[]): boolean {
  if (buffer.length < magicBytes.length) {
    return false;
  }

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Identify file format by inspecting magic bytes
 */
export function identifyFileFormat(buffer: Uint8Array): FileFormat {
  if (matchesMagicBytes(buffer, MAGIC_BYTES.ZIP)) {
    return { type: 'zip', description: 'ZIP archive (.apkg/.colpkg)' };
  }

  if (matchesMagicBytes(buffer, MAGIC_BYTES.SQLITE3)) {
    return { type: 'sqlite3', description: 'SQLite 3 database (.anki2/.anki21)' };
  }

  if (matchesMagicBytes(buffer, MAGIC_BYTES.ZSTD)) {
    return { type: 'zstd', description: 'Zstandard compressed (.anki21b)' };
  }

  return { type: 'unknown', description: 'Unknown format' };
}

/**
 * Convert first N bytes of buffer to hex string for display
 */
export function bufferToHex(buffer: Uint8Array, length = 16): string {
  const bytes = Array.from(buffer.slice(0, length));
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
