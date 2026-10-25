# Reference observations

Reference: https://desk.lofigirl.com/ · inspected 25 October 2026.

The reconstruction uses observed browser behavior, the public HTML/bootstrap
station data, public asset URLs, and focused inspection of shipped JavaScript
and CSS. Original application bundles are not copied into lofeur.

## Evidence

- REA controlled browser capture, 1440 × 900, Chromium 155:
  `ev_21343674ed56f8238587bd5a384aebf18f94dfb8b2c18b9f64378a51ab870626`.
  Initial document, onboarding gate, station data and asset references observed.
- Manual browser inspection covered onboarding, the resulting desktop, cookie
  choice, station panel, soundscape controls and Pomodoro.
- REA local mobile capture, 390 × 844:
  `ev_9b669e2c522d044c638642bb6786a582c5de44df5ac5283aa89f5508256b8688`.
  No page errors; screenshot saved in `docs/assets/preview-mobile.png`.
- Local browser verification: YouTube playing state reached, ambient rain playing,
  station add/delete, timer start/reset and desktop screenshot.

These observations support the documented features. They do not establish
pixel-for-pixel equivalence or exhaustively verify every live station's current
availability. External streams can change after inspection.

## Feature mapping

| Reference behavior                                        | lofeur                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Full-screen study scene and live YouTube video            | Same scene sources; official YouTube IFrame API                          |
| Translucent chocolate panels, cream type, Gopher / Bolota | Reimplemented in CSS                                                     |
| Radio list with favorite controls                         | 18 public stations, all immediately available                            |
| Restricted radios behind account gate                     | No account gate; only public `youtube_slug` values used                  |
| Current song artist, title and artwork                    | Public now-playing API, refreshed every 30 seconds                       |
| Previous / next, volume, mute, external player link       | Included, with added explicit play / pause                               |
| Ambient audio mixer                                       | Same 12 WAV sources, independent volumes, favorites, master and stop all |
| Pomodoro                                                  | 25 / 5 / 15 and 50 / 10 / 20 modes, 8 phases, pause/reset, alarm level   |
| Fullscreen and themes                                     | Included                                                                 |
| Editable radio list                                       | Added local CRUD, search, JSON import/export and restore defaults        |
| Hidden interface                                          | Added focus view and keyboard shortcuts                                  |
| Chat, account, notes, to-dos, shop, announcements         | Omitted                                                                  |
| Analytics, session recording, viewer-count service        | Omitted                                                                  |

No private endpoints, authentication flow, account data, payment flow, or unlisted
YouTube IDs are used. The visible live indicator describes playback state rather
than displaying a fabricated viewer count. Track metadata is refreshed every 30 seconds from the public now-playing API,
with a backup host. Custom station URLs use the title exposed by YouTube.
The reference uses WebSockets for track updates; lofeur uses HTTP polling.

## External source contracts

- YouTube player: https://developers.google.com/youtube/iframe_api_reference
- Public station catalog: `src/stations.json` (snapshot, user editable).
- Ambient files: `https://desk.lofigirl.com/sounds/soundscapes/{name}.wav`.
- Alarm files: `https://desk.lofigirl.com/sounds/pomodoro/{phase,complete}.mp3`.
- Track metadata: `https://radio.lofigirl.com/api/nowplaying/{shortcode}` with
  `radio-backup.lofigirl.com` as fallback, only for unchanged default stations.
- Fonts: `public/fonts/`; third-party rights are described in `THIRD_PARTY.md`.

Audio is streamed from the original sources. The ambient elements use native
HTMLAudio looping. Seamlessness depends on the recording and browser decoder.
Pomodoro uses absolute timestamps to recover across timer throttling and reloads;
alarms still depend on the browser allowing audio playback.

## Verification result

`npm run build` and all 18 Vitest cases passed. HTTP HEAD checks returned 200
for all 12 ambient WAV files and both alarm MP3s. Desktop and 390 × 844 mobile
layouts were inspected. Playback, live song metadata, a station add/delete cycle,
ambient playback and Pomodoro start/reset were verified in a real browser.
