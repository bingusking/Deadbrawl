# Deadbrawl: notes for Claude

Browser 2D fighting game (Vish, Rift, Jacob) with CPU, training and online modes. See README.md for the file table.

## Finding code
1. Read `graphify-out/GRAPH_REPORT.md` (or query `graphify-out/graph.json`) to find which file and function handles something.
2. Then open only the file(s) you need. Abilities live in `js/game/fighters.js`, move numbers in `js/game/moves.js`, CPU in `js/game/ai.js`.
3. `js/data/` is generated sprite/portrait data (11MB). Never read it whole.

## After changing code
- Run `graphify update .` so the map stays current (no API key needed; `.graphifyignore` skips the data files).
- Test with `npm start` and open http://localhost:3000.
