import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { FIGHTER_CHARACTER_DEFINITIONS, getCharacterDefinition, type CharacterDefinition } from '../game/hero';
import { MY_FIGHTER_IDS } from '../game/myFighterLoader';
import {
  POWER_TIERS,
  compareByPowerDesc,
  getCharacterPowerProfile,
  getPowerTierMeta,
  type PowerTier
} from '../game/powerTiers';
import { SCENE_KEYS, type MatchMode } from '../game/types';
import { BaseScene } from './BaseScene';

interface CharacterSelectData {
  mode: MatchMode;
  stageId: string;
}

type TierFilter = 'ALL' | PowerTier;

const P1_COLOR = 0x38bdf8;
const P2_COLOR = 0xf43f5e;
const CARD_BASE_BG = 0x0f172a;

// Selectable fighters: custom/anime roster + bundled fighters, sorted by Power Tier (S -> A -> B -> C).
const SELECTABLE_FIGHTER_IDS = Array.from(
  new Set([...MY_FIGHTER_IDS, 'bayasaa', 'jiujitsu-fighter', 'red-brawler'])
);
const ALL_SELECTABLE_ROSTER: CharacterDefinition[] = SELECTABLE_FIGHTER_IDS.flatMap((id) =>
  FIGHTER_CHARACTER_DEFINITIONS.filter((character) => character.id === id)
).sort((a, b) => compareByPowerDesc(a.id, b.id));

interface RosterCard {
  character: CharacterDefinition;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  flash: Phaser.GameObjects.Rectangle;
  destroy(): void;
}

interface PlayerCursor {
  index: number;
  lockedId: string | null;
  outline: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface TierTabButton {
  filter: TierFilter;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * Final step of the Play flow: pick fighters categorized by Power Tier (S/A/B/C).
 * Supports both keyboard (P1 = WASD + Space/F, P2 = Arrows + Enter) and mouse/touch
 * clicking in both 1v1 and 1vCPU modes.
 */
export class CharacterSelectScene extends BaseScene {
  private mode: MatchMode = '1v1';
  private stageId = '';
  private activeFilter: TierFilter = 'ALL';
  private visibleRoster: CharacterDefinition[] = ALL_SELECTABLE_ROSTER;
  private cols = 8;

  private tierTabs: TierTabButton[] = [];
  private cards: RosterCard[] = [];
  private cardPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

  private p1!: PlayerCursor;
  private p2!: PlayerCursor;
  private transitioning = false;

  private p1SummaryText!: Phaser.GameObjects.Text;
  private p1StatusText!: Phaser.GameObjects.Text;
  private p2SummaryText!: Phaser.GameObjects.Text;
  private p2StatusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.CharacterSelect);
  }

  init(data: CharacterSelectData): void {
    this.mode = data?.mode ?? '1v1';
    this.stageId = data?.stageId ?? '';
  }

