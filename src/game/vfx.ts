import * as Phaser from 'phaser';

import { FIGHTING_UI_ATLAS_TEXTURE_KEY } from './fightingUiAtlas';

/** Render depth for combat VFX: above fighters, below the HUD. */
const VFX_DEPTH = 90;

/** Tint/spark colour keyed to the kind of impact. */
export type VfxColor = 'red' | 'gold' | 'blue';

const SPARK_FRAME: Record<VfxColor, string> = {
  red: 'icon-hit-red',
  gold: 'icon-hit-gold',
  blue: 'icon-hit-blue'
};

const FLASH_TINT: Record<VfxColor, number> = {
  red: 0xff5a5a,
  gold: 0xffd24a,
  blue: 0x7ec8ff
};

/**
 * Spawns a short-lived hit spark (an atlas impact icon) at a contact point that
 * pops in, scales up, and fades out. Used when an attack connects.
 * @param scene - The owning scene.
 * @param x - World x of the contact point.
 * @param y - World y of the contact point.
 * @param color - Spark colour (red clean hit, blue blocked, gold finisher).
 * @param scale - Peak display scale of the spark (default 1).
 */
export function spawnHitSpark(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: VfxColor = 'red',
  scale = 1
): void {
  const frame = SPARK_FRAME[color];
  if (!scene.textures.exists(FIGHTING_UI_ATLAS_TEXTURE_KEY)) {
    spawnImpactFlash(scene, x, y, color, 40 * scale);
    return;
  }

  const spark = scene.add
    .image(x, y, FIGHTING_UI_ATLAS_TEXTURE_KEY, frame)
    .setDepth(VFX_DEPTH)
    .setScrollFactor(1)
    .setScale(0.2 * scale)
    .setAngle(Phaser.Math.Between(-30, 30))
    .setAlpha(1);

  scene.tweens.add({
    targets: spark,
    scale: scale,
    alpha: 0,
    duration: 220,
    ease: 'Cubic.Out',
    onComplete: () => spark.destroy()
  });

  spawnImpactFlash(scene, x, y, color, 34 * scale);
}

/**
 * Spawns an expanding ring flash at a point that fades as it grows.
 * @param scene - The owning scene.
 * @param x - World x of the flash centre.
 * @param y - World y of the flash centre.
 * @param color - Flash tint.
 * @param radius - Peak radius in world pixels.
 */
export function spawnImpactFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: VfxColor,
  radius = 40
): void {
  const ring = scene.add
    .circle(x, y, radius * 0.3, FLASH_TINT[color], 0.55)
    .setDepth(VFX_DEPTH - 1)
    .setScrollFactor(1);

  scene.tweens.add({
    targets: ring,
    scale: 2.4,
    alpha: 0,
    duration: 260,
    ease: 'Cubic.Out',
    onComplete: () => ring.destroy()
  });
}

/**
 * Spawns a special-move charge burst around a fighter: concentric rings that
 * expand outward and fade, telegraphing the wind-up before the move executes.
 * @param scene - The owning scene.
 * @param x - World x of the fighter's centre.
 * @param y - World y of the fighter's centre (roughly mid-body).
 * @param color - Aura colour.
 */
export function spawnChargeAura(scene: Phaser.Scene, x: number, y: number, color: VfxColor = 'gold'): void {
  for (let index = 0; index < 3; index += 1) {
    const ring = scene.add
      .circle(x, y, 18, FLASH_TINT[color], 0)
      .setStrokeStyle(4, FLASH_TINT[color], 0.9)
      .setDepth(VFX_DEPTH - 1)
      .setScrollFactor(1)
      .setScale(1.6);

    scene.tweens.add({
      targets: ring,
      scale: 0.2,
      alpha: 0,
      delay: index * 120,
      duration: 420,
      ease: 'Sine.In',
      onComplete: () => ring.destroy()
    });
  }
}

/**
 * Spawns a dramatic KO / death explosion at the defeated fighter's position:
 * double crimson-gold shockwaves, KO flash core, and flying ember orbs.
 * @param scene - The owning scene.
 * @param x - World x of the defeated fighter's centre.
 * @param y - World y mid-body of the defeated fighter.
 * @param attackerFacing - Direction the finishing blow pushed toward (+1 or -1).
 */
