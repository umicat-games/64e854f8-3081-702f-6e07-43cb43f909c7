import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry } from '@umicat/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const PLAYER_SPEED = 220;
const JUMP_VELOCITY = -520;

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
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player: Phaser.Physics.Arcade.Body | null = null;

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

    // ── Physics wiring ────────────────────────────────────────────────
    const registry = getEntityRegistry(this);

    // Give every platform-role entity a static arcade body.
    const platformObjs = (registry?.byRole('platform') ?? []) as Phaser.GameObjects.GameObject[];
    for (const obj of platformObjs) {
      this.physics.add.existing(obj, true); // true = static body
    }

    // Give every player-role entity a dynamic arcade body + gravity,
    // then collide it with all platforms.
    const playerObjs = (registry?.byRole('player') ?? []) as Phaser.GameObjects.GameObject[];
    for (const playerObj of playerObjs) {
      this.physics.add.existing(playerObj, false);
      const body = (playerObj as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body;
      body.setGravityY(600);
      body.setCollideWorldBounds(true);
      for (const platformObj of platformObjs) {
        this.physics.add.collider(playerObj, platformObj);
      }
      // Store reference to first player body for input handling.
      if (!this.player) this.player = body;
    }

    // ── Input setup ──────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_time: number, _delta: number): void {
    if (!this.player) return;

    const body   = this.player;
    const left   = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right  = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump   = Phaser.Input.Keyboard.JustDown(this.cursors.up)  ||
                   Phaser.Input.Keyboard.JustDown(this.wasd.up)      ||
                   Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const onGround = body.blocked.down;

    // Horizontal movement
    if (left)       body.setVelocityX(-PLAYER_SPEED);
    else if (right) body.setVelocityX(PLAYER_SPEED);
    else            body.setVelocityX(0);

    // Jump — only when touching ground
    if (jump && onGround) {
      body.setVelocityY(JUMP_VELOCITY);
    }
  }
}