  create(): void {
    this.cards = [];
    this.cardPositions = [];
    this.tierTabs = [];
    this.activeFilter = 'ALL';
    this.visibleRoster = ALL_SELECTABLE_ROSTER;
    this.transitioning = false;

    this.markActiveScene(SCENE_KEYS.CharacterSelect);
    this.cameras.main.setBackgroundColor(0x020617);
    this.createHeading(
      'Select Fighter • Power Ranks',
      this.mode === '1v1'
        ? 'P1: WASD + Space (or Click)   •   P2: Arrows + Enter (or Click)'
        : 'WASD / Arrows / Click to choose • Space / Enter to confirm'
    );

    this.buildTierTabs();
    this.buildCursors();
    this.rebuildGrid();
    this.buildBottomDock();
    this.refreshAllUi();
    this.registerInput();

    this.createFooterHint('Keys 1-5: Filter Power Tier • Esc: Back');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearCards();
      this.tierTabs = [];
    });
  }

  private buildTierTabs(): void {
    const { centerX } = this.cameras.main;
    const filters: Array<{ filter: TierFilter; label: string; color: number }> = [
      { filter: 'ALL', label: `ALL (${ALL_SELECTABLE_ROSTER.length})`, color: 0xe2e8f0 },
      ...POWER_TIERS.map((tier) => {
        const count = ALL_SELECTABLE_ROSTER.filter(
          (character) => getCharacterPowerProfile(character.id).tier === tier.id
        ).length;

        return {
          filter: tier.id as TierFilter,
          label: `${tier.shortLabel} (${count})`,
          color: tier.color
        };
      })
    ];

    const tabWidth = 174;
    const tabHeight = 32;
    const gap = 14;
    const totalWidth = filters.length * tabWidth + (filters.length - 1) * gap;
    const startX = centerX - totalWidth / 2 + tabWidth / 2;
    const y = 124;

    filters.forEach((entry, index) => {
      const x = startX + index * (tabWidth + gap);
      const bg = this.add
        .rectangle(x, y, tabWidth, tabHeight, 0x0f172a, 0.95)
        .setStrokeStyle(2, entry.color, 0.45)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      const text = this.add
        .text(x, y, entry.label, {
          color: '#cbd5e1',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(6);

      bg.on('pointerdown', () => this.setTierFilter(entry.filter));
      this.tierTabs.push({ filter: entry.filter, bg, text });
    });
  }

  private setTierFilter(filter: TierFilter): void {
    if (this.transitioning || this.activeFilter === filter) {
      return;
    }

    const nextRoster =
      filter === 'ALL'
        ? ALL_SELECTABLE_ROSTER
        : ALL_SELECTABLE_ROSTER.filter(
            (character) => getCharacterPowerProfile(character.id).tier === filter
          );

    if (nextRoster.length === 0) {
      return;
    }

    this.activeFilter = filter;
    this.visibleRoster = nextRoster;
    this.p1.index = 0;
    this.p2.index = this.mode === '1v1' && nextRoster.length > 1 ? 1 : 0;

    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
    this.rebuildGrid();
    this.refreshAllUi();
  }

  private clearCards(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.cardPositions = [];
  }

  private rebuildGrid(): void {
    this.clearCards();

    const { centerX } = this.cameras.main;
    const count = this.visibleRoster.length;
    const twoRows = count > 6;
    const cols = twoRows ? Math.ceil(count / 2) : count;
    this.cols = Math.max(1, cols);

    const usableWidth = 1180;
    const gapX = twoRows ? 14 : 24;
    const gapY = 18;
    const cardWidth = twoRows
      ? Math.min(165, Math.floor((usableWidth - gapX * (cols - 1)) / cols))
      : Math.min(220, Math.floor((usableWidth - gapX * (cols - 1)) / Math.max(1, cols)));
    const cardHeight = twoRows ? 178 : 284;

    const topCenterY = twoRows ? 254 : 344;
    const rowStepY = cardHeight + gapY;

    this.visibleRoster.forEach((character, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const itemsInRow = row === 1 || !twoRows ? (twoRows ? count - cols : count) : cols;
      const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
      const rowStartX = centerX - rowWidth / 2 + cardWidth / 2;

      const x = rowStartX + col * (cardWidth + gapX);
      const y = topCenterY + row * rowStepY;

      this.cardPositions.push({ x, y, width: cardWidth, height: cardHeight });
      this.cards.push(this.createRosterCard(character, index, x, y, cardWidth, cardHeight, twoRows));
    });
  }

  private createRosterCard(
    character: CharacterDefinition,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    compact: boolean
  ): RosterCard {
    const profile = getCharacterPowerProfile(character.id);
    const tierMeta = getPowerTierMeta(profile.tier);

    const background = this.add
      .rectangle(0, 0, width, height, CARD_BASE_BG, 0.94)
      .setStrokeStyle(2, tierMeta.color, 0.55);

    const children: Phaser.GameObjects.GameObject[] = [background];

    // Portrait
    if (this.textures.exists(character.portrait.key)) {
      const image = this.add.image(0, compact ? -10 : -24, character.portrait.key).setOrigin(0.5);
      const maxSize = compact ? Math.min(width - 24, height - 68) : Math.min(width - 36, height - 104);
      const sourceSize = Math.max(image.width, image.height) || maxSize;
      image.setScale(maxSize / sourceSize);
      children.push(image);
    }

    // Power Tier badge (top-left)
    const badgeW = compact ? 26 : 32;
    const badgeH = compact ? 20 : 24;
    const tierBg = this.add
      .rectangle(-width / 2 + badgeW / 2 + 6, -height / 2 + badgeH / 2 + 6, badgeW, badgeH, tierMeta.color, 1)
      .setOrigin(0.5);
    const tierText = this.add
      .text(tierBg.x, tierBg.y, profile.tier, {
        color: '#020617',
        fontFamily: 'monospace',
        fontSize: compact ? '13px' : '15px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    children.push(tierBg, tierText);

    // Power number (top-right)
    const powerText = this.add
      .text(width / 2 - 8, -height / 2 + 9, `${profile.power}`, {
        color: tierMeta.hex,
        fontFamily: 'monospace',
        fontSize: compact ? '12px' : '14px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        padding: { x: 4, y: 2 }
      })
      .setOrigin(1, 0);
    children.push(powerText);

    // Name + Origin
    const nameY = height / 2 - (compact ? 22 : 34);
    const title = this.add
      .text(0, nameY, character.label, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: compact ? '12px' : '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width - 10 }
      })
      .setOrigin(0.5);
    children.push(title);

    if (!compact) {
      const origin = this.add
        .text(0, height / 2 - 14, `${profile.origin.toUpperCase()} • PWR ${profile.power}`, {
          color: tierMeta.hex,
          fontFamily: 'monospace',
          fontSize: '11px'
        })
        .setOrigin(0.5);
      children.push(origin);
    }

    const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0.5);
    children.push(flash);

    const container = this.add.container(x, y, children).setDepth(2);

    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => this.hoverCard(index));
    background.on('pointerdown', () => this.clickCard(index));

    return {
      character,
      container,
      background,
      flash,
      destroy: () => container.destroy(true)
    };
  }

  private buildCursors(): void {
    this.p1 = {
      index: 0,
      lockedId: null,
      outline: this.add.rectangle(0, 0, 100, 100, P1_COLOR, 0).setStrokeStyle(4, P1_COLOR, 1).setDepth(20),
      label: this.add
        .text(0, 0, 'P1', {
          color: '#020617',
          backgroundColor: colorToCss(P1_COLOR),
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5)
        .setDepth(21)
    };

    const p2Start = this.mode === '1v1' && this.visibleRoster.length > 1 ? 1 : 0;
    this.p2 = {
      index: p2Start,
      lockedId: null,
      outline: this.add.rectangle(0, 0, 100, 100, P2_COLOR, 0).setStrokeStyle(4, P2_COLOR, 1).setDepth(20),
      label: this.add
        .text(0, 0, this.mode === '1vcpu' ? 'CPU' : 'P2', {
          color: '#020617',
          backgroundColor: colorToCss(P2_COLOR),
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5)
        .setDepth(21)
    };

    if (this.mode === '1vcpu') {
      this.p2.outline.setVisible(false);
      this.p2.label.setVisible(false);
    }
  }

  private buildBottomDock(): void {
    const { centerX, height } = this.cameras.main;
    const dockY = height - 96;
    const boxW = 420;
    const boxH = 74;

    // P1 dock box (clickable to unlock in 1v1 if P1 wants to re-pick)
    const p1Box = this.add
      .rectangle(centerX - 270, dockY, boxW, boxH, 0x0b1120, 0.92)
      .setStrokeStyle(2, P1_COLOR, 0.8)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    p1Box.on('pointerdown', () => {
      if (this.mode === '1v1' && this.p1.lockedId && !this.transitioning) {
        this.p1.lockedId = null;
        this.refreshAllUi();
      }
    });

    this.p1SummaryText = this.add
      .text(centerX - 270, dockY - 12, '', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.p1StatusText = this.add
      .text(centerX - 270, dockY + 14, '', {
        color: '#38bdf8',
        fontFamily: 'monospace',
        fontSize: '12px'
      })
      .setOrigin(0.5)
      .setDepth(11);

    // Center VS badge
    this.add
      .text(centerX, dockY, 'VS', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(11);

    // P2 / CPU dock box
    const p2Box = this.add
      .rectangle(centerX + 270, dockY, boxW, boxH, 0x0b1120, 0.92)
      .setStrokeStyle(2, P2_COLOR, 0.8)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    p2Box.on('pointerdown', () => {
      if (this.mode === '1v1' && this.p2.lockedId && !this.transitioning) {
        this.p2.lockedId = null;
        this.refreshAllUi();
      }
    });

    this.p2SummaryText = this.add
      .text(centerX + 270, dockY - 12, '', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.p2StatusText = this.add
      .text(centerX + 270, dockY + 14, '', {
        color: '#f43f5e',
        fontFamily: 'monospace',
        fontSize: '12px'
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  private refreshAllUi(): void {
    this.refreshTierTabs();
    this.refreshCursor(this.p1, true);
    this.refreshCursor(this.p2, false);
    this.refreshDock();
  }

  private refreshTierTabs(): void {
    this.tierTabs.forEach((tab) => {
      const selected = tab.filter === this.activeFilter;
      const strokeColor =
        tab.filter === 'ALL' ? 0xfacc15 : getPowerTierMeta(tab.filter).color;
      tab.bg.setFillStyle(selected ? 0x1e293b : 0x0f172a, 0.95);
      tab.bg.setStrokeStyle(selected ? 3 : 2, strokeColor, selected ? 1 : 0.35);
      tab.text.setColor(selected ? '#ffffff' : '#94a3b8');
    });
  }

  private refreshCursor(cursor: PlayerCursor, isP1: boolean): void {
    if (!isP1 && this.mode === '1vcpu' && !cursor.lockedId) {
      cursor.outline.setVisible(false);
      cursor.label.setVisible(false);
      return;
    }

    let displayIndex = cursor.index;
    if (cursor.lockedId) {
      const lockedVisibleIndex = this.visibleRoster.findIndex((c) => c.id === cursor.lockedId);
      if (lockedVisibleIndex === -1) {
        cursor.outline.setVisible(false);
        cursor.label.setVisible(false);
        return;
      }
      displayIndex = lockedVisibleIndex;
    }

    const pos = this.cardPositions[displayIndex];
    if (!pos) {
      cursor.outline.setVisible(false);
      cursor.label.setVisible(false);
      return;
    }

    const color = isP1 ? P1_COLOR : P2_COLOR;
    const sameSpot =
      this.mode === '1v1' &&
      !isP1 &&
      this.visibleIndexFor(this.p1) === displayIndex;

    cursor.outline.setVisible(true);
    cursor.label.setVisible(true);
    cursor.outline.setPosition(pos.x, pos.y);
    cursor.outline.setSize(pos.width + (sameSpot ? 18 : 10), pos.height + (sameSpot ? 18 : 10));
    cursor.outline.setStrokeStyle(cursor.lockedId ? 6 : 3, color, 1);
    cursor.label.setPosition(
      isP1 ? pos.x - pos.width / 2 + 20 : pos.x + pos.width / 2 - 20,
      pos.y - pos.height / 2 - 12
    );
  }

  private visibleIndexFor(cursor: PlayerCursor): number {
    if (cursor.lockedId) {
      return this.visibleRoster.findIndex((c) => c.id === cursor.lockedId);
    }
    return cursor.index;
  }

  private refreshDock(): void {
    const p1Char = this.resolveCursorCharacter(this.p1);
    const p1Power = getCharacterPowerProfile(p1Char.id);
    this.p1SummaryText.setText(`P1: ${p1Char.label.toUpperCase()}  [${p1Power.tier} • ${p1Power.power}]`);
    this.p1StatusText.setText(
      this.p1.lockedId
        ? 'READY! (Click here to change)'
        : 'WASD + Space/F or Click a fighter'
    );
    this.p1StatusText.setColor(this.p1.lockedId ? '#4ade80' : '#38bdf8');

    const p2Label = this.mode === '1vcpu' ? 'CPU' : 'P2';
    if (this.mode === '1vcpu' && !this.p2.lockedId) {
      this.p2SummaryText.setText('CPU: AUTO-SELECT');
      this.p2StatusText.setText('Picks rival after P1 confirms');
      this.p2StatusText.setColor('#94a3b8');
      return;
    }

    const p2Char = this.resolveCursorCharacter(this.p2);
    const p2Power = getCharacterPowerProfile(p2Char.id);
    this.p2SummaryText.setText(`${p2Label}: ${p2Char.label.toUpperCase()}  [${p2Power.tier} • ${p2Power.power}]`);
    this.p2StatusText.setText(
      this.p2.lockedId
        ? this.mode === '1vcpu'
          ? 'READY!'
          : 'READY! (Click here to change)'
        : 'Arrows + Enter or Click a fighter'
    );
    this.p2StatusText.setColor(this.p2.lockedId ? '#4ade80' : '#f43f5e');
  }

  private resolveCursorCharacter(cursor: PlayerCursor): CharacterDefinition {
    if (cursor.lockedId) {
      return getCharacterDefinition(cursor.lockedId);
    }

    return this.visibleRoster[cursor.index] ?? this.visibleRoster[0] ?? ALL_SELECTABLE_ROSTER[0];
  }

  private registerInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    // Tier filter shortcuts (1-5)
    keyboard.on('keydown-ONE', () => this.setTierFilter('ALL'));
    keyboard.on('keydown-TWO', () => this.setTierFilter('S'));
    keyboard.on('keydown-THREE', () => this.setTierFilter('A'));
    keyboard.on('keydown-FOUR', () => this.setTierFilter('B'));
    keyboard.on('keydown-FIVE', () => this.setTierFilter('C'));

    if (this.mode === '1v1') {
      keyboard.on('keydown-A', () => this.movePlayer(this.p1, -1, 0));
      keyboard.on('keydown-D', () => this.movePlayer(this.p1, 1, 0));
      keyboard.on('keydown-W', () => this.movePlayer(this.p1, 0, -1));
      keyboard.on('keydown-S', () => this.movePlayer(this.p1, 0, 1));
      keyboard.on('keydown-SPACE', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-F', () => this.confirmPlayer(this.p1));

      keyboard.on('keydown-LEFT', () => this.movePlayer(this.p2, -1, 0));
      keyboard.on('keydown-RIGHT', () => this.movePlayer(this.p2, 1, 0));
      keyboard.on('keydown-UP', () => this.movePlayer(this.p2, 0, -1));
      keyboard.on('keydown-DOWN', () => this.movePlayer(this.p2, 0, 1));
      keyboard.on('keydown-ENTER', () => this.confirmPlayer(this.p2));
    } else {
      keyboard.on('keydown-A', () => this.movePlayer(this.p1, -1, 0));
      keyboard.on('keydown-LEFT', () => this.movePlayer(this.p1, -1, 0));
      keyboard.on('keydown-D', () => this.movePlayer(this.p1, 1, 0));
      keyboard.on('keydown-RIGHT', () => this.movePlayer(this.p1, 1, 0));
      keyboard.on('keydown-W', () => this.movePlayer(this.p1, 0, -1));
      keyboard.on('keydown-UP', () => this.movePlayer(this.p1, 0, -1));
      keyboard.on('keydown-S', () => this.movePlayer(this.p1, 0, 1));
      keyboard.on('keydown-DOWN', () => this.movePlayer(this.p1, 0, 1));
      keyboard.on('keydown-SPACE', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-F', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-ENTER', () => this.confirmPlayer(this.p1));
    }

    keyboard.on('keydown-ESC', () => this.goBack());
    keyboard.on('keydown-BACKSPACE', () => this.goBack());
  }

  private movePlayer(cursor: PlayerCursor, dx: number, dy: number): void {
    if (this.transitioning || cursor.lockedId) {
      return;
    }

    const count = this.visibleRoster.length;
    if (count === 0) {
      return;
    }

    const step = dx !== 0 ? dx : dy * this.cols;
    cursor.index = Phaser.Math.Wrap(cursor.index + step, 0, count);
    this.refreshAllUi();
  }

  private hoverCard(index: number): void {
    if (this.transitioning) {
      return;
    }

    if (!this.p1.lockedId) {
      this.p1.index = index;
      this.refreshAllUi();
      return;
    }

    if (this.mode === '1v1' && !this.p2.lockedId) {
      this.p2.index = index;
      this.refreshAllUi();
    }
  }

  private clickCard(index: number): void {
    if (this.transitioning) {
      return;
    }

    if (this.mode === '1vcpu') {
      this.p1.index = index;
      this.confirmPlayer(this.p1);
      return;
    }

    // 1v1 mouse/touch flow: lock P1 on first click, then P2 on second click.
    if (!this.p1.lockedId) {
      this.p1.index = index;
      this.confirmPlayer(this.p1);
      return;
    }

    if (!this.p2.lockedId) {
      this.p2.index = index;
      this.confirmPlayer(this.p2);
    }
  }

  private confirmPlayer(cursor: PlayerCursor): void {
    if (this.transitioning || cursor.lockedId) {
      return;
    }

    const chosen = this.visibleRoster[cursor.index];
    if (!chosen) {
      return;
    }

    cursor.lockedId = chosen.id;
    this.refreshAllUi();
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());

    const card = this.cards[cursor.index];
    if (card) {
      this.tweens.add({
        targets: card.flash,
        alpha: { from: 0, to: 0.75 },
        duration: 85,
        yoyo: true,
        repeat: 2,
        onComplete: () => card.flash.setAlpha(0)
      });
    }

    if (this.mode === '1vcpu') {
      this.runCpuSelection(chosen.id);
      return;
    }

    if (this.p1.lockedId && this.p2.lockedId) {
      this.transitioning = true;
      this.time.delayedCall(420, () => this.startMatch());
    }
  }

  private runCpuSelection(p1Id: string): void {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;

    const pool = this.visibleRoster.filter((character) => character.id !== p1Id);
    const fallbackPool = ALL_SELECTABLE_ROSTER.filter((character) => character.id !== p1Id);
    const cpuPick = Phaser.Math.RND.pick(pool.length > 0 ? pool : fallbackPool);
    const cpuVisibleIndex = this.visibleRoster.findIndex((character) => character.id === cpuPick.id);

    this.p2.index = cpuVisibleIndex >= 0 ? cpuVisibleIndex : 0;
    this.p2.lockedId = cpuPick.id;
    this.p2.outline.setVisible(true);
    this.p2.label.setVisible(true);
    this.p2.label.setText('CPU');
    this.refreshAllUi();

    this.time.delayedCall(520, () => {
      playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
      this.startMatch();
    });
  }

  private startMatch(): void {
    const p1CharacterId = this.p1.lockedId ?? this.visibleRoster[this.p1.index]?.id ?? ALL_SELECTABLE_ROSTER[0].id;
    const p2CharacterId = this.p2.lockedId ?? this.visibleRoster[this.p2.index]?.id ?? ALL_SELECTABLE_ROSTER[1].id;

    this.scene.start(SCENE_KEYS.Match, {
      mode: this.mode,
      stageId: this.stageId,
      p1CharacterId,
      p2CharacterId
    });
  }

  private goBack(): void {
    if (this.transitioning) {
      return;
    }

    this.scene.start(SCENE_KEYS.LevelSelect, { mode: this.mode });
  }
}

function colorToCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
