import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry } from '@umicat/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const PLAYER_SPEED = 280;
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
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private player: Phaser.Physics.Arcade.Body | null = null;
  private playerObj: Phaser.GameObjects.GameObject | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
  }

  async create(): Promise<void> {
    const { sceneFile } = await loadWorldScene(this, this.sceneId);
    const worldWidth  = sceneFile.world?.width  ?? GAME_WIDTH;
    const worldHeight = sceneFile.world?.height ?? GAME_HEIGHT;

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
      // Store reference to first player body + game object for input + camera.
      if (!this.player) {
        this.player    = body;
        this.playerObj = playerObj;
      }
    }

    // ── Camera ───────────────────────────────────────────────────────
    // Align physics world bounds with the scene world size.
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    if (this.playerObj) {
      // Follow the player; clamp to world bounds so the camera stops
      // at the right edge of the platform.
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      this.cameras.main.startFollow(
        this.playerObj as Phaser.GameObjects.GameObject,
        true,   // roundPixels
        1,      // lerpX — snap instantly on X
        1,      // lerpY — snap instantly on Y
      );
    }

    // ── Input setup ──────────────────────────────────────────────────
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Click / tap also triggers a jump
    this.input.on('pointerdown', () => {
      if (this.player?.blocked.down) {
        this.player.setVelocityY(JUMP_VELOCITY);
      }
    });
  }

  update(_time: number, _delta: number): void {
    if (!this.player) return;

    const body = this.player;

    // Auto-run: always move forward at constant speed
    body.setVelocityX(PLAYER_SPEED);

    // Jump via Space — only when on the ground
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && body.blocked.down) {
      body.setVelocityY(JUMP_VELOCITY);
    }
  }
}
