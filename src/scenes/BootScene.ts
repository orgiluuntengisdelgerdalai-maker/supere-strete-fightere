import { preloadStarterAssets, registerStarterAnimations } from '../game/assets';
import { registerGeneratedAssets } from '../game/generatedAssets';
import { prepareMyFighters } from '../game/myFighterLoader';
import { registerTileAtlasFrames } from '../game/tileAtlas';
import { registerQuestUiAtlasFrames } from '../game/uiAtlas';
import { registerFightingUiAtlasFrames } from '../game/fightingUiAtlas';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload(): void {
    preloadStarterAssets(this);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.Boot);
    const { centerX, centerY } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0x020617);

    const title = this.add
      .text(centerX, centerY - 26, 'LOADING FIGHTERS...', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const barW = 320;
    const barH = 14;
    this.add.rectangle(centerX, centerY + 12, barW, barH, 0x0f172a).setStrokeStyle(2, 0x38bdf8, 0.7);
    const fill = this.add.rectangle(centerX - barW / 2 + 2, centerY + 12, 4, barH - 4, 0x38bdf8).setOrigin(0, 0.5);

    registerGeneratedAssets(this);
    registerTileAtlasFrames(this);
    registerQuestUiAtlasFrames(this);
    registerFightingUiAtlasFrames(this);

    // Fighters from myFighters.ts are sliced from raw pictures first, because
    // their frame counts are only known once the pictures are read.
    void prepareMyFighters(this, (loaded, total) => {
      const pct = total > 0 ? loaded / total : 1;
      fill.width = Math.max(4, (barW - 4) * pct);
      title.setText(`LOADING FIGHTERS... ${loaded}/${total}`);
    })
      .catch((error) => console.error('[my-fighter] could not prepare fighters', error))
      .then(() => {
        registerStarterAnimations(this);
        this.scene.start(SCENE_KEYS.Splash);
      });
  }
}
