# Game: Unnamed (level1 + level-2 scenes)

## Genre / Mechanic
Early-stage game with two world scenes (`level1`, `level-2`). No final core mechanic defined yet.

## Features Implemented
- Scene-as-data architecture with `public/scenes/world/level1.json` and `public/scenes/world/level-2.json`
- `level1`: Orange rect (`e-mqa9j80o-rj0d`) continuously spins at 90°/s
- `level-2`: Blue `player1` prefab rect auto-moves rightward at 200 px/s and stops flush with the right screen edge

## Key Implementation Details
- `GameScene.ts` uses `loadWorldScene` + `getEntityRegistry` from the SDK
- `spinningRect` is looked up by entity ID (`byId`) — scoped to level1
- `movingRect` is looked up by prefab ID (`byPrefabId('player1')`) — scoped to level-2
- Movement: `rect.x += 200 * (delta / 1000)`, clamped to `GAME_WIDTH - halfWidth`

## Last Turn
- Added auto-move-right behavior to the `player1` prefab rect in `level-2` — travels at 200 px/s and stops at the right edge of the screen
