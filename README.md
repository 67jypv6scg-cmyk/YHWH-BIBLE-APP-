# Noble Vine Study & Discipleship (2.0 beta)
From Noble Vine Restoration Ministries.

Open the app: https://67jypv6scg-cmyk.github.io/YHWH-BIBLE-APP-/

## How the files fit together
All files sit in this one folder. `index.html` loads the stylesheet `app.css` and the feature files in this order:
errors, books, storage, import, reading, names, search, sheets, notes, plans, hebrew, compare, alphabet, voice, home, teach,
commentary, memory, votd, tracker, bible-import, tidy, versions, menu, prophecy, logo, brand, oneoff, backup, favs, themes,
music, update, start. `spotify-dock.js` loads only when Spotify is chosen in Settings.

## Releasing a new version
1. Change the version number in `index.html` (every `?v=`) and in `sw.js` (`VERSION`).
2. Upload all changed files together in one commit.
3. Note the changes in `CHANGELOG.md`.

Personal data (Bible text, notes, prophetic words, recordings) is kept on each device, never in this repository.
