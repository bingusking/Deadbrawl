# Graph Report - deadbrawl  (2026-11-14)

## Corpus Check
- 25 files · ~9,219 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 316 nodes · 479 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62de602d`
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
- ult.js
- services
- Fighter
- Deadbrawl
- animation.js
- audio.js
- ai.js
- binds.js
- viewer.js
- loop.js
- stage.js
- Deadbrawl: notes for Claude

## God Nodes (most connected - your core abstractions)
1. `runMove()` - 11 edges
2. `act()` - 11 edges
3. `stepFighter()` - 10 edges
4. `buildRig()` - 9 edges
5. `services` - 8 edges
6. `bindRender()` - 7 edges
7. `goOnline()` - 7 edges
8. `startMove()` - 6 edges
9. `applyHit()` - 6 edges
10. `netLost()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `3. Use it in code` --references--> `riftFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `jacobFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `spriteFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/sprites.js

## Import Cycles
- None detected.

## Communities (21 total, 3 thin omitted)

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
Cohesion: 0.15
Nodes (24): afterimage(), AIM_MOVES, aimDir(), applyHit(), burstKnife(), canBlock(), overlap(), projectiles (+16 more)

### Community 4 - "server.js"
Cohesion: 0.11
Nodes (14): BOOT, CHARS, files, fs, http, load(), path, send() (+6 more)

### Community 5 - "menus.js"
Cohesion: 0.14
Nodes (27): act(), applySet(), cChoose(), charIntro(), CIDS, closeOvl(), cNav(), cReset() (+19 more)

### Community 6 - "moves.js"
Cohesion: 0.08
Nodes (15): CD, jacobFrame(), jacobRope(), jacobTick(), KNIFE_HIT, MOVES, riftFrame(), drawSprite() (+7 more)

### Community 7 - "package.json"
Cohesion: 0.18
Nodes (11): dependencies, ws@^8.18.0, description, engines, node, main, name, scripts (+3 more)

### Community 8 - "ult.js"
Cohesion: 0.14
Nodes (20): arenaKnock(), blinkTo(), KN, lashFinisher(), lashFire(), lashFireTick(), lashUltStart(), lashUltTick() (+12 more)

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

### Community 15 - "binds.js"
Cohesion: 0.18
Nodes (18): actionsFor(), AIMED, BIND_ALT, BIND_DEF, BIND_LBL, BIND_TABS, bindOf(), bindRender() (+10 more)

### Community 16 - "viewer.js"
Cohesion: 0.26
Nodes (9): CVDATA, cvInit(), CVMETA, cvName(), cvNav(), cvPlace(), cvShow(), cvStep() (+1 more)

### Community 18 - "stage.js"
Cohesion: 0.25
Nodes (8): arena0, ARENA_TEX, ARENAS, arenaWipe(), backdrop, buildStage(), setArena(), skyMat()

### Community 20 - "Deadbrawl: notes for Claude"
Cohesion: 0.50
Nodes (3): After changing code, Deadbrawl: notes for Claude, Finding code

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `stars()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Why does `splash()` connect `game.js` to `online.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
- **Why does `shotFx()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `online.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._
- **Should `fighters.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._