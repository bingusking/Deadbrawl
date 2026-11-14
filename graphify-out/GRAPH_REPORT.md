# Graph Report - deadbrawl  (2026-11-14)

## Corpus Check
- 26 files · ~16,767 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 371 nodes · 579 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6098a375`
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
- ult.js
- services
- Deadbrawl
- animation.js
- audio.js
- ai.js
- binds.js
- viewer.js
- loop.js
- build_arenas.py
- Deadbrawl: notes for Claude

## God Nodes (most connected - your core abstractions)
1. `Scene` - 13 edges
2. `runMove()` - 11 edges
3. `act()` - 11 edges
4. `stepFighter()` - 10 edges
5. `buildRig()` - 9 edges
6. `build_colosseum()` - 8 edges
7. `ultHit()` - 8 edges
8. `vishUltTick()` - 8 edges
9. `services` - 8 edges
10. `bindRender()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `3. Use it in code` --references--> `jacobFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `riftFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/moves.js
- `3. Use it in code` --references--> `spriteFrame()`  [INFERRED]
  tools/sprites/README.md → js/game/sprites.js

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "core.js"
Cohesion: 0.09
Nodes (27): BLOCKARMS, BOX(), buildRig(), cam, canvas, CYL(), dirQ(), gmap (+19 more)

### Community 1 - "game.js"
Cohesion: 0.15
Nodes (21): callout(), camLook, camPos, CHARS, cutin(), endMatch(), flash(), G (+13 more)

### Community 2 - "online.js"
Cohesion: 0.08
Nodes (40): addFx(), dust(), dustGeo, fx, muzzleFlash(), spark(), sparkGeo, trail() (+32 more)

### Community 3 - "fighters.js"
Cohesion: 0.12
Nodes (25): afterimage(), AIM_MOVES, aimDir(), applyHit(), burstKnife(), canBlock(), Fighter, overlap() (+17 more)

### Community 4 - "server.js"
Cohesion: 0.07
Nodes (25): dependencies, ws@^8.18.0, description, engines, node, main, name, scripts (+17 more)

### Community 5 - "menus.js"
Cohesion: 0.13
Nodes (28): act(), applySet(), cChoose(), charIntro(), CIDS, closeOvl(), cNav(), cReset() (+20 more)

### Community 6 - "moves.js"
Cohesion: 0.08
Nodes (15): CD, jacobFrame(), jacobRope(), jacobTick(), KNIFE_HIT, MOVES, riftFrame(), drawSprite() (+7 more)

### Community 8 - "ult.js"
Cohesion: 0.10
Nodes (30): arenaKnock(), blinkTo(), impactFrame(), KN, lashFinisher(), lashFire(), lashFireTick(), lashUltStart() (+22 more)

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
Cohesion: 0.16
Nodes (21): actionsFor(), AIMED, BIND_ALT, BIND_DEF, BIND_LBL, BIND_TABS, bindOf(), bindRender() (+13 more)

### Community 16 - "viewer.js"
Cohesion: 0.26
Nodes (9): CVDATA, cvInit(), CVMETA, cvName(), cvNav(), cvPlace(), cvShow(), cvStep() (+1 more)

### Community 19 - "build_arenas.py"
Cohesion: 0.08
Nodes (10): build_alley(), build_colosseum(), arcade(), bays(), P(), build_ring(), build_saloon(), hexc() (+2 more)

### Community 20 - "Deadbrawl: notes for Claude"
Cohesion: 0.50
Nodes (3): After changing code, Deadbrawl: notes for Claude, Finding code

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `impactFrame()` connect `ult.js` to `online.js`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Why does `splash()` connect `game.js` to `online.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `online.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07536231884057971 - nodes in this community are weakly interconnected._
- **Why does `stars()` connect `fighters.js` to `online.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `fighters.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12258064516129032 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06881720430107527 - nodes in this community are weakly interconnected._