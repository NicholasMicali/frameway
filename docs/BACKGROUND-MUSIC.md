# Background music

Enable **Project settings → Background music** to use Exploration Theme by Cleyton Kauffman. Set the volume and apply the settings. Existing projects remain silent by default. One looping soundtrack continues across slides in preview and interactive exports. The small microphone-shaped sound control plays/mutes/unmutes background music; it does not record from a microphone or request microphone permission.

Browsers may block sound until the viewer clicks or uses the keyboard. The control then lets them start it explicitly. Leaving preview releases its player. Hidden documents pause audio and resume when visible if the viewer has not muted it. Viewer mute state stays local to that player session, persists across slide navigation, and does not alter the authored project. Music runs through the closing slide until muted or the viewer leaves. Opening Share stops preview music so export does not compete with it.

Standalone HTML embeds the audio; embed ZIPs include a relative local audio file and credits. No external music requests are made. Editable backups and project copies preserve the bundled track ID, enabled state, and volume; they resolve the track from the installed Frameway bundle, so recipients need a music-capable version. No uploaded tracks or track chooser are implemented.

Video exports mix the loop into the canvas recording with a short fade-in/out. Audio rendering pauses during inter-slide media preparation to stay aligned with encoded video. Export-only audio is not played through the speakers. Cancellation/failure releases the audio context and tracks; original capture audio remains excluded, matching existing behavior.

The original OGG is bundled unchanged under CC0, independently of the code's Apache-2.0 license. See `public/audio/LICENSE.txt` for the creator, source, verification date, SHA-256 and CC0 legal text. Music adds approximately 5.4 MB to the extension and enabled embed exports (about 7.3 MB before compression in single-file HTML). A future five-track selection or upload feature needs a separate scope decision.

Implementation: `music.ts` validates a fixed local track and volume and loads the bundled bytes; `music-player.ts` is a self-contained controller shared by React preview and standalone HTML; `MusicControl.tsx` handles React lifetime. `video-export.ts` mixes a looping Web Audio buffer through a MediaStream destination into the native video encoder. Background music needs no new extension permissions or network service.
