# Morphlet

An independent, MIT-licensed desktop utility for local file conversion on macOS, Windows, and Linux. No accounts, cloud conversion, telemetry, or upload service. This directory is a self-contained project; it does not use Pihu's runtime or dependencies and can be moved to its own repository.

## Run

Install Node.js 22 or newer, then from this directory:

```sh
npm install
npm start
```

Morphlet starts quietly in the menu bar: there is no dashboard or normal app window.

1. Select one or more files in **Finder**.
2. Press **Option+C** (Alt+C).
3. Click a format in the radial popup at your pointer.
4. The same popup displays the converted image or text. Use **Quick Look** for a full macOS preview (including PDF pages), or **Show in Finder** to locate the output.
5. Press Escape or click elsewhere to dismiss it.

On first use macOS may ask to allow Morphlet (or Electron during development) to control Finder. Allow it under System Settings → Privacy & Security → Automation. Morphlet reads Finder selection only when the shortcut is invoked and does not copy files through your clipboard. Finder must be the active app when you invoke the shortcut.

Use the Morphlet menu bar icon to choose files manually or quit. Outputs are saved beside originals with `-converted` and numbered suffixes. Existing files are never overwritten. A conflicting shortcut produces an explicit error and the menu bar fallback remains available.

The popup shell and conversion engine work across platforms. Automatic selection capture is currently **macOS Finder only**; Windows/Linux use Choose files. Linux shortcut availability depends on the desktop. This is a transient frameless overlay, technically a small Electron window, rather than an installed Finder right-click extension. System-wide Shift-drag activation is not implemented.

## Supported conversions

| Input | Output |
| --- | --- |
| PNG, JPEG, WebP, AVIF, TIFF, GIF | PNG, JPEG, WebP, AVIF, TIFF, PDF |
| TXT, Markdown, HTML | TXT, Markdown, HTML, PDF |
| PDF with embedded text | TXT, Markdown |
| JSON array of objects | CSV, TSV, pretty JSON, TXT |
| CSV, TSV with unique headers | CSV, TSV, JSON, TXT |

The engine supports quality, resizing and pixel cropping; those editing controls are not currently exposed in the minimal popup. Images auto-orient; JPEG transparency becomes white. GIF/TIFF input uses the first frame/page. Conversion strips image metadata. The same options apply to all files in a batch. Unsupported mixed batches must be separated into compatible groups.

Document conversion preserves content as text, not original page layout. Markdown becomes plain content for PDF and text-only HTML; HTML input is reduced to text. TXT/PDF to Markdown yields plain text valid as Markdown, without inferring headings. PDF export uses built-in PDF fonts: Latin text works; full multilingual font embedding is a future feature. Scanned PDF OCR, PDF page rasterization, editable PDF reconstruction, office documents, audio/video, archive conversion, and animated output are not implemented. Files are limited to 100 MB, images to 80 megapixels.

## Verification

All five engine tests pass on macOS. Popup UI tests cover radial choices, conversion results, inline preview and return to formats. Native startup is checked to ensure the app starts hidden. Interactive Finder authorization and actual Option+C use require manual validation on the user's machine. Windows/Linux installers remain unverified.

## Development and packaging

```sh
npm test
npm run pack
npm run dist
```

Build on the target OS for macOS DMG/ZIP, Windows NSIS, and Linux AppImage/DEB. Native image dependencies are installed per platform. The included CI workflow tests and builds on all three platforms. Release signing/notarization credentials are not configured; distribution builds are unsigned. No published binaries are included.

The renderer is sandboxed with context isolation and no Node access. Conversions run in the main process, sequentially per batch; very large files may temporarily affect responsiveness. A dedicated worker process, visual cropping, cancellation and Windows/Linux selection adapters are useful next steps.
