export interface ValidationResult {
  isValid: boolean;
  format?: string;
  error?: string;
}

export class AudioValidator {
  private static MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB max

  public static async validateFile(file: File): Promise<ValidationResult> {
    if (!file) {
      return { isValid: false, error: "No file provided." };
    }

    if (file.size === 0) {
      return { isValid: false, error: "File is empty (0 bytes)." };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB limit.`,
      };
    }

    // Read first 64 bytes to inspect magic headers
    try {
      const headerSlice = await file.slice(0, 64).arrayBuffer();
      const bytes = new Uint8Array(headerSlice);

      // Check WAV: "RIFF" .... "WAVE"
      if (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
      ) {
        return { isValid: true, format: "WAV" };
      }

      // Check MP3: ID3 header ("ID3") or sync word 0xFF 0xFB/F3/F2
      if (
        (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
      ) {
        return { isValid: true, format: "MP3" };
      }

      // Check OGG: "OggS"
      if (
        bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53
      ) {
        return { isValid: true, format: "OGG" };
      }

      // Check FLAC: "fLaC"
      if (
        bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43
      ) {
        return { isValid: true, format: "FLAC" };
      }

      // Check M4A / AAC (ftyp atom: 'ftypM4A ' or 'ftypisom' or 'mp42')
      if (
        bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
      ) {
        return { isValid: true, format: "M4A" };
      }

      // Fallback check based on extension / MIME if header was non-standard
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'weba'].includes(ext)) {
        return { isValid: true, format: ext.toUpperCase() };
      }

      return {
        isValid: false,
        error: "Unsupported audio format. Supported inputs: MP3, WAV, OGG, FLAC, M4A.",
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Could not read file header: ${(err as Error).message}`,
      };
    }
  }
}
