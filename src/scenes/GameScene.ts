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
  private gameOver = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    // scene.restart() reuses this Scene instance — clear the per-run
    // references here or the post-restart create() keeps the destroyed
    // previous run's body/GO (player stops moving, camera follows a ghost).
    this.player = null;
    this.playerObj = null;
    this.gameOver = false;
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

    // ── Obstacle collision → game over ───────────────────────────────
    const obstacleObjs = (registry?.byRole('obstacle') ?? []) as Phaser.GameObjects.GameObject[];
    for (const obs of obstacleObjs) {
      // The obstacle visual is a Graphics (code-rendered) — Graphics has no
      // origin/getTopLeft, so a static body attached to it can't be sized or
      // positioned reliably (StaticBody.reset() throws "getTopLeft is not a
      // function", which killed the whole scene boot). Use an invisible
      // static Zone centered on the obstacle as the collision proxy; the
      // Graphics stays purely visual.
      const g = obs as Phaser.GameObjects.Graphics;
      const hitZone = this.add.zone(g.x, g.y, 40, 40);
      this.physics.add.existing(hitZone, true);
      if (this.playerObj) {
        this.physics.add.overlap(
          this.playerObj,
          hitZone,
          () => { this.triggerGameOver(); },
        );
      }
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

  private triggerGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // Stop the player dead
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.player.setGravityY(0);
    }

    // Red flash on the player
    if (this.playerObj) {
      this.tweens.add({
        targets: this.playerObj,
        alpha: { from: 1, to: 0.1 },
        duration: 80,
        yoyo: true,
        repeat: 3,
      });
    }

    // Dark overlay
    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;
    const overlay = this.add
      .rectangle(camX + GAME_WIDTH / 2, camY + GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(1000);
    this.tweens.add({ targets: overlay, alpha: 0.6, duration: 400 });

    // "GAME OVER" text
    const goCfg = { fontSize: '64px', color: '#ff3e3e', fontStyle: 'bold' };
    this.add
      .text(camX + GAME_WIDTH / 2, camY + GAME_HEIGHT / 2 - 40, 'GAME OVER', goCfg)
      .setOrigin(0.5)
      .setDepth(1001);

    // Restart hint
    this.add
      .text(camX + GAME_WIDTH / 2, camY + GAME_HEIGHT / 2 + 40, 'tap or press Space to restart', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    // Restart on next tap / space after a short grace period
    this.time.delayedCall(600, () => {
      this.input.once('pointerdown', () => this.restartGame());
      this.input.keyboard!.once('keydown-SPACE', () => this.restartGame());
    });
  }

  private restartGame(): void {
    this.gameOver = false;
    this.scene.restart({ sceneId: this.sceneId });
  }

  update(_time: number, _delta: number): void {
    if (!this.player || this.gameOver) return;

    const body = this.player;

    // Auto-run: always move forward at constant speed
    body.setVelocityX(PLAYER_SPEED);

    // Jump via Space — only when on the ground
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && body.blocked.down) {
      body.setVelocityY(JUMP_VELOCITY);
    }
  }
}
