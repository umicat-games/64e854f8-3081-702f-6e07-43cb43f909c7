# Game: Auto-Runner Platformer

## Genre & Core Mechanic
Auto-runner. The player moves forward constantly; the only input is jump (Space or click/tap).

## Features Implemented
- Scene-as-data world (`public/scenes/world/main.json`)
- Platform entity (`e-mq9g3ou3-jurs`, role: "platform") — large blue rect spanning x=0–1383 at y=675
- Player entity (`e-mq9g4mby-vgoc`, role: "player") — yellow 30×30 rect
- Static arcade physics bodies on all `role: "platform"` entities
- Dynamic arcade bodies (gravity 600 + world bounds) on all `role: "player"` entities
- Collider between player and platform
- Auto-run: player always moves right at PLAYER_SPEED
- Jump control: Space key or mouse/touch click — only fires when touching the ground
- Camera follows the player forward; clamped to world bounds (stops at right edge of platform)

## Key Implementation Details
- **World size**: 1383×720 (matches the platform's right edge)
- **GameScene.ts**: After `loadWorldScene`, reads `sceneFile.world.width/height`, sets physics world bounds, wires platform static bodies + player dynamic bodies, starts camera follow with `setBounds` clamped to world size.
- **Player references**: `this.player` (Arcade.Body) for velocity control; `this.playerObj` (GameObject) for `cameras.main.startFollow`.
- **Jump guard**: `body.blocked.down` ensures jump only fires when on ground.
- **Constants**: `PLAYER_SPEED = 280`, `JUMP_VELOCITY = -520`.
- **Click/tap**: `pointerdown` event fires `setVelocityY(JUMP_VELOCITY)` directly.
- **Role convention**: `role: "platform"` → static solid body; `role: "player"` → dynamic body + auto-run + camera follow.

## What Changed This Turn
- Expanded world width (and camera bounds) from 1280 → 1383 to match the platform's right edge
- Physics world bounds synced to scene world size
- Camera now follows the player with `startFollow` + `setBounds`, stopping at the platform's end
