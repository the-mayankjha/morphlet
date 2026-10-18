<div align="center">

# Morphlet

**A new format, a little less friction.**

Local file conversion from a floating radial menu, with native Liquid Glass on macOS.

[![Build Morphlet](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml/badge.svg)](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Downloads](https://github.com/the-mayankjha/morphlet/releases) · [Builds](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml) · [Report an issue](https://github.com/the-mayankjha/morphlet/issues)

</div>

## What it does

Morphlet stays in your menu bar or system tray. Open a small conversion wheel, choose a format, and preview the result. Files are processed on your device; no accounts, conversion uploads, or telemetry are implemented.

- Convert images, text documents, PDFs, and structured data.
- Crop, resize, flip, mirror, and adjust image quality before conversion.
- Preview images, rendered PDF pages, and text inside the popup.
- Convert multiple compatible files in one batch.
- Preserve originals and existing outputs with numbered filenames.

## Installation

Download a package for your system from [Releases](https://github.com/the-mayankjha/morphlet/releases), when a release has been published. For development builds, open a successful [Actions run](https://github.com/the-mayankjha/morphlet/actions/workflows/build.yml) and download its artifact (GitHub sign-in required).

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

Open **Morphlet Studio** from the menu bar/system tray, click **Studio ↗** in the quick wheel, or run `npm run studio` from source. The tray app still starts quietly by default.

Studio uses a strictly monochrome interface with dark and light themes. Use the theme button in Studio or the quick wheel; the preference is shared and saved. On macOS 26+, the Studio window uses native Liquid Glass, with a portable monochrome fallback elsewhere. File previews keep their original colors.

Studio provides a dedicated workspace with:

- A queue of up to 100 files, with individual output formats and image settings.
- A larger original/converted preview for images, rendered PDF first pages, and text.
- Drag-to-crop, aspect presets, exact crop coordinates, resizing, quality, flip, and mirror.
- Single-file conversion or a mixed-format queue using each file’s settings.
- An output folder picker, per-file progress and errors, and a session results list.
- Full preview/reveal actions and a Quick wheel button for the selected input.

Studio and the quick wheel maintain separate selections. Results and queue settings are held in memory for the current app session; they are not a persistent job database. Large batches still run sequentially in the main process. Unsupported input files can be removed from the queue before converting the batch.

## Supported conversions

| Input | Output |
| --- | --- |
| PNG, JPG/JPEG, WebP, AVIF, TIFF, GIF, SVG | PNG, JPG, WebP, AVIF, TIFF, PDF |
| TXT, Markdown (`.md`, `.markdown`), HTML | TXT, Markdown, HTML, PDF |
| PDF | PNG, JPG, WebP of **page 1**; TXT or Markdown from embedded text |
| JSON | Pretty JSON, TXT; CSV/TSV for arrays of objects |
| CSV, TSV | CSV, TSV, JSON, TXT |

Converted files are saved beside the source as `name-converted.ext`, with numeric suffixes when needed. The original is never overwritten. A batch shows only output formats shared by all selected files.

### Conversion limits

- Maximum input file size: **100 MB**; image decoding limit: **80 megapixels**.
- GIF and TIFF input uses the first frame/page. Animated export is not supported.
- Images auto-orient and metadata is stripped. Transparent pixels become white for JPEG.
- PDF-to-image export and inline PDF preview use the first page. Quick Look can inspect the full PDF on macOS.
- Text extraction requires embedded PDF text; scanned-PDF OCR is not implemented.
- Document conversion preserves text content, not the original page layout. Markdown-to-HTML/PDF is currently text-oriented; extracted Markdown does not reconstruct headings.
- PDF text export uses built-in fonts. Full multilingual font embedding is not implemented.
- CSV/TSV-to-JSON expects unique headers and matching row widths.
- Office documents, audio/video, archives, and editable PDF reconstruction are not supported.

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
| `npm test` | Run conversion and drag-trigger tests |
| `npm run build:native` | Compile the macOS Node-API bridge |
| `npm run pack` | Package an app directory for the current platform |
| `npm run dist -- --publish never` | Build installers for the current platform |

Build on the target OS so native image libraries match it. Do not copy `node_modules` or compiled native binaries between architectures.

```text
main.cjs                  Desktop lifecycle, shortcut, conversion and preview handlers
preload.cjs               Sandboxed renderer bridge
convert.cjs               Local conversion engine
drag-trigger.cjs          Drag gesture state machine
native/                   macOS glass and drag-state bridge + compiler script
ui/                       Wheel, preview and crop editor
test/                     Conversion and gesture tests
scripts/                  Build artifact collection
.github/workflows/        Multi-platform builds and releases
```

The renderer is sandboxed with context isolation and no Node access. Conversions currently execute sequentially in the main process; large files may affect responsiveness. Cancellation and dedicated conversion workers are future improvements.

## Automated builds and releases

[Build Morphlet](.github/workflows/build.yml) runs on pushes to `main`, pull requests targeting `main`, version tags, and manual dispatch from the Actions tab.

Each run installs locked dependencies, tests the engine, builds installers, and uploads architecture-specific artifacts with SHA-256 checksums. macOS CI explicitly downloads matching Node headers and requires the native bridge to compile. Artifacts are retained for **14 days**. The matrix builds:

- macOS ARM64 on `macos-15` and x64 on `macos-15-intel`: DMG and ZIP.
- Windows x64: NSIS installer.
- Linux x64 on Ubuntu 24.04: AppImage and DEB.

### Create a release

1. Update `version` in `package.json` and `package-lock.json`, commit, and push.
2. Create a matching tag such as `v0.1.0` and push it:

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. After **all four builds succeed**, Actions uploads installers and checksums, then publishes the GitHub release. A draft is used while assets upload to avoid publishing incomplete downloads.
4. Review the published release and downloads in GitHub. Version tags are release requests and publish automatically after successful builds.

The tag must exactly match `v` plus the package version. Installer names contain version, OS, and architecture. The workflow uses the built-in `GITHUB_TOKEN`; no personal token is required. Repository settings must allow the release job to write repository contents. Signing and notarization are not configured. Regular builds have read-only repository permissions; write access is limited to the tag-triggered release job.

## Contributing

Issues and pull requests are welcome. Include your OS/version, CPU architecture, input format, intended output, and steps to reproduce. Use non-sensitive sample files. Run `npm test` before submitting changes, and describe any platform-specific behavior that needs manual testing.

Useful next steps include broader file-manager integration, conversion workers, cancellation, multi-page PDF export, OCR, and embedded multilingual PDF fonts.

## License

[MIT](LICENSE). Dependencies retain their respective licenses.
