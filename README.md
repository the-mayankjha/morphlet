<div align="center">

<img src="assets/icon.png" alt="Morphlet icon" width="96">

# Morphlet

**A new format, a little less friction.**

An open-source desktop utility for local file conversion, PDF editing, and AI-ready document exports.

macOS · Windows · Linux

[![Build Morphlet](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml/badge.svg)](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Downloads](https://github.com/the-mayankjha/morphlet/releases) · [Builds](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml) · [Report an issue](https://github.com/the-mayankjha/morphlet/issues)

</div>

## Overview

Morphlet stays in your menu bar or system tray. Open a small conversion wheel, choose a format, and preview the result. Files are processed on your device; no accounts, conversion uploads, or telemetry are implemented.

- **Quick wheel:** convert images, documents, PDFs, and structured data from a small floating menu.
- **PDF editor:** edit supported original text, remove or replace embedded images, annotate, fill forms, and organize pages.
- **AI-ready books:** export page images, extracted text, Markdown, tables, and a source manifest in one ZIP.
- Crop, resize, flip, mirror, and adjust image quality before conversion.
- Preview images, rendered PDF pages, and text inside the popup.
- Convert multiple compatible files in one batch.
- Preserve originals and existing outputs with numbered filenames.

## Quick start

1. [Download Morphlet](https://github.com/the-mayankjha/morphlet/releases/latest) for your system and launch it.
2. Open the menu bar or tray icon and choose **Choose files…** or **Morphlet Studio**.
3. For quick conversion, select a format in the wheel. For PDF editing, add a PDF in Studio and click **Edit PDF**.
4. Preview your result. Conversions and edits save a new file; originals remain unchanged.

On macOS, **Option+C** opens the wheel for selected Finder files. **Option-drag** on macOS and **Alt-drag** on supported Windows/Linux desktops open the wheel while dragging. A floating drop target is available when desktop integration is unavailable.

## Contents

[Install](#installation) · [Quick wheel](#use-morphlet) · [Studio](#morphlet-studio) · [PDF editor](#pdf-editing-in-studio) · [AI-ready PDFs](#pdf-books-for-ai-agents) · [Formats](#supported-conversions) · [Platform support](#platform-support) · [Development](#development) · [Releases](#automated-builds-and-releases)

## Installation

Download a package for your system from [Releases](https://github.com/the-mayankjha/morphlet/releases/latest). For development builds, open a successful [Actions run](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml) and download its artifact (GitHub sign-in required).

| System | Package | Architecture |
| --- | --- | --- |
| macOS | `.dmg` or `.zip` | Apple Silicon ARM64, Intel x64 |
| Windows | NSIS `.exe` installer | x64 |
| Linux | `.AppImage` or `.deb` | x64 |

On macOS, open the DMG and drag Morphlet into Applications. On Windows, run the installer. On Linux, install the DEB with your package manager, or make the AppImage executable and run it. AppImages may require FUSE support supplied by your distribution.

**Current packages are unsigned and macOS builds are not notarized.** Your operating system may display a security prompt or block launch. Review the source and use the source instructions below if you prefer. A completed build does not certify that every desktop integration works on that platform.

## Use Morphlet

### Select a file in Finder

1. Start Morphlet; it stays in the menu bar without a dashboard.
2. Select one or more files in **Finder**.
3. Press **Option+C** to open the wheel near your pointer.
4. Click an output format.
5. Preview the result, use **Quick Look**, or select **Show in Finder**.

macOS may ask permission for Morphlet to control Finder. Allow it in **System Settings → Privacy & Security → Automation**. In development the requesting app may be named Electron. Finder must be active when invoking selection capture.

### Drag + Option on macOS

Start dragging a file, hold **Option**, and drop it onto a format wedge. The wheel opens without taking focus from the drag. The native trigger reads the drag pasteboard and mouse/modifier state; it does not install a keyboard hook or capture your screen. The trigger has automated state checks, but interactive behavior still needs validation across Finder and macOS versions.

### Choose files on any platform

Use the menu bar/system tray icon → **Choose files…**. Windows and Linux also support this workflow; see the drag compatibility notes below. **Alt+C** opens the popup with guidance and a file-picker fallback on these systems. Shortcut registration can depend on the desktop or conflict with another app.

The wheel expands from its center, including the native glass surface. Scroll over it to step through formats with a tactile tick, then press Enter to convert. The selected format label magnifies within its segment for pointer hover, dragging, keyboard focus, and scrolling. The wheel contour and click/drop targets remain fixed. Arrow keys move between formats; Enter or Space selects one. Quiet local sound effects signal opening, hovering, selection, and results. The note button in the header mutes them and remembers your preference. Reduced-motion settings disable decorative animation.

If macOS does not deliver a drag/drop event, Morphlet leaves the wheel open for an explicit click; mouse release alone does not convert a potentially cancelled drag.

Press **Escape** or click outside to dismiss the popup. Quit Morphlet through its tray/menu bar menu.

### Crop and edit an image

Select a single image, open Morphlet, and click **Crop & edit**.

- Drag across the preview to select a crop, or enter exact X/Y/width/height values.
- Choose Free, 1:1, 16:9, 9:16, or 4:3.
- Set an optional output width; proportions are preserved and images are not enlarged.
- Adjust quality, flip vertically, or mirror horizontally.
- Click **Apply edits**, then choose an output format. **Reset** restores the editing controls.

Editing currently supports one selected image at a time. Quality controls affect formats according to their encoder; not every format has an equivalent quality setting.

## Morphlet Studio

Open **Morphlet Studio** from the menu bar/system tray, click **Studio** in the quick wheel, or run `npm run studio` from source. The tray app still starts quietly by default.

Studio uses a strictly monochrome interface with dark and light themes, labelled tool icons, and a plain Morphlet wordmark. The light header has a translucent white backing to keep controls legible over desktop content. Use the theme button in Studio or the quick wheel; the preference is shared and saved. On macOS 26+, the Studio window uses native Liquid Glass, with a portable monochrome fallback elsewhere. File previews keep their original colors.

Studio provides a dedicated workspace with:

- A queue of up to 100 files, with individual output formats and image settings.
- A larger original/converted preview for images, rendered PDF first pages, and text.
- Drag-to-crop, aspect presets, exact crop coordinates, resizing, quality, flip, and mirror.
- Single-file conversion or a mixed-format queue using each file’s settings.
- An output folder picker, per-file progress and errors, and a session results list.
- Full preview/reveal actions and a Quick wheel button for the selected input.
- A PDF editing workspace for original text and images, annotations, forms, signatures, and page management.
- AI-ready PDF bundles with page ranges, local OCR options, progress, and cancellation.

Studio and the quick wheel maintain separate selections. Results and queue settings are held in memory for the current app session; they are not a persistent job database. Large batches still run sequentially in the main process. Unsupported input files can be removed from the queue before converting the batch.

## PDF editing in Studio

Add a PDF, select it, and click **Edit PDF** beside the workspace title. The editor stays inside Studio, sharing its header and file sidebar. Scroll continuously through the PDF or use the scrollable page list to jump to a page. Nearby page previews load on demand; the current page exposes its editing tools and properties. Click **Done editing** to return to conversion.

### Edit existing text

1. Click **Edit PDF** in Studio, then choose a page.
2. Click original text directly in **Select** or **Edit text** mode. Supported text regions become selectable; the sidebar shows how many were detected.
3. Change **Replacement text** in the right panel. The page updates as you type. Adjust font, size, style or position as needed.
4. Use **Delete original text** to remove the selected text, or **Restore original** to discard its replacement. Finish with **Save copy**.

The editor removes the original active text operation before drawing the replacement, preserving the background rather than covering it with a rectangle. Replacement text must fit its box; expand **Position & size** to resize it.

### Remove or replace embedded images

1. Click a supported original image in **Select** or **Edit text** mode.
2. Choose **Remove image** or **Replace image** in the right panel.
3. For replacement, choose an image from your device. It fits within the original image’s bounds, preserving proportions; drag or resize it afterward if needed.
4. Use **Undo** to restore a removal. Select a replacement and choose **Restore original** to revert it. Save a copy to export the changes.

Edits affect the selected placement only. Reusing the same embedded image elsewhere in the PDF does not remove those other placements. Currently supported: page-level, axis-aligned raster image XObjects. Inline images, image masks, clipped or arbitrarily rotated images, and images nested inside reusable Form artwork are not selectable. Vector diagrams remain vector artwork rather than editable bitmap images. Removal is not secure redaction; unused source image data may remain in the file.

### Annotate, add content, and organize pages

- Add selectable text with font family, size, bold, italic and color controls.
- Place images and drawn signatures; drag, resize, keep proportions, duplicate, reorder layers or remove additions.
- Add HTTP/HTTPS/mailto links with real clickable PDF annotations.
- Choose **Annotate** for comments, highlights, underline, strikeout, freehand drawing and rectangles. The annotation sidebar lets you select notes and update or delete supported annotations from saved PDFs.
- Use the contextual properties panel for content and styling; expand **Position & size** or **Page actions** when needed.
- Navigate, rotate, reorder, duplicate or delete pages, insert blank pages, and merge ordinary PDFs.
- Search embedded PDF text and jump to matching pages.
- Fill existing standard AcroForm text, checkbox, dropdown, radio and option-list fields. Saved originals remain interactive.
- Undo/redo additions and page changes. Use Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z or Ctrl+Y; Cmd/Ctrl+S saves a copy, and Delete/Backspace removes the selected addition outside text fields.

**Save copy** writes a new `name-edited.pdf` beside the original or in the selected Studio output folder. Existing files are never overwritten. Edited results appear in Studio history and can be previewed. Drafts and undo history are held only for the editing session; closing the editor asks before discarding unsaved work.

Original-text editing is conservative: supported horizontal text runs can be replaced, while scanned pages, reusable artwork and complex or ambiguous text streams remain read-only. Replacement uses standard fonts and does not reflow paragraphs or reproduce every embedded font. Deleting text removes its active page operation; this is **not secure redaction**, and unreferenced original data may remain in the PDF. Drawn signatures are visual image marks, not cryptographic digital signatures. Standard fonts support Latin characters; unsupported text is rejected instead of silently losing glyphs. Search uses embedded text, not OCR. Text boxes must fit their content and stay within their page. Page edits are supported on rotated/cropped sources.

Interactive-form source pages can be reordered and rotated, but must be retained exactly once to preserve their widget/field relationships. Duplicating/deleting those pages and merging interactive-form PDFs are blocked with an explanatory error; flatten a separate copy first if needed. XFA editing, password/encryption management, certificate signing, secure redaction and collaborative review are not included.

Limits: 100 MB per PDF source, up to 10 source PDFs, 2,000 output pages and 500 edits; image additions are limited to 20 files, 20 MB per input, 40 megapixels and 64 MB of combined PNG assets.

## PDF books for AI agents

1. Open Studio and add a PDF. **AI-ready bundle (.zip)** is selected automatically, or choose **AI PACK** in the wheel.
2. Choose all pages or a range such as `1-20, 25`. Set visual detail to compact (1200 px), balanced (1600 px), or detailed (2400 px).
3. Convert. Studio shows per-page progress and supports cancellation between processing steps.
4. Unzip the result. Give your agent `document.md`, or the ordered files in `chunks/` for a long book. Also upload the relevant `pages/` images for questions about diagrams, scans, equations or layout. Markdown image links do not upload image files to an agent.

Each bundle includes full-page PNGs (retaining vector drawings), embedded bitmap figures when extractable, page text, Markdown chunks of roughly 24,000 characters or less, detected tables as JSON, and `manifest.json` with per-page notes, source SHA-256, and exported file hashes. Physical PDF page numbers are preserved for citations. The original PDF is never changed or included in the ZIP. Files use exclusive names such as `book-ai-ready.zip`.

**Scanned books:** automatic OCR uses a locally installed `tesseract` executable and language data (default `eng`; for multiple installed languages use e.g. `eng+hin`). Morphlet does not download OCR software or language models. It also checks common Homebrew paths on macOS and the standard Tesseract installation location on Windows. Missing OCR or failed recognition is recorded in the manifest; page images remain available for a vision-capable agent. This release does not bundle OCR, infer diagram descriptions, reconstruct mathematical notation, or guarantee complex reading order/table accuracy. Check these against the page images.

Processing is sequential, with at most 2,000 selected pages per bundle, a 100 MB source limit, and a 1 GB export budget. For larger books, export several page ranges. Agent context and upload limits vary; start with smaller chunks and the pages needed for your question. Everything runs locally, without sending files to an AI service.

During quick-wheel conversion, the wheel gives way to a compact glass progress panel. AI-ready PDF export reports completed pages and recognition stages, then shows an activity sweep while packaging. Other conversions report completed files without estimating a made-up percentage. The result preview appears when it is ready; errors return to the wheel. Motion follows the operating system's reduced-motion setting.

## Markdown formatting

**PDF to Markdown:** detected ruled tables become pipe tables with escaped cells. Monospaced text becomes fenced code with indentation inferred from its position. This applies to standalone `.md` and AI-ready bundle Markdown/chunks; raw text and table JSON remain available in bundles. Code fences and table headers are preserved when splitting long chunks. A table that cannot be located confidently is appended with an extraction note while its source text is retained. Scanned tables, borderless tables, proportional-font code, merged cells and complex columns may need manual correction.

**Markdown to PDF:** `#` through `######` use distinct sizes, and paragraphs support bold, italics, inline code and links. Lists, task lists, fenced code, blockquotes, horizontal rules and Markdown tables receive document formatting. Long tables repeat their headers across pages. Standalone images may reference local files inside the Markdown source folder; remote images are not fetched. Built-in fonts currently limit multilingual coverage; LaTeX rendering, syntax highlighting and full HTML/CSS layout are not provided.

### PDF heading hierarchy

PDF Markdown exports infer title and section levels from document-wide font-size samples, font weight, spacing and numbered section depth. The same level is used across pages, with up to six Markdown heading levels. Repeated headers and page-number footers are filtered from structured Markdown; AI-bundle raw text still preserves the original extraction. Physical page references use comments such as `<!-- PDF page: 12 -->`, so they do not create fake sections in a Markdown outline. Wrapped heading lines are joined when their style and spacing agree. AI-bundle manifests include detected headings for each page.

These are layout-based inferences, not author-supplied semantic tags. Scanned pages, visually ambiguous headings and unusual layouts may still need correction. The hierarchy model samples up to 12 pages across the document; the exported page images remain the visual reference.

## SVG and image quality

SVG inputs convert to PNG/JPEG/WebP/AVIF/TIFF/PDF. In Studio or Crop & edit, set the output width to render SVG directly at the requested resolution, rather than enlarging its default bitmap render. Transparency is retained by compatible formats; JPEG uses a white background. The 80-megapixel decode/render limit remains in place.

For PNG and other raster inputs, choose **SVG image** in Studio:

- **Lossless embedded image** is the default, including in the wheel. The SVG contains an embedded PNG and retains the processed image's pixel detail and transparency. This is an SVG container, not editable vector paths; enlarging it cannot recover missing detail.
- **Trace editable paths** produces actual vector paths for logos and illustrations using a 64-color palette. It runs in a background worker, supports cancellation in Studio, and has a 1-megapixel input limit after edits. Crop or resize larger images explicitly. Tracing is approximate and may change colors, transparency or fine details, especially in photographs.

Image quality now defaults to **100** in both Studio and the quick editor. PNG avoids palette quantization; TIFF uses lossless LZW; WebP and AVIF use lossless encoder modes at quality 100. JPEG uses quality 100 and 4:4:4 chroma by default but remains a lossy format. Lowering quality enables smaller lossy WebP/AVIF output. ICC profiles are retained where supported. Raster images retain their resolution unless resized and are not automatically enlarged. Format limitations, color-space conversion and source bit depth still affect fidelity; no conversion can create detail absent from the source.

## Supported conversions

| Input | Output |
| --- | --- |
| PNG, JPG/JPEG, WebP, AVIF, TIFF, GIF, SVG | PNG, JPG, WebP, AVIF, TIFF, PDF; raster inputs can also export SVG |
| TXT, Markdown (`.md`, `.markdown`), HTML | TXT, Markdown, HTML, PDF |
| PDF | AI-ready ZIP with all selected pages and diagrams; PNG/JPG/WebP of **page 1**; page-labelled TXT/Markdown |
| JSON | Pretty JSON, TXT; CSV/TSV for arrays of objects |
| CSV, TSV | CSV, TSV, JSON, TXT |

Converted files are saved beside the source as `name-converted.ext`, with numeric suffixes when needed. The original is never overwritten. A batch shows only output formats shared by all selected files.

### Conversion limits

- Maximum input file size: **100 MB**; image decoding limit: **80 megapixels**.
- GIF and TIFF input uses the first frame/page. Animated export is not supported.
- Images auto-orient and most metadata is stripped; ICC profiles are retained where the encoder supports them. Transparent pixels become white for JPEG.
- PDF-to-image export and inline PDF preview use the first page. Quick Look can inspect the full PDF on macOS.
- Plain TXT/Markdown exports require embedded text. AI-ready bundles optionally use installed Tesseract OCR for low-text pages and preserve full page images regardless.
- Markdown-to-PDF renders heading sizes, bold/italic text, lists, code blocks, tables, quotes, links and standalone local images. HTML conversion remains text-oriented. PDF-to-Markdown reconstructs detected ruled tables and monospaced code; it infers heading hierarchy from typography and numbering but cannot guarantee the original layout or semantics.
- PDF text export uses built-in fonts. Full multilingual font embedding is not implemented.
- CSV/TSV-to-JSON expects unique headers and matching row widths.
- Office documents, audio/video, archive input, automatic paragraph reflow, and complete PDF-to-editable-document reconstruction are not supported. Studio supports the PDF edits described below.

## Background utility

Morphlet starts quietly in the menu bar (macOS) or system tray (Windows/Linux). Closing Studio or dismissing the wheel keeps the utility running, so the shortcut and drag gesture remain available. Reopen Studio from the tray menu; choose **Quit Morphlet** to fully exit.

After installing, enable **Launch at login** from the tray menu to start Morphlet quietly after signing in. This setting is opt-in. Linux uses an XDG autostart entry; the desktop session must support XDG autostart. Development runs do not register themselves at login.

The monochrome application icon is included in macOS, Windows, and Linux packages. Edit `assets/icon.svg` and run `npm run icons` to regenerate the PNG, ICO, ICNS, and macOS template tray icon.

## Platform support

| Capability | macOS | Windows | Linux |
| --- | --- | --- | --- |
| Conversion, popup, inline previews | Yes | Portable implementation | Portable implementation |
| Tray/menu bar file picker | Yes | Yes | Desktop tray support required |
| Capture selected files | Finder | Not implemented | Not implemented |
| Drag + Option/Alt trigger | Native implementation | Windows monitor; Explorer selection | X11 adapter; Wayland drop target |
| Crop and image settings | Yes | Portable implementation | Portable implementation |
| Native Liquid Glass | macOS 26+ | CSS fallback | CSS fallback |
| Older macOS material | Native vibrancy | — | — |
| Full external preview | Quick Look | Default file app | Default file app |

The macOS native layer uses separate `NSGlassEffectView` surfaces for the wheel and preview. It responds to the desktop behind the popup without screenshots or screen-recording permission. System appearance and accessibility settings affect the result. Windows/Linux use a monochrome glass-style CSS fallback. The Studio and wheel theme buttons switch dark/light appearance, saved between launches.

Engine tests and macOS native startup have been checked locally. Windows/Linux packages require their CI runs and interactive device testing; the build matrix is not a claim of complete feature parity.

## Run from source

Install **Node.js 24 LTS** and npm. On macOS, install Xcode Command Line Tools (`xcode-select --install`) to build native effects.

```sh
git clone https://github.com/the-mayankjha/morphlet.git
cd morphlet
npm ci
npm start
```

The native bridge builds during installation on macOS when Node development headers are available. If native effects are missing:

```sh
npm run build:native
```

The builder searches your Node installation and common Homebrew include locations. Set `npm_config_nodedir` to a Node development directory containing `include/node/node_api.h` when using a separate headers installation. If a local native build is unavailable, Morphlet falls back to CSS styling.

### Windows and Linux dragging

Hold **Alt** while dragging. Windows monitors pointer/modifier state through the bundled PowerShell adapter and can read selected Explorer files. Linux X11 reads XDND local file URIs through its native adapter. If paths are unavailable, drop onto the target that appears, then choose a format.

On Wayland, global pointer monitoring is restricted. Morphlet shows a floating drop target instead; it is also available via **Show floating drop target** in the tray menu on every platform. Drop a file there to open the wheel, or drag directly into Studio. You can hide the target from the tray menu.

On Linux, source builds need a C++ compiler, Node development headers, and `libx11-dev` (Debian/Ubuntu) for the X11 adapter. Without it, the drop target remains available. Windows uses its bundled Windows PowerShell. Gesture compatibility varies by file manager; native platform adapters still need hands-on testing in addition to CI initialization checks.

## Development

| Command | Purpose |
| --- | --- |
| `npm start` | Start the tray app |
| `npm run studio` | Open the Studio workspace |
| `npm test` | Test conversions, PDF editing, annotations, image edits, and drag triggers |
| `npm run build:native` | Compile the native bridge for the current platform |
| `npm run pack` | Package an app directory for the current platform |
| `npm run dist -- --publish never` | Build installers for the current platform |

Build on the target OS so native image libraries match it. Do not copy `node_modules` or compiled native binaries between architectures.

```text
main.cjs                  Desktop lifecycle, shortcut, conversion and preview handlers
preload.cjs               Sandboxed renderer bridge
convert.cjs               Local conversion engine
pdf-editor.cjs            PDF editing sessions, assets, preview and export
pdf-content-edit.cjs      Original PDF text mapping and content edits
pdf-images.cjs            Original image detection and placement removal
pdf-annotations.cjs       Reading and removing supported PDF annotations
pdf-ai.cjs                AI-ready PDF bundle export
ui/studio/                Studio and the PDF editing workspace
drag-trigger.cjs          Drag gesture state machine
native/                   Platform drag adapters, macOS glass, and compiler script
ui/                       Wheel, preview and crop editor
test/                     Conversion, PDF editor, background, and gesture tests
scripts/                  Build artifact collection
.github/workflows/        Multi-platform builds and releases
```

The renderer is sandboxed with context isolation and no Node access. Conversions currently execute sequentially in the main process; large files may affect responsiveness. AI-ready exports support cancellation between processing steps, and SVG tracing uses a background worker. Other large conversions still need broader worker isolation and cancellation support.

## Automated builds and releases

[Build Morphlet](.github/workflows/build.yml) runs on pushes to `main`, pull requests targeting `main`, version tags, and manual dispatch from the Actions tab.

Each run installs locked dependencies, tests the engine, builds installers, and uploads architecture-specific artifacts with SHA-256 checksums. macOS CI explicitly downloads matching Node headers and requires the native bridge to compile. Artifacts are retained for **14 days**. The matrix builds:

- macOS ARM64 on `macos-15` and x64 on `macos-15-intel`: DMG and ZIP.
- Windows x64: NSIS installer.
- Linux x64 on Ubuntu 24.04: AppImage and DEB.

### Create a release

1. Update `version` in `package.json` and `package-lock.json`, commit, and push.
2. Create a matching tag such as `v0.8.0` and push it:

   ```sh
   git tag -a v0.8.0 -m "Morphlet v0.8.0"
   git push origin v0.8.0
   ```

3. After **all four builds succeed**, Actions uploads installers and checksums, then publishes the GitHub release. A draft is used while assets upload to avoid publishing incomplete downloads.
4. Review the published release and downloads in GitHub. Version tags are release requests and publish automatically after successful builds.

The tag must exactly match `v` plus the package version. Installer names contain version, OS, and architecture. The workflow uses the built-in `GITHUB_TOKEN`; no personal token is required. Repository settings must allow the release job to write repository contents. Signing and notarization are not configured. Regular builds have read-only repository permissions; write access is limited to the tag-triggered release job.

## Contributing

Issues and pull requests are welcome. Include your OS/version, CPU architecture, input format, intended output, and steps to reproduce. Use non-sensitive sample files. Run `npm test` before submitting changes, and describe any platform-specific behavior that needs manual testing.

Useful next steps include broader file-manager integration, conversion workers, broader cancellation, more PDF content layouts, built-in OCR distribution, and embedded multilingual PDF fonts.

## License

[MIT](LICENSE). Dependencies retain their respective licenses.
