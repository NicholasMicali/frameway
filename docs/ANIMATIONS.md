# Walkthrough animations

Walkthrough playback uses one subtle default animation, with no project settings to configure. Cards, title/closing copy and buttons, and hotspot circles rise and fade in over 320 ms. Cards, buttons, and circles share the Continue button's gentle hover/focus emphasis. Hotspot circles also show a repeating outward ring that expands slightly and fades, without moving the click target.

The viewer's reduced-motion preference disables entrance, hover motion, and the repeating ring. Editing and thumbnails remain steady. Area-highlight zoom is still configured per slide; its outline is excluded from these effects to preserve alignment. Callouts retain their normal size during highlight zoom.

The shared `src/walkthrough-motion.css` styles power React preview and the standalone player. React keys restart entrances on each visit; the player resets entrance classes on reused elements. Hidden callouts animate when revealed. Backups from the early animation prototype still accept the old motion field, but it no longer changes playback.

This implements the first part of #44. Additional annotation elements remain a follow-up. No audio or video rendering is added.
