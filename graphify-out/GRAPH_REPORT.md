# Graph Report - deadbrawl  (2026-11-12)

## Corpus Check
- 23 files · ~7,365 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 259 nodes · 387 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc371bc6`
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
- Fighter
- services
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
2. `act()` - 11 edges
3. `buildRig()` - 9 edges
4. `stepFighter()` - 9 edges
5. `services` - 8 edges
6. `goOnline()` - 7 edges
7. `cvShow()` - 6 edges
8. `netLost()` - 6 edges
9. `phaseLogic()` - 5 edges
10. `splash()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `3. Use it in code` --references--> `riftFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `jacobFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `spriteFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/sprites.js

## Import Cycles
- None detected.

## Communities (19 total, 4 thin omitted)

### Community 0 - "core.js"
Cohesion: 0.09
Nodes (27): BLOCKARMS, BOX(), buildRig(), cam, canvas, CYL(), dirQ(), gmap (+19 more)

### Community 1 - "game.js"
Cohesion: 0.15
Nodes (20): callout(), camLook, camPos, CHARS, cutin(), endMatch(), flash(), G (+12 more)

### Community 2 - "online.js"
Cohesion: 0.12
Nodes (28): addFx(), dust(), dustGeo, fx, muzzleFlash(), spark(), sparkGeo, trail() (+20 more)

### Community 3 - "fighters.js"
Cohesion: 0.20
Nodes (18): afterimage(), applyHit(), burstKnife(), canBlock(), overlap(), projectiles, runMove(), shotgunFx() (+10 more)

### Community 4 - "server.js"
Cohesion: 0.11
Nodes (14): BOOT, CHARS, files, fs, http, load(), path, send() (+6 more)

### Community 5 - "menus.js"
Cohesion: 0.15
Nodes (26): act(), applySet(), cChoose(), charIntro(), CIDS, closeOvl(), cNav(), cReset() (+18 more)

### Community 6 - "moves.js"
Cohesion: 0.08
Nodes (15): CD, jacobFrame(), jacobRope(), jacobTick(), KNIFE_HIT, MOVES, riftFrame(), drawSprite() (+7 more)

### Community 7 - "package.json"
Cohesion: 0.18
Nodes (11): dependencies, ws@^8.18.0, description, engines, node, main, name, scripts (+3 more)

### Community 9 - "services"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

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

### Community 16 - "viewer.js"
Cohesion: 0.26
Nodes (9): CVDATA, cvInit(), CVMETA, cvName(), cvNav(), cvPlace(), cvShow(), cvStep() (+1 more)

### Community 20 - "Deadbrawl: notes for Claude"
Cohesion: 0.50
Nodes (3): After changing code, Deadbrawl: notes for Claude, Finding code

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `stars()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Why does `afterimage()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
- **Why does `burstKnife()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `online.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._