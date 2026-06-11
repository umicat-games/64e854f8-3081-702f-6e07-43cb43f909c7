# Game: Auto-Runner Platformer

## Genre & Core Mechanic
Auto-runner. The player moves forward constantly; the only input is jump (Space or click/tap). Hit a spike = game over.

## Features Implemented
- Scene-as-data world (`public/scenes/world/main.json`)
- Platform entity (`e-mq9g3ou3-jurs`, role: "platform") — large blue rect spanning x=0–1383 at y=675
- Player entity (`e-mq9g4mby-vgoc`, role: "player") — yellow 30×30 rect
- Obstacle entity (`e-mq9gzi8s-yynw`, role: "obstacle") — red spike triangle, code-rendered
- Static arcade physics bodies on all `role: "platform"` and `role: "obstacle"` entities
- Dynamic arcade bodies (gravity 600 + world bounds) on all `role: "player"` entities
- Collider between player and platform; overlap between player and obstacle → game over
- Auto-run: player always moves right at PLAYER_SPEED
- Jump control: Space key or mouse/touch click — only fires when touching the ground
- Camera follows the player forward; clamped to world bounds (stops at right edge of platform)
- Game over screen: dark overlay + "GAME OVER" text + restart prompt; restart on tap/Space

## Key Implementation Details
- **World size**: 1383×720
- **Obstacle render script**: `src/visuals/obstacle.ts` — draws a red upward-pointing spike triangle (40×40). Params: `color`, `shadowColor`.
- **Game over flow**: `triggerGameOver()` stops player, flashes red, shows overlay/text fixed to camera view, then listens for tap/Space to restart via `scene.restart()`.
- **gameOver flag**: prevents update loop from running and double-triggering game over.
- **Player references**: `this.player` (Arcade.Body), `this.playerObj` (GameObject).
- **Jump guard**: `body.blocked.down` ensures jump only fires when on ground.
- **Constants**: `PLAYER_SPEED = 280`, `JUMP_VELOCITY = -520`.
- **Role convention**: `role: "platform"` → static body; `role: "player"` → dynamic + auto-run; `role: "obstacle"` → static body + overlap → game over.

## What Changed This Turn
- Added `src/visuals/obstacle.ts` render script (red spike triangle)
- Converted entity `e-mq9gzi8s-yynw` to `kind: "code-rendered"` with role `"obstacle"`
- Wired static physics body on obstacles + overlap with player → game over
- Added `triggerGameOver()` with flash tween, dark overlay, restart on tap/Space
