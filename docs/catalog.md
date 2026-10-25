# Catalog availability

On 25 October 2026 the original Halloween source `1-LpQekNa9g` reported
`UNPLAYABLE` with “This live stream recording is not available.” Its oEmbed still
returned 200, demonstrating why oEmbed alone is not an availability check.
The current official live is `0sfDth4lMLc`. The known replacement is migrated only
for the recognized default station and URL; custom sources are not overwritten.

All 18 radio YouTube pages and direct audio endpoints passed the current audit.
The requested playlist `PL6NdkXsPL07KN01gH2vucrHCEyyNmVEx4` contained 74 recordings,
all playable in the audit. The total initial catalog is 92 sources. The source
channel ID is checked against `UCSJ4gkVC6NrvII8umztf0Ow` during synchronization.

The backend parses public YouTube player metadata without running page scripts.
It distinguishes active lives, recordings, embedding restrictions, removed videos
and offline streams. Verification blocked by a bot challenge or a network error
remains unknown / last known instead of falsely disabling every source.
Direct audio probes stop after response headers and release the body immediately.

The browser combines these results with actual playback errors, scoped to mode
and URL. A missing audio URL for a recording means “YouTube video required,” not
“unavailable.” No hidden YouTube players are created to probe the catalog.

The application is now entirely static. The six-hour GitHub maintenance job
synchronizes playlist additions, finds unique replacement lives on the official
channel, and runs tests/builds before committing. A successful run triggers the
Pages workflow, which deploys only when publication is explicitly enabled.
Visitors read the resulting static JSON snapshot every five minutes while visible.
The refresh control rereads that snapshot; it does not launch a server audit.

The Node-only probe code in `maintenance/` runs during development or in GitHub
Actions, never in a visitor's tab or a production application server. See
`github-pages.md` for the static deployment lifecycle.

Availability can vary by country or browser and can change between checks.
The runtime error path handles those differences. An unavailable station remains
editable so its URL can be corrected, and a refresh control can request a recheck.

The final implementation passed 46 tests, the production build, and the npm
audit. The production server returned the 92-source health snapshot and confirmed
the new Halloween URL as available and live.
