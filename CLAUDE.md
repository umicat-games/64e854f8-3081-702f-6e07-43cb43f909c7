# Game: Unnamed Platformer

## Genre & Core Mechanic
Side-scrolling platformer. Player stands on platforms, with gravity pulling them down.

## Features Implemented
- Scene-as-data world (`public/scenes/world/main.json`)
- Platform entity (role: "platform") — large blue rect at y=675 acting as solid ground
- Static arcade physics bodies automatically applied to all `role: "platform"` entities
- Dynamic arcade bodies (gravity + world bounds collision) automatically applied to all `role: "player"` entities
- Collider wired between all player-role and platform-role entities

## Key Implementation Details
- **GameScene.ts**: After `loadWorldScene`, looks up `byRole('platform')` and adds static physics bodies; looks up `byRole('player')` and adds dynamic bodies with gravity, then sets up colliders.
- **main.json entity roles**: `role: "platform"` on any rect/sprite makes it solid ground; `role: "player"` on any entity gives it dynamic physics + collision.
- **No player entity added yet** — adding a player-role entity in the scene will automatically get physics + platform collision.

## What Changed This Turn
- Added `role: "platform"` to entity `e-mq9g3ou3-jurs` (the large floor rect) in `main.json`
- Wired platform static bodies and player collision in `GameScene.ts`
