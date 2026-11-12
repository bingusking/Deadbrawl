# Sprite tools

How new animation frames get into the game. All sprite frames live in `js/data/sprites_vish.js`, `sprites_rift.js` and `sprites_jacob.js`, which fill one `SPR` object (animation name → list of frames). Those files are the source of truth; `add_anim.py` picks the right one from the animation name (`rift_…`, `jacob_…`, everything else goes to Vish).

Needs Python 3 with `numpy`, `pillow` and `scipy` (`pip install numpy pillow scipy`).

## 1. Cut a sheet into frames

Work in a scratch folder (outputs land in the current folder as `hd_<name>.json`).

**Green-screen strip** (frames side by side on green):

```
python3 strip.py sheet.png rift_dash feet 6
```

Arguments: image, animation name, anchor (`feet` for anything touching the ground, `torso` for airborne poses), and optionally the number of frames if some poses overlap. Optional settings, put before the command:

| Setting | What it does |
|---|---|
| `REFH=560` | The character's standing height in pixels in this sheet, so it matches the in-game size (all fighters are the same height) |
| `PIXEL=1` | Sharp pixel scaling, no blur (use for runs and anything that looked soft) |
| `DESPILL=1` | Removes green fringe around edges |
| `KLO=25 KR=95` | How aggressively green is keyed out |

Example: `REFH=560 PIXEL=1 DESPILL=1 python3 strip.py run.png rift_run feet 8`

**Transparent grid** (e.g. a 5×5 sheet on transparent or white):

```
python3 grid.py sheet.png jacob_idle 5 5
```

## 2. Add the frames to the game

From the repo root:

```
python3 tools/sprites/add_anim.py path/to/hd_rift_dash.json
```

The animation name comes from the file name (`hd_rift_dash.json` → `rift_dash`), or pass a name as a second argument. Add `--flip` if the frames face the wrong way. Re-adding a name replaces it.

## 3. Use it in code

The game picks frames per character in `js/game/moves.js` (`riftFrame`, `jacobFrame`) and `js/game/sprites.js` (`spriteFrame` for Vish). Point the relevant state or move at the new animation name there.

## sources/

The green-screen sheets used for existing Rift and Jacob animations, kept so they can be re-cut.
