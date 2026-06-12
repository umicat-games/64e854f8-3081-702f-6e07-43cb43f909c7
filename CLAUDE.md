# Game: Unnamed (level1 scene)

## Genre / Mechanic
Early-stage game with a single world scene (`level1`). No player or core mechanic defined yet.

## Features Implemented
- Scene-as-data architecture with `public/scenes/world/level1.json`
- Orange rect (`e-mqa9j80o-rj0d`) continuously spins at 90°/second

## Key Implementation Details
- `GameScene.ts` uses `loadWorldScene` + `getEntityRegistry` from the SDK
- `spinningRect` is looked up by entity ID in `create()` and rotated each frame in `update()` via `sprite.angle += 90 * (delta / 1000)`

## Last Turn
- Added auto-spin behavior to the selected rect entity (id: `e-mqa9j80o-rj0d`) — rotates 90 degrees per second continuously
