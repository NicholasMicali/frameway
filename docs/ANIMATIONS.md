# Walkthrough animations

In **Project settings → Motion → Overlay animations**, choose **Subtle rise** (the default), **Fade**, or **None**, then apply appearance. The choice is saved with the project and travels with editable backups and HTML/embed exports.

Cards, title/closing copy and buttons, and hotspot circles enter over 320 ms each time a viewer reaches a slide. Hover and keyboard focus gently emphasize buttons and hotspots; cards gain a stronger shadow on hover or when a control inside receives focus. There are no repeating pulses or navigation delays. Hidden callouts animate when revealed.

Animation is limited to walkthrough playback. Editor drag targets, thumbnails, and application controls are unaffected. The viewer's reduced-motion preference disables these overlay effects. Area-highlight zoom remains separately configurable per slide and already respects reduced motion; its outline is excluded from the new effects so alignment stays accurate. Callouts retain their normal size during highlight zoom.

The shared `src/walkthrough-motion.css` styles power both React preview and the standalone player. React keys restart entrance effects on each visit; the standalone player resets the entrance class on its reused elements. Existing projects use the default without a data migration. Older Frameway versions may reject backups containing the new motion setting; use an updated editor to import those projects.

This is the first part of issue #44. Additional annotation elements, exit presets, and custom timing remain follow-up considerations. No audio or video rendering is added by this change.
