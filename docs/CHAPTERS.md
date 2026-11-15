# Chapters within a walkthrough

Select a step and enable **Behavior → Start a chapter**, then name it. A blank name uses the step headline. Labels are optional, up to 120 characters, and remain attached to the step's ID when reordered. Deleting a starting step removes that chapter; the surrounding steps join the preceding chapter. Undo restores it. Duplicating or splitting a step does not create another chapter start; copying an entire project preserves its chapters.

Preview and exported HTML/embed players show Contents only when chapters exist. The current section is the last chapter start at or before the displayed step, in slide-list order. Steps before the first named chapter show “Before first chapter.” Chapter jumps use the same history and zoom-out transition as other navigation. Jumps are disabled during active video playback and transitions; exported video can be paused to unlock navigation. No additional video-skipping policy is introduced.

Chapter labels are an optional `chapter` string on steps in the existing version-2 manifest. Existing projects require no migration. Backups include labels, imports validate them, and generated HTML embeds escaped JSON and uses text content for labels. Existing projects without labels retain their original navigation. This is a single walkthrough contents menu, not a course or nested module system.
