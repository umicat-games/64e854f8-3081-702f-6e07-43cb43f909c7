# Geometry Dash Clone

## Game info
- **Title**: Geometry Dash Clone
- **Genre**: Auto-runner / rhythm platformer
- **Core mechanic**: Auto-scrolling cube that jumps over spikes and blocks; SPACE / click to jump; die and restart.

## Implemented features
- Auto-scrolling player cube at constant speed (350 px/s)
- Single jump while grounded (SPACE, UP, W, or pointer click)
- Cube rotates while airborne; snaps to nearest 90° on landing
- Procedurally generated obstacles: single / double / triple spikes, short and tall blocks, gap-then-spike combos
- Difficulty ramps up as the level progresses (shrinking spawn gap)
- Death explosion: 22 flying shards + red screen flash; restarts after 1 s
- Jump dust particles on take-off
- Score display (% of 20 000 px level), persists best run across restarts
- Background grid decoration + ground glow line
- HUD: centered % score, top-right best %, bottom hint text

## Architecture
- **main.json** (`public/scenes/world/main.json`): single rect entity (role="ground") acts as the visual floor; world width 20 000
- **GameScene.ts**: all gameplay logic (physics, obstacles, input, camera, HUD)
  - `playerPhys`: invisible `Phaser.GameObjects.Rectangle` + dynamic arcade body
  - `playerGfx`: `Phaser.GameObjects.Graphics` synced to `playerPhys.x/y`, rotated by `cubeAngle`
  - `groundGroup`: static group with one item sized to full level width; matched to visual ground
  - `obstacleGroup`: static group; items created lazily via `spawnObstacle()` in `update()`
  - Camera follows `playerPhys` with +20% horizontal offset (player sits ~1/4 from left)
  - `bestPct` is NOT reset in `init()` so it persists across scene restarts

## Controls
- SPACE / UP / W / tap/click → jump (only when on ground)

## This turn
- Set selected rect entity as platform (`role: "ground"`, expanded to 20 000 × 80 px, repositioned to y=680)
- Built full Geometry Dash core: auto-scroll, jump, cube rotation, procedural obstacles, death/respawn, score HUD
