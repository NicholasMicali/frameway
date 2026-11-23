# Background music

Enable **Project settings → Background music** to use Exploration Theme by Cleyton Kauffman. Set the volume and apply the settings. Existing projects remain silent by default. One looping soundtrack continues across slides in preview and interactive exports. The small microphone-shaped sound control plays/mutes/unmutes background music; it does not record from a microphone or request microphone permission.

Browsers may block sound until the viewer clicks or uses the keyboard. The control then lets them start it explicitly. Leaving preview releases its player. Hidden documents pause audio and resume when visible if the viewer has not muted it. Viewer mute state stays local to that player session, persists across slide navigation, and does not alter the authored project. Music runs through the closing slide until muted or the viewer leaves. Opening Share stops preview music so export does not compete with it.

Standalone HTML embeds the audio; embed ZIPs include a relative local audio file and credits. No external music requests are made. Editable backups and project copies preserve the bundled track ID, enabled state, and volume; they resolve the track from the installed Frameway bundle, so recipients need a music-capable version. Uploaded tracks are stored as local Blobs with the project. Backups include the original audio in `audio/background` and use archive schema 4 so older editors reject them rather than silently losing the soundtrack. Copies preserve the audio; storage estimates include it.

Video exports mix the loop into the canvas recording with a short fade-in/out. Audio rendering pauses during inter-slide media preparation to stay aligned with encoded video. Export-only audio is not played through the speakers. Cancellation/failure releases the audio context and tracks; original capture audio remains excluded, matching existing behavior.

The original Exploration Theme OGG is bundled unchanged under CC0, independently of the code's Apache-2.0 license. See `public/audio/LICENSE.txt` for the creator, source, verification date, SHA-256 and CC0 legal text. Music adds approximately 5.4 MB to the extension and enabled embed exports (about 7.3 MB before compression in single-file HTML). The music picker also offers Daylight (Soft Corporate by MusicLFiles, CC BY 4.0), Lo-fi Focus (Chill lofi inspired by omfgdude, CC0), and Sunrise (Adding the Sun by Kevin MacLeod, CC BY 4.0). Short display labels do not replace original artist credits.

Implementation: `music.ts` validates bundled or uploaded track metadata and volume and loads local bytes; `music-player.ts` is a self-contained controller shared by React preview and standalone HTML; `MusicControl.tsx` handles React lifetime. `video-export.ts` mixes a looping Web Audio buffer through a MediaStream destination into the native video encoder. Background music needs no new extension permissions or network service.

## Uploading audio

In Project settings, choose Upload audio, select MP3, WAV, or OGG, then apply. Files are limited to 20 MB and 10 minutes and must decode successfully before replacing the current song. The selected filename, duration, preview player, replace/remove controls, and volume remain in the music section. Cancel leaves the saved project unchanged; Apply participates in undo/redo. Removing an upload disables music and restores the built-in track option.

Audio never leaves the device except in exports the user chooses to share. HTML embeds the file, embed ZIPs use the correct audio extension, and video exports mix it using the same loop and fades as bundled music. Uploaded music is not labeled CC0; users need permission to distribute their chosen audio. Arbitrary songs may have audible loop joins. Overall export/archive size limits still apply.

## Built-in selection and attribution

The Soundtrack dropdown selects among four bundled files without network access. Project settings previews each selection before Apply. Only the chosen song is included in playback exports. Choosing a built-in track replaces any uploaded audio in the draft; Cancel and undo retain the original.

All bundled files retain their original bytes and source/license notices in `public/audio/LICENSE.txt` and extension third-party notices. Interactive players expose Music credits beside the mute control, with source and license links. CC BY songs automatically show a compact original-title/artist/source/license credit overlay in the final five seconds of video output (or throughout videos shorter than five seconds), including the looping/fade modifications. Uploaded audio is not assigned a built-in license.
