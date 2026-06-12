# Umicat Game

## Game Info
- **Title**: Umicat Game (untitled / in early development)
- **Genre**: TBD
- **Core Mechanic**: TBD — currently just a player entity placed in the world

## Features Implemented
- A single player entity (blue 64×64 rectangle prefab) placed in the scene
- Player automatically spins 180°/second (one full rotation every 2 seconds)

## Key Implementation Details
- **Architecture**: Scene-as-data (`public/scenes/manifest.json`, `public/scenes/world/main.json`)
- **Player prefab**: id `"player"`, kind `rect`, 64×64, fill `#4662D8`
- **Spin behavior**: In `GameScene.update()`, iterates `registry.byPrefabId('player')` and increments `.angle` by `180 * (delta / 1000)` each frame

## This Turn
- Added automatic spin to the player prefab via `update()` loop using `getEntityRegistry` + `byPrefabId('player')`
