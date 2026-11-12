# Graph Report - deadbrawl  (2026-11-12)

## Corpus Check
- 23 files · ~6,424 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 240 nodes · 348 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a4db4ae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- core.js
- game.js
- online.js
- fighters.js
- server.js
- menus.js
- moves.js
- package.json
- fx.js
- services
- sprites.js
- Deadbrawl
- animation.js
- audio.js
- ai.js
- viewer.js
- loop.js
- stage.js
- Deadbrawl: notes for Claude

## God Nodes (most connected - your core abstractions)
1. `runMove()` - 11 edges
2. `stepFighter()` - 9 edges
3. `buildRig()` - 9 edges
4. `services` - 8 edges
5. `goOnline()` - 7 edges
6. `act()` - 7 edges
7. `netLost()` - 6 edges
8. `startMove()` - 5 edges
9. `tryAbility()` - 5 edges
10. `applyHit()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `3. Use it in code` --references--> `spriteFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/sprites.js
- `3. Use it in code` --references--> `riftFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `jacobFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "core.js"
Cohesion: 0.09
Nodes (27): BLOCKARMS, BOX(), buildRig(), cam, canvas, CYL(), dirQ(), gmap (+19 more)

### Community 1 - "game.js"
Cohesion: 0.15
Nodes (20): callout(), camLook, camPos, CHARS, cutin(), endMatch(), flash(), G (+12 more)

### Community 2 - "online.js"
Cohesion: 0.19
Nodes (20): goOnline(), GPR, guestProj(), guestTick(), NET, netClose(), netDec(), netEnc() (+12 more)

### Community 3 - "fighters.js"
Cohesion: 0.16
Nodes (19): afterimage(), applyHit(), burstKnife(), canBlock(), Fighter, overlap(), projectiles, runMove() (+11 more)

### Community 4 - "server.js"
Cohesion: 0.11
Nodes (14): BOOT, CHARS, files, fs, http, load(), path, send() (+6 more)

### Community 5 - "menus.js"
Cohesion: 0.24
Nodes (14): act(), cChoose(), charIntro(), CIDS, closeOvl(), cReset(), DIFFS, openOvl() (+6 more)

### Community 6 - "moves.js"
Cohesion: 0.10
Nodes (12): CD, jacobFrame(), jacobRope(), jacobTick(), KNIFE_HIT, MOVES, riftFrame(), 1. Cut a sheet into frames (+4 more)

### Community 7 - "package.json"
Cohesion: 0.18
Nodes (11): dependencies, ws@^8.18.0, description, engines, node, main, name, scripts (+3 more)

### Community 8 - "fx.js"
Cohesion: 0.25
Nodes (8): addFx(), dust(), dustGeo, fx, muzzleFlash(), spark(), sparkGeo, trail()

### Community 9 - "services"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 10 - "sprites.js"
Cohesion: 0.33
Nodes (3): drawSprite(), spriteFrame(), TEX

### Community 11 - "Deadbrawl"
Cohesion: 0.33
Nodes (5): Code layout, Deadbrawl, Deploy, Online play, Run locally

### Community 12 - "animation.js"
Cohesion: 0.70
Nodes (4): animFighter(), applyPose(), blendPose(), targetPose()

### Community 13 - "audio.js"
Cohesion: 0.60
Nodes (4): ac(), noise(), sfx, tone()

### Community 14 - "ai.js"
Cohesion: 0.67
Nodes (3): aiCore(), aiThink(), DIFF

### Community 20 - "Deadbrawl: notes for Claude"
Cohesion: 0.50
Nodes (3): After changing code, Deadbrawl: notes for Claude, Finding code

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `stars()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Why does `burstKnife()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
- **Why does `shotgunFx()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `moves.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._