export function spawnDeathBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  attackerFacing: 1 | -1 = 1
): void {
  const core = scene.add
    .circle(x, y, 24, 0xffffff, 0.9)
    .setDepth(VFX_DEPTH + 2)
    .setScrollFactor(1);

  scene.tweens.add({
    targets: core,
    scale: 2.8,
    alpha: 0,
    duration: 240,
    ease: 'Cubic.Out',
    onComplete: () => core.destroy()
  });

  [0xf43f5e, 0xfacc15].forEach((color, index) => {
    const wave = scene.add
      .circle(x, y, 20, color, 0)
      .setStrokeStyle(5 - index * 2, color, 0.95)
      .setDepth(VFX_DEPTH + 1)
      .setScrollFactor(1);

    scene.tweens.add({
      targets: wave,
      scale: 4.5 + index * 1.4,
      alpha: 0,
      delay: index * 80,
      duration: 480 + index * 120,
      ease: 'Cubic.Out',
      onComplete: () => wave.destroy()
    });
  });

  for (let i = 0; i < 16; i += 1) {
    const angle = Phaser.Math.FloatBetween(-Math.PI * 0.95, Math.PI * 0.35);
    const speed = Phaser.Math.FloatBetween(110, 320);
    const dx = Math.cos(angle) * speed * 0.55 + attackerFacing * Phaser.Math.FloatBetween(30, 120);
    const dy = Math.sin(angle) * speed * 0.55 - Phaser.Math.FloatBetween(30, 90);
    const color = i % 3 === 0 ? 0xfacc15 : i % 2 === 0 ? 0xf43f5e : 0xfb7185;
    const radius = Phaser.Math.Between(4, 9);

    const spark = scene.add
      .circle(x, y, radius, color, 0.95)
      .setDepth(VFX_DEPTH + 2)
      .setScrollFactor(1);

    scene.tweens.add({
      targets: spark,
      x: x + dx,
      y: y + dy,
      scale: 0.15,
      alpha: 0,
      duration: Phaser.Math.Between(380, 680),
      ease: 'Quad.Out',
      onComplete: () => spark.destroy()
    });
  }
}

/**
 * Spawns lateral dust clouds when a knocked-out fighter slams onto the ground.
 * @param scene - The owning scene.
 * @param x - World x of the impact point.
 * @param groundY - World y of the ground line.
 */
export function spawnGroundSlamDust(scene: Phaser.Scene, x: number, groundY: number): void {
  [-1, 1].forEach((dir) => {
    for (let i = 0; i < 3; i += 1) {
      const puff = scene.add
        .circle(x + dir * (14 + i * 16), groundY - 8, 12 - i * 2, 0xcbd5e1, 0.55)
        .setDepth(VFX_DEPTH - 1)
        .setScrollFactor(1);

      scene.tweens.add({
        targets: puff,
        x: puff.x + dir * Phaser.Math.Between(28, 68),
        y: puff.y - Phaser.Math.Between(12, 34),
        scale: 2.1,
        alpha: 0,
        duration: 360 + i * 70,
        ease: 'Cubic.Out',
        onComplete: () => puff.destroy()
      });
    }
  });
}

/**
 * Spawns sparkling golden/pink flight trail particles behind a flying striker.
 * @param scene - The owning scene.
 * @param x - World x of the fighter.
 * @param y - World y mid-body of the fighter.
 */
export function spawnFlyTrail(scene: Phaser.Scene, x: number, y: number): void {
  const color = Math.random() < 0.5 ? 0xfacc15 : 0xf472b6;
  const star = scene.add
    .circle(x + Phaser.Math.Between(-16, 16), y + Phaser.Math.Between(-28, 28), Phaser.Math.Between(5, 10), color, 0.85)
    .setDepth(VFX_DEPTH - 1)
    .setScrollFactor(1);

  scene.tweens.add({
    targets: star,
    scale: 0.1,
    alpha: 0,
    duration: 240,
    ease: 'Quad.Out',
    onComplete: () => star.destroy()
  });
}

/**
 * Fires a long-range electric lightning beam across the arena from the attacker.
 * @param scene - The owning scene.
 * @param x - Origin world x of the blast.
 * @param y - Origin world y of the blast.
 * @param direction - Blast direction (+1 right, -1 left).
 */
export function spawnThunderBeam(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: 1 | -1
): void {
  const length = 430;
  const centerX = x + direction * (length / 2);

  const outerBeam = scene.add
    .rectangle(x, y, 20, 34, 0x38bdf8, 0.85)
    .setOrigin(direction === 1 ? 0 : 1, 0.5)
    .setDepth(VFX_DEPTH + 1)
    .setScrollFactor(1);

  const innerBeam = scene.add
    .rectangle(x, y, 20, 14, 0xfef08a, 0.95)
    .setOrigin(direction === 1 ? 0 : 1, 0.5)
    .setDepth(VFX_DEPTH + 2)
    .setScrollFactor(1);

  scene.tweens.add({
    targets: [outerBeam, innerBeam],
    width: length,
    alpha: 0.1,
    duration: 280,
    ease: 'Cubic.Out',
    onComplete: () => {
      outerBeam.destroy();
      innerBeam.destroy();
    }
  });

  for (let i = 0; i < 8; i += 1) {
    const bolt = scene.add
      .circle(
        x + direction * Phaser.Math.Between(30, length),
        y + Phaser.Math.Between(-24, 24),
        Phaser.Math.Between(5, 11),
        i % 2 === 0 ? 0x38bdf8 : 0xfacc15,
        0.9
      )
      .setDepth(VFX_DEPTH + 2)
      .setScrollFactor(1);

    scene.tweens.add({
      targets: bolt,
      x: centerX + direction * Phaser.Math.Between(80, 240),
      scale: 0.1,
      alpha: 0,
      delay: i * 24,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => bolt.destroy()
    });
  }
}
