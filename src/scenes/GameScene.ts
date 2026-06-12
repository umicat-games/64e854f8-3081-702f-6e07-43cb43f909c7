import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry } from '@umicat/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * GameScene — generic loader for world scene files (`scenes/world/*.json`).
 *
 * Takes a `sceneId` via init data and asks the SDK to spawn its entities,
 * configure the camera, and register them. Behavior code lives in
 * `update()` and per-role helpers; it looks entities up via the entity
 * registry rather than holding direct references to objects created here.
 *
 * Example (the agent writes this kind of thing in update or pointer
 * handlers, NOT in create — entities come from the scene file now):
 *
 * ```ts
 * const player = getEntityRegistry(this)?.byRole('player')[0];
 * if (player && this.input.keyboard?.checkDown(this.cursors.up)) {
 *   (player as Phaser.GameObjects.Sprite).y -= 4;
 * }
 * ```
 */
export class GameScene extends Phaser.Scene {
  private sceneId!: string;
  private spinningRect?: Phaser.GameObjects.Rectangle;
  private movingRects: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
  }

  async create(): Promise<void> {
    const { sceneFile } = await loadWorldScene(this, this.sceneId);

    if (sceneFile.entities.length === 0) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Describe your game\nin the chat!', {
          fontSize: '28px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5);
    }

    // Behavior wiring goes below this line.
    const registry = getEntityRegistry(this);
    const rectObj = registry?.byId('e-mqa9j80o-rj0d');
    if (rectObj) {
      this.spinningRect = rectObj as Phaser.GameObjects.Rectangle;
    }

    // player1 type: auto-move rightward until the screen edge. Type behavior
    // is scene-agnostic — every instance in whatever scene is loaded moves.
    this.movingRects = (registry?.byPrefabId('player1') ?? []) as Phaser.GameObjects.Rectangle[];
  }

  update(_time: number, delta: number): void {
    if (this.spinningRect) {
      this.spinningRect.angle += 90 * (delta / 1000); // 90 degrees per second
    }

    // Move every player1 instance rightward at 200 px/s; stop at the edge.
    for (const rect of this.movingRects) {
      if (!rect.active) continue;
      const speed = 200; // pixels per second
      const halfW = (rect.width * rect.scaleX) / 2;
      const maxX = GAME_WIDTH - halfW;
      if (rect.x < maxX) {
        rect.x = Math.min(rect.x + speed * (delta / 1000), maxX);
      }
    }
  }
}
