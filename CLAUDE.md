# Game: Auto-Runner Platformer

## Genre & Core Mechanic
Auto-runner. The player moves forward constantly; the only input is jump (Space or click/tap).

## Features Implemented
- Scene-as-data world (`public/scenes/world/main.json`)
- Platform entity (`e-mq9g3ou3-jurs`, role: "platform") — large blue rect at y=675, solid ground
- Player entity (`e-mq9g4mby-vgoc`, role: "player") — yellow 30×30 rect
- Static arcade physics bodies on all `role: "platform"` entities
- Dynamic arcade bodies (gravity 600 + world bounds) on all `role: "player"` entities
- Collider between player and platform
- Auto-run: player always moves right at PLAYER_SPEED
- Jump control: Space key or mouse/touch click — only fires when touching the ground

## Key Implementation Details
- **GameScene.ts**: After `loadWorldScene`, wires static bodies to platforms, dynamic bodies with gravity to players, registers colliders, then drives auto-run + jump input in `update()`.
- **Player body reference**: stored as `this.player` (Arcade.Body) for update loop access.
- **Jump guard**: `body.blocked.down` ensures jump only fires when on ground.
- **Constants**: `PLAYER_SPEED = 280`, `JUMP_VELOCITY = -520`.
- **Click/tap**: `pointerdown` event fires `setVelocityY(JUMP_VELOCITY)` directly.
- **Role convention**: `role: "platform"` → static solid body; `role: "player"` → dynamic body + auto-run.

## What Changed This Turn
- Removed left/right keyboard controls; player now auto-runs at constant speed
- Jump reduced to Space key or pointer click/tap only
- Increased PLAYER_SPEED from 220 → 280 to suit auto-runner feel
