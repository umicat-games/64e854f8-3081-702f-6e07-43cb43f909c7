import Phaser from 'phaser';
import { loadWorldScene } from '@umicat/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ── Constants ──────────────────────────────────────────────────────────────────
const PLAYER_SPEED = 350;
const JUMP_VEL     = -740;
const EXTRA_GRAV   = 1500;   // added on top of world gravity
const CUBE_SIZE    = 40;
const LEVEL_W      = 20000;
const GROUND_TOP   = 640;    // y of the top surface of the ground

// ── Scene ──────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private playerPhys!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private playerGfx!:  Phaser.GameObjects.Graphics;
  private cubeAngle = 0;

  // World
  private groundGroup!:   Phaser.Physics.Arcade.StaticGroup;
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private nextObstX = 800;
  private spawnGap  = 280;

  // State
  private alive         = true;
  private deathHandled  = false;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!:  Phaser.GameObjects.Text;
  private bestPct = 0;        // intentionally NOT reset on restart

  // FX
  private flashGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId     = data.sceneId;
    this.alive        = true;
    this.deathHandled = false;
    this.cubeAngle    = 0;
    this.nextObstX    = 800;
    this.spawnGap     = 280;
  }

  // ── create ─────────────────────────────────────────────────────────────────
  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    // Blank 4×4 texture used for invisible physics bodies
    const blankGfx = this.add.graphics();
    blankGfx.fillStyle(0xffffff);
    blankGfx.fillRect(0, 0, 4, 4);
    blankGfx.generateTexture('blank', 4, 4);
    blankGfx.destroy();

    // ── Physics ground (matches visual ground in scene JSON) ───────────────
    this.groundGroup = this.physics.add.staticGroup();
    const gItem = this.groundGroup.create(
      LEVEL_W / 2, GROUND_TOP + 40, 'blank'
    ) as Phaser.Physics.Arcade.Image;
    (gItem.body as Phaser.Physics.Arcade.StaticBody).setSize(LEVEL_W, 80);
    gItem.refreshBody();
    gItem.setAlpha(0);

    // ── Obstacle group ─────────────────────────────────────────────────────
    this.obstacleGroup = this.physics.add.staticGroup();

    // ── Player physics rectangle ───────────────────────────────────────────
    this.playerPhys = this.add.rectangle(
      200, GROUND_TOP - CUBE_SIZE / 2, CUBE_SIZE, CUBE_SIZE, 0x000000, 0
    );
    this.playerPhys.setDepth(5);
    this.physics.add.existing(this.playerPhys);
    this.playerBody = this.playerPhys.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setGravityY(EXTRA_GRAV);
    this.playerBody.setMaxVelocityY(1200);
    this.playerBody.setVelocityX(PLAYER_SPEED);
    this.playerBody.setCollideWorldBounds(false);

    // ── Player visual ──────────────────────────────────────────────────────
    this.playerGfx = this.add.graphics().setDepth(6);
    this.drawCube();

    // ── Colliders ──────────────────────────────────────────────────────────
    this.physics.add.collider(this.playerPhys, this.groundGroup);
    this.physics.add.overlap(
      this.playerPhys, this.obstacleGroup,
      () => this.die(), undefined, this
    );

    // ── Background grid decoration ─────────────────────────────────────────
    const bgGfx = this.add.graphics().setDepth(0);
    bgGfx.lineStyle(1, 0x3344aa, 0.12);
    for (let x = 0; x < LEVEL_W; x += 100) bgGfx.lineBetween(x, 0, x, GROUND_TOP);
    for (let y = 0; y < GROUND_TOP; y += 100) bgGfx.lineBetween(0, y, LEVEL_W, y);
    // Ground glow line
    bgGfx.lineStyle(3, 0x88aaff, 0.9);
    bgGfx.lineBetween(0, GROUND_TOP, LEVEL_W, GROUND_TOP);
    // Ground top-stripe accent
    bgGfx.fillStyle(0x3355cc, 1);
    bgGfx.fillRect(0, GROUND_TOP, LEVEL_W, 4);

    // ── Screen flash overlay (fixed to camera) ─────────────────────────────
    this.flashGfx = this.add.graphics().setDepth(900).setScrollFactor(0).setAlpha(0);

    // ── HUD ────────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(GAME_WIDTH / 2, 24, '0%', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      stroke: '#000033',
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.bestText = this.add.text(GAME_WIDTH - 16, 16, 'Best: ' + this.bestPct + '%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#aaaaff',
      stroke: '#000033',
      strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Hint label
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'SPACE / CLICK to jump', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    }).setAlpha(0.5).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);

    // ── Input ──────────────────────────────────────────────────────────────
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on('down', this.tryJump, this);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
      .on('down', this.tryJump, this);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      .on('down', this.tryJump, this);
    this.input.on('pointerdown', this.tryJump, this);

    // ── Camera ─────────────────────────────────────────────────────────────
    // setBounds already set by scene JSON, but ensure it matches level width
    this.cameras.main.setBounds(0, 0, LEVEL_W, GAME_HEIGHT);
    // Follow horizontally; offset so player sits ~1/4 from left edge
    this.cameras.main.startFollow(this.playerPhys, false, 0.1, 1);
    this.cameras.main.setFollowOffset(GAME_WIDTH * 0.2, 0);

    // ── Pre-spawn first stretch of obstacles ───────────────────────────────
    while (this.nextObstX < 4000) this.spawnObstacle();
  }

  // ── Cube drawing ───────────────────────────────────────────────────────────
  private drawCube(): void {
    const g = this.playerGfx;
    g.clear();
    const s = CUBE_SIZE;
    const h = s / 2;
    // Body
    g.fillStyle(0xf7aa1e);
    g.fillRect(-h, -h, s, s);
    // Highlight
    g.fillStyle(0xffe066, 0.65);
    g.fillRect(-h, -h, s, s / 5);
    g.fillRect(-h, -h, s / 5, s);
    // Inner square outline
    g.lineStyle(2, 0x000000, 0.35);
    g.strokeRect(-h + 6, -h + 6, s - 12, s - 12);
    // Corner circles
    g.fillStyle(0x000000, 0.28);
    const r = 4, o = 8;
    g.fillCircle(-h + o, -h + o, r);
    g.fillCircle( h - o, -h + o, r);
    g.fillCircle(-h + o,  h - o, r);
    g.fillCircle( h - o,  h - o, r);
  }

  // ── Obstacle spawning ──────────────────────────────────────────────────────
  private spawnObstacle(): void {
    const x    = this.nextObstX;
    const roll = Phaser.Math.Between(0, 7);

    if (roll === 0) {
      // Single spike
      this.makeSpike(x, 40, 40);
      this.nextObstX = x + 40 + this.spawnGap;

    } else if (roll <= 2) {
      // 2 spikes
      this.makeSpike(x,      40, 40);
      this.makeSpike(x + 40, 40, 40);
      this.nextObstX = x + 80 + this.spawnGap + 20;

    } else if (roll === 3) {
      // 3 spikes
      this.makeSpike(x,       40, 40);
      this.makeSpike(x + 40,  40, 40);
      this.makeSpike(x + 80,  40, 40);
      this.nextObstX = x + 120 + this.spawnGap + 60;

    } else if (roll === 4) {
      // Short block (1-cube tall)
      this.makeBlock(x, 40, 40);
      this.nextObstX = x + 40 + this.spawnGap;

    } else if (roll === 5) {
      // Tall block (2-cubes tall)
      this.makeBlock(x, 40, 80);
      this.nextObstX = x + 40 + this.spawnGap + 20;

    } else if (roll === 6) {
      // Gap then spike (forces a jump)
      this.makeSpike(x + 120, 40, 40);
      this.nextObstX = x + 160 + this.spawnGap;

    } else {
      // Spike then block close together
      this.makeSpike(x, 40, 40);
      this.makeBlock(x + 80, 40, 60);
      this.nextObstX = x + 120 + this.spawnGap + 40;
    }
  }

  private makeSpike(x: number, w: number, h: number): void {
    const gfx = this.add.graphics().setDepth(4);
    gfx.x = x;
    gfx.y = GROUND_TOP - h;
    // Main triangle
    gfx.fillStyle(0xff3333);
    gfx.fillTriangle(0, h, w / 2, 0, w, h);
    // Outline
    gfx.lineStyle(1, 0xff9999, 0.7);
    gfx.strokeTriangle(0, h, w / 2, 0, w, h);
    // Shine sliver
    gfx.fillStyle(0xffffff, 0.18);
    gfx.fillTriangle(4, h - 3, w / 2, 5, w - 4, h - 3);

    // Smaller hitbox (fair, not pixel-perfect)
    const bw = w * 0.50, bh = h * 0.65;
    const item = this.obstacleGroup.create(
      x + w / 2, GROUND_TOP - bh / 2 - (h - bh) * 0.5, 'blank'
    ) as Phaser.Physics.Arcade.Image;
    (item.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
    item.refreshBody();
    item.setAlpha(0);
  }

  private makeBlock(x: number, w: number, h: number): void {
    const gfx = this.add.graphics().setDepth(4);
    gfx.x = x;
    gfx.y = GROUND_TOP - h;
    // Body
    gfx.fillStyle(0x5566dd);
    gfx.fillRect(0, 0, w, h);
    // Top highlight
    gfx.fillStyle(0x8899ff, 0.5);
    gfx.fillRect(0, 0, w, 8);
    // Right / bottom shadow
    gfx.fillStyle(0x000000, 0.22);
    gfx.fillRect(w - 4, 0, 4, h);
    gfx.fillRect(0, h - 4, w, 4);
    // Outline
    gfx.lineStyle(2, 0x3344bb);
    gfx.strokeRect(0, 0, w, h);
    // Horizontal scan lines
    gfx.lineStyle(1, 0x8899ff, 0.2);
    for (let sy = 20; sy < h; sy += 20) gfx.lineBetween(0, sy, w, sy);

    const item = this.obstacleGroup.create(
      x + w / 2, GROUND_TOP - h / 2, 'blank'
    ) as Phaser.Physics.Arcade.Image;
    (item.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    item.refreshBody();
    item.setAlpha(0);
  }

  // ── Jump ───────────────────────────────────────────────────────────────────
  private tryJump(): void {
    if (!this.alive) return;
    if (this.playerBody.blocked.down) {
      this.playerBody.setVelocityY(JUMP_VEL);
      // Dust particles
      const cx = this.playerPhys.x;
      for (let i = 0; i < 7; i++) {
        const dot = this.add.graphics().setDepth(7);
        dot.fillStyle(0xf7aa1e, 0.85);
        dot.fillCircle(0, 0, Phaser.Math.Between(2, 5));
        dot.x = cx + Phaser.Math.Between(-18, 18);
        dot.y = GROUND_TOP;
        this.tweens.add({
          targets: dot,
          x: dot.x + Phaser.Math.Between(-28, 28),
          y: dot.y - Phaser.Math.Between(12, 32),
          alpha: 0,
          duration: Phaser.Math.Between(140, 280),
          onComplete: () => dot.destroy(),
        });
      }
    }
  }

  // ── Death ──────────────────────────────────────────────────────────────────
  private die(): void {
    if (this.deathHandled) return;
    this.deathHandled = true;
    this.alive = false;

    this.playerBody.setVelocity(0, 0);
    this.playerBody.setGravityY(0);
    this.playerGfx.setAlpha(0);

    // Explosion shards
    const cx = this.playerPhys.x;
    const cy = this.playerPhys.y;
    for (let i = 0; i < 22; i++) {
      const ang  = (i / 22) * Math.PI * 2;
      const dist = Phaser.Math.Between(40, 120);
      const sz   = Phaser.Math.Between(4, 13);
      const sh   = this.add.graphics().setDepth(8);
      sh.fillStyle(i % 2 === 0 ? 0xf7aa1e : 0xffd966);
      sh.fillRect(-sz / 2, -sz / 2, sz, sz);
      sh.x = cx;
      sh.y = cy;
      this.tweens.add({
        targets: sh,
        x: cx + Math.cos(ang) * dist,
        y: cy + Math.sin(ang) * dist,
        rotation: Phaser.Math.FloatBetween(-4, 4),
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: Phaser.Math.Between(400, 700),
        ease: 'Cubic.Out',
        onComplete: () => sh.destroy(),
      });
    }

    // Screen flash
    this.flashGfx.clear();
    this.flashGfx.fillStyle(0xff1111, 0.55);
    this.flashGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.flashGfx.setAlpha(1);
    this.tweens.add({ targets: this.flashGfx, alpha: 0, duration: 500 });

    this.time.delayedCall(1000, () => this.scene.restart({ sceneId: this.sceneId }));
  }

  // ── update ─────────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (!this.alive) return;

    // Keep horizontal speed constant
    this.playerBody.setVelocityX(PLAYER_SPEED);

    // Rotate cube while airborne; snap to 90° on landing
    if (!this.playerBody.blocked.down) {
      this.cubeAngle += delta * 0.005 * (PLAYER_SPEED / 350);
    } else {
      const snapped = Math.round(this.cubeAngle / (Math.PI / 2)) * (Math.PI / 2);
      this.cubeAngle += (snapped - this.cubeAngle) * 0.25;
    }

    // Sync visual to physics body (playerPhys.x/y = center because origin 0.5)
    this.playerGfx.x        = this.playerPhys.x;
    this.playerGfx.y        = this.playerPhys.y;
    this.playerGfx.rotation = this.cubeAngle;

    // Fell below world
    if (this.playerPhys.y > GAME_HEIGHT + 100) this.die();

    // Lazily spawn obstacles ahead of player
    while (this.nextObstX < this.playerPhys.x + GAME_WIDTH * 2.5) {
      this.spawnObstacle();
      this.spawnGap = Math.max(150, this.spawnGap - 0.4); // slowly increase difficulty
    }

    // Score (% of level)
    const pct = Math.min(100, Math.floor((this.playerPhys.x / LEVEL_W) * 100));
    this.scoreText.setText(pct + '%');
    if (pct > this.bestPct) {
      this.bestPct = pct;
      this.bestText.setText('Best: ' + this.bestPct + '%');
    }
  }
}
