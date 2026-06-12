# Game: Untitled

## Genre / Mechanic
Early-stage project — no defined game mechanic yet. Currently a single scene with one rect entity.

## Features Implemented
- Scene-as-data world scene ("main") with a blue rect at (504, 496)
- The rect has `role: "spinner"` and automatically rotates at 90°/second via the game loop

## Key Details
- All world entities live in `public/scenes/world/main.json`
- Spinner behavior: `GameScene.update()` iterates `registry.byRole('spinner')` and increments `.angle` each frame (90 deg/sec)

## Last Turn
- Added `role: "spinner"` to the rect entity in main.json
- Added update-loop rotation logic in GameScene.ts targeting all entities with role "spinner"
