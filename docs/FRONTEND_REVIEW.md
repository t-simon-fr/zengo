# Frontend review — 2026-10-19

## Changes

- Removed the single-purpose sidebar to give the music workspace more room.
- Moved voicing, rhythm and chord timing into an expandable Sound & rhythm section. Key, tempo, playback sound and generation remain directly accessible.
- Removed the duplicate preview button from the editor header. Chord-specific controls appear only on the Chords tab.
- Selecting an idea scrolls to the studio; reduced-motion preferences are respected.
- Collapsed groove controls and piano-roll instructions into keyboard-accessible disclosures.
- Added layered ambient lighting, a dotted background, an animated musical ribbon, richer panel surfaces and subtle hover feedback. Decorative elements are hidden from assistive technology; reduced-motion preferences disable animation.
- Improved typography, card spacing, selected states and mobile layouts. Mobile header icon buttons have accessible names. Fixed a legacy rule that hid the text of part-removal buttons.

## Verification

- Desktop and 390px mobile viewport inspected in Hungarian and English across the generator and studio. Mobile document width equals its scroll width (375px with scrollbar), including the drum grid; piano rolls and drums scroll inside their own containers.
- Sound & rhythm opens correctly, selecting an idea navigates to the studio, track switching works and drums can be added.
- Translation tests: 3 passed. Browser warning/error log: empty.
- Production build and TypeScript check passed.
- Screenshot: `chordflow-redesign.png`.

The audio engine, generation algorithms and project schema were not changed in this visual pass.
