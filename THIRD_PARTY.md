# Third-party content

lofeur is an independent project, not affiliated with or endorsed by Lofi Girl.
The original application logic in this repository was implemented separately;
Lofi Desk's JavaScript bundles are not included in the application.

| Content                                        | Source                                            | How it is used                                                                                         |
| ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Radio music and animation                      | Lofi Girl's public YouTube livestreams            | Official YouTube IFrame Player API; no audio extraction or downloaded music                            |
| Day / night study illustration                 | desk.lofigirl.com                                 | Remote image URLs in `src/lib.ts`                                                                      |
| Station covers                                 | cdn.lofigirl.com                                  | Remote image URLs in `src/stations.json`                                                               |
| Twelve ambient recordings and their thumbnails | desk.lofigirl.com                                 | Original public WAV/image URLs in `src/lib.ts`                                                         |
| Pomodoro alarm recordings                      | desk.lofigirl.com/sounds/pomodoro                 | Original public MP3 URLs                                                                               |
| Gopher and Bolota typefaces                    | Public webfont assets served by desk.lofigirl.com | Local files in `public/fonts/` to preserve the reference typography without cross-origin font failures |
| Icons                                          | Lucide                                            | ISC license, installed through npm                                                                     |
| lofeur logo                                    | Original SVG                                      | Included in the source license                                                                         |
| README banner                                  | Original AI-generated illustration                | Generation prompt and provenance in `docs/brand.md`                                                    |

The Lofi Girl media and third-party typefaces are not covered by this project's
MIT license. Public accessibility of a file does not establish redistribution
rights. No font license or media redistribution grant was supplied by the
reference website. Review these assets and obtain the appropriate permissions,
or replace them, before making the repository public or redistributing them.
Screenshots also contain third-party artwork.

Remote sources may change, be removed, or become unavailable. YouTube may show
its own branding, promotions, advertisements or embedded restrictions. lofeur
removes the original site's commerce widgets, announcements and account gates;
it does not alter the content inside YouTube streams.
