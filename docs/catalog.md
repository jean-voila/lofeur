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

`npm start` provides the cached availability API. Static hosting uses the checked
snapshot and runtime playback errors, but does not run periodic server probes.
The six-hour GitHub maintenance job synchronizes playlist additions, finds unique
replacement lives on the official channel, and runs tests/builds before committing.
When published from GitHub, configure deployment to rebuild after these catalog
commits; the maintenance job does not silently create or publish a hosting service.

Availability can vary by country or browser and can change between checks.
The runtime error path handles those differences. An unavailable station remains
editable so its URL can be corrected, and a refresh control can request a recheck.

The final implementation passed 46 tests, the production build, and the npm
audit. The production server returned the 92-source health snapshot and confirmed
the new Halloween URL as available and live.
