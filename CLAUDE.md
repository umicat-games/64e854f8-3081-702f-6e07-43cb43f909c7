# Game: Unnamed Platformer

## Genre & Core Mechanic
Side-scrolling platformer. Player has gravity, walks left/right, and jumps on platforms.

## Features Implemented
- Scene-as-data world (`public/scenes/world/main.json`)
- Platform entity (`e-mq9g3ou3-jurs`, role: "platform") — large blue rect at y=675, solid ground
- Player entity (`e-mq9g4mby-vgoc`, role: "player") — yellow 30×30 rect with gravity + collision
- Static arcade physics bodies on all `role: "platform"` entities
- Dynamic arcade bodies (gravity 600 + world bounds) on all `role: "player"` entities
- Collider between player and platform
- Keyboard controls: Arrow keys or WASD to move left/right, Up/W/Space to jump (only when on ground)

## Key Implementation Details
- **GameScene.ts**: After `loadWorldScene`, wires static bodies to platforms and dynamic bodies to players, registers colliders, then handles input each frame in `update()`.
- **Player body reference**: stored as `this.player` (Arcade.Body) for update loop access.
- **Jump guard**: `body.blocked.down` ensures the player can only jump when touching a platform.
- **Constants**: `PLAYER_SPEED = 220`, `JUMP_VELOCITY = -520` at top of file.
- **Role convention**: `role: "platform"` → static solid body; `role: "player"` → dynamic body + controls.

## What Changed This Turn
- Added `role: "player"` to entity `e-mq9g4mby-vgoc` and changed its color to yellow (#e8c84a)
- Re-confirmed `role: "platform"` on `e-mq9g3ou3-jurs` (was lost after editor interaction)
- Added `this.player`, `this.cursors`, `this.wasd` fields to GameScene
- Wired full keyboard movement (left/right/jump) in `update()`
