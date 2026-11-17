/**
 * Zero-dependency ZIP file generator in pure TypeScript/JavaScript.
 * Produces valid uncompressed (Store) ZIP archives directly in memory as a Blob.
 */

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  name: string;
  data: Uint8Array | ArrayBuffer | Blob;
}

export async function createZipBlob(files: ZipFileInput[]): Promise<Blob> {
  const localHeaders: Uint8Array[] = [];
  const centralDirectoryHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    let bytes: Uint8Array;
    if (file.data instanceof Blob) {
      bytes = new Uint8Array(await file.data.arrayBuffer());
    } else if (file.data instanceof ArrayBuffer) {
      bytes = new Uint8Array(file.data);
    } else {
      bytes = file.data;
    }

    const nameBytes = new TextEncoder().encode(file.name);
    const crc = calculateCrc32(bytes);
    const size = bytes.length;

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);

    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);         // Version needed to extract
    lv.setUint16(6, 0, true);          // General purpose bit flag
    lv.setUint16(8, 0, true);          // Compression method: 0 = Store
    lv.setUint16(10, 0, true);         // Last mod file time
    lv.setUint16(12, 0, true);         // Last mod file date
    lv.setUint32(14, crc, true);       // CRC-32
    lv.setUint32(18, size, true);      // Compressed size
    lv.setUint32(22, size, true);      // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    localHeaders.push(localHeader);
    localHeaders.push(bytes);

    // Central directory header (46 bytes + name length)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdHeader.buffer);

    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed
    cv.setUint16(8, 0, true);          // Bit flag
    cv.setUint16(10, 0, true);         // Compression method (0)
    cv.setUint16(12, 0, true);         // Mod time
    cv.setUint16(14, 0, true);         // Mod date
    cv.setUint32(16, crc, true);       // CRC-32
    cv.setUint32(20, size, true);      // Compressed size
    cv.setUint32(24, size, true);      // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // Name length
    cv.setUint16(30, 0, true);         // Extra field length
    cv.setUint16(32, 0, true);         // File comment length
    cv.setUint16(34, 0, true);         // Disk number start
    cv.setUint16(36, 0, true);         // Internal file attributes
    cv.setUint32(38, 0, true);         // External file attributes
    cv.setUint32(42, currentOffset, true); // Relative offset of local header
    cdHeader.set(nameBytes, 46);

    centralDirectoryHeaders.push(cdHeader);

    currentOffset += localHeader.length + bytes.length;
  }

  // Calculate central directory size
  const cdSize = centralDirectoryHeaders.reduce((acc, h) => acc + h.length, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true);          // Disk number
  ev.setUint16(6, 0, true);          // Start disk
  ev.setUint16(8, files.length, true); // Total entries on this disk
  ev.setUint16(10, files.length, true); // Total entries
  ev.setUint32(12, cdSize, true);    // Size of central directory
  ev.setUint32(16, currentOffset, true); // Offset of start of central directory
  ev.setUint16(20, 0, true);         // Comment length

  const allParts: any[] = [...localHeaders, ...centralDirectoryHeaders, eocd];
  return new Blob(allParts, { type: "application/zip" });
}
