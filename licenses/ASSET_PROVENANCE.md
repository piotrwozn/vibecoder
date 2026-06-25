# VIBECODER Asset Provenance

This manifest documents the non-code assets distributed with VIBECODER release builds. The desktop
bundle includes this `licenses/` directory through `src-tauri/tauri.conf.json`.

## Rights Summary

- VIBECODER-specific visual assets are original project assets created for this game by Pjoter00
  and/or generated for this game with OpenAI image tools.
- The generation workflow did not intentionally use third-party logos, trademarked UI, screenshots,
  film/game stills, or specific living artists as references.
- OpenAI's current Terms of Use assign OpenAI's right, title, and interest in generated output to the
  user to the extent permitted by law. Source checked: https://openai.com/policies/row-terms-of-use/.
  This manifest records project provenance rather than making a legal conclusion about
  copyrightability of AI-only material.
- VIBECODER visual assets are distributed as part of VIBECODER. They are not offered as a standalone
  stock art, icon, or wallpaper pack.

## Bundled Visual Asset Groups

| Asset group               | Files                                                                                                                                            | Source/provenance                                                                                   | Production use                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Boot room / monitor scene | `images/vibecoder-menu-environment-v2.png`, `images/vibecoder-menu-environment-v3.png`                                                           | Generated specifically for VIBECODER with OpenAI image tools, then selected/cropped by the project. | Boot/title scene background.                                |
| Desktop wallpaper         | `images/game-wallpaper-cyan-wave.jpg`                                                                                                            | Generated abstract cyan wave wallpaper for VIBECODER. No external logo or photo source.             | Desktop wallpaper.                                          |
| Sticky note textures      | `images/sticky-notes-source.png`, `images/sticky-note-money-yellow.png`, `images/sticky-note-loc-pink.png`, `images/sticky-note-system-blue.png` | Generated specifically for VIBECODER, then split into runtime note textures.                        | Boot notes and desktop resource notes.                      |
| App icon set              | `images/app-icons-source-chatgpt.png`, `images/app-icons/*.png`                                                                                  | Generated icon sheet for VIBECODER, then cropped into individual app icons.                         | Desktop app icons.                                          |
| App/install icons         | `src-tauri/icons/**`, `images/vibecoder-icon-*.png`                                                                                              | VIBECODER project icon artwork and generated/resized Tauri icon outputs.                            | Windows/macOS/Linux bundle icons and retained icon sources. |

## Private Evidence Pack Checklist

Keep the evidence pack outside the public release artifact when it contains account/session details,
raw prompts, or intermediate exports. For each generated visual asset group, retain:

- generation date and tool/model used;
- the prompt text and any negative prompt or style constraints;
- a note that no third-party logo, trademarked UI, screenshot, named artist, or existing copyrighted
  work was used as a reference;
- the raw generated export, the edited production file, and a short edit history such as crop,
  resize, color correction, or split-from-sheet;
- SHA-256 hashes for the raw export and final production file;
- the person who accepted the asset for release.

## Source-Only / Retained Artifacts

These files are retained for design history and are not referenced by the current production UI:

- `images/vibecoder-menu-environment-v1.png`
- `images/start-menu-monitor.png`
- `images/removed-sci-fi-frame.png`
- `images/vibecoder-icon-achievements*.png`
- `images/vibecoder-icon-projects*.png`
- `images/vibecoder-icon-stats*.png`
- `images/vibecoder-icon-upgrades*.png`

## Third-Party Non-Code Assets

- Fonts: Inter, JetBrains Mono, and Patrick Hand are documented by the OFL license files in this
  directory.
- Font license sources checked: https://github.com/rsms/inter/blob/master/LICENSE.txt,
  https://www.jetbrains.com/lp/mono/, and https://openfontlicense.org/.
- Audio: CC0 sources are documented in `CC0-AUDIO-NOTICE.md`.
- Local AI model: SmolLM2/GGUF licensing is documented in
  `SmolLM2-135M-Instruct-NOTICE.txt` and `SmolLM2-135M-Instruct-Apache-2.0.txt`.
