# Deadbrawl

A 2D browser fighting game with three fighters (Vish, Rift, The Lash), a CPU mode, a training dummy and online matchmaking.

## Run locally

```
npm install
npm start
```

Then open http://localhost:3000. Open it in two tabs and pick **Online** in both to test matchmaking.

## Code layout

| Path | What's in it |
|---|---|
| `index.html` | Page markup and styles (menus, HUD, character select) |
| `js/game/core.js` | Shared helpers, renderer, scenes |
| `js/game/moves.js` | Move data: frame timings, damage, reach, hit reactions |
| `js/game/fighters.js` | Fighter state machine, character abilities (Vish, Rift, The Lash), hits, grabs |
| `js/game/ult.js` | Ultimates (R with a full ULT meter): Rift's Phantom Rush |
| `js/game/sprites.js` | Sprite drawing and per-character frame mapping |
| `js/game/animation.js` | Animation timing |
| `js/game/ai.js` | CPU opponent |
| `js/game/game.js` | Rounds, match flow, camera, main tick |
| `js/game/online.js` | Online sync (host streams state, guest sends inputs) |
| `js/game/menus.js` | Menus, character select, input handling |
| `js/game/audio.js`, `stage.js`, `fx.js`, `viewer.js`, `loop.js` | Sound, arena, effects, character viewer, frame loop |
| `js/data/` | Sprite frames and HUD portraits (generated, large) |
| `js/lib/three.min.js` | Three.js r128 |
| `assets/` | HUD frame and menu art |
| `server.js` | Serves the files and runs matchmaking |
| `tools/sprites/` | Scripts that cut sprite sheets into frames and add them to the game (see its README) |

The game scripts are plain scripts loaded in order (see the bottom of `index.html`) and share top-level names.

## Online play

The server pairs the first two players in the queue. Each player locks a different fighter. The first player in the queue hosts the fight and streams the game state to the second.

## Deploy

`render.yaml` sets this up as a free Render web service (`npm install`, then `node server.js`).
