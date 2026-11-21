import { FIGHTER_CHARACTER_DEFINITIONS, getCharacterDefinition } from './hero';
import { RED_BRAWLER_CHARACTER_ID } from './redBrawler';
import { GREEN_BOXER_CHARACTER_ID } from './greenBoxer';
import { JIUJITSU_FIGHTER_CHARACTER_ID } from './jiujitsuFighter';
import { BAYASAA_CHARACTER_ID } from './bayasaa';
import type {
  AttackKind,
  AttackProfile,
  FighterBoundsVisibility,
  FighterCombat,
  FighterPlaygroundDebugState,
  FighterStats
} from './types';

export const FIGHTER_PLAYGROUND_CONFIG_FILE = '/configs/fighter-playground.json';
export const FIGHTER_PLAYGROUND_CONFIG_SAVE_TARGET = 'configs/fighter-playground.json';

/**
 * Baseline movement/physics stats applied to any fighter without a bespoke
 * override. These mirror the playground's original tuning constants.
 */
export const DEFAULT_FIGHTER_STATS: FighterStats = {
  walkSpeed: 230,
  airDrift: 190,
  jump: 980,
  gravity: 2300,
  scale: 1.4
};

/**
 * Per-character starting balance. Tunable in the playground debug panel and
 * persisted to `public/configs/fighter-playground.json`.
 */
const FIGHTER_STAT_OVERRIDES: Record<string, Partial<FighterStats>> = {
  'cosmic-girl': { walkSpeed: 310, airDrift: 260, jump: 1120 },
  'thunder-boy': { walkSpeed: 320, airDrift: 265, jump: 1130 },
  'caped-hero': { walkSpeed: 280, airDrift: 230, jump: 1080 },
  'ultra-striker': { walkSpeed: 275, airDrift: 240, jump: 1070 },
  'void-sorcerer': { walkSpeed: 260, airDrift: 225, jump: 1050 },
  'iron-man': { walkSpeed: 255, airDrift: 220, jump: 1040 },
  'fox-shinobi': { walkSpeed: 270, airDrift: 235, jump: 1060 },
  'strawhat-brawler': { walkSpeed: 250, airDrift: 215, jump: 1040 },
  'hollow-blade': { walkSpeed: 245, airDrift: 205, jump: 1020 },
  'sun-slayer': { walkSpeed: 255, airDrift: 215, jump: 1030 },
  'bolt-assassin': { walkSpeed: 285, airDrift: 245, jump: 1080 },
  'blade-scout': { walkSpeed: 265, airDrift: 240, jump: 1120 },
  'flame-dragon': { walkSpeed: 250, airDrift: 205, jump: 1020 },
  'metal-alchemist': { walkSpeed: 240, airDrift: 195, jump: 1000 },
  'chain-devil': { walkSpeed: 255, airDrift: 210, jump: 1030 },
  [RED_BRAWLER_CHARACTER_ID]: {},
  [GREEN_BOXER_CHARACTER_ID]: { walkSpeed: 250, jump: 1000 },
  [JIUJITSU_FIGHTER_CHARACTER_ID]: { walkSpeed: 240, airDrift: 210, jump: 1040 },
  [BAYASAA_CHARACTER_ID]: { walkSpeed: 255, airDrift: 200, jump: 1020 }
};

/**
 * Editable stat field metadata used to render the debug panel inputs and to
 * clamp values to sane ranges.
 */
export interface FighterStatField {
  id: keyof FighterStats;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const FIGHTER_STAT_FIELDS: FighterStatField[] = [
  { id: 'walkSpeed', label: 'Walk speed', min: 40, max: 600, step: 5 },
  { id: 'airDrift', label: 'Air drift', min: 0, max: 600, step: 5 },
  { id: 'jump', label: 'Jump power', min: 200, max: 2000, step: 10 },
  { id: 'gravity', label: 'Gravity', min: 400, max: 5000, step: 25 },
  { id: 'scale', label: 'Scale', min: 0.5, max: 3, step: 0.05 }
];

/**
 * Baseline combat tuning applied to any fighter without a bespoke override.
 * The light attack ("high") is fast and light; the heavy attack ("low") hits
 * harder, pushes further, and stuns longer.
 */
export const DEFAULT_FIGHTER_COMBAT: FighterCombat = {
  maxHealth: 100,
  highDamage: 7,
  highKnockback: 180,
  highHitstun: 280,
  lowDamage: 12,
  lowKnockback: 340,
  lowHitstun: 440,
  specialDamage: 6,
  specialKnockback: 150,
  specialHitstun: 240
};

/**
 * Per-character combat balance. Tunable in the playground debug panel and
 * persisted alongside the movement stats.
 */
const FIGHTER_COMBAT_OVERRIDES: Record<string, Partial<FighterCombat>> = {
  'cosmic-girl': {
    maxHealth: 185,
    highDamage: 16,
    highKnockback: 310,
    highHitstun: 360,
    lowDamage: 26,
    lowKnockback: 520,
    lowHitstun: 580,
    specialDamage: 25,
    specialKnockback: 620,
    specialHitstun: 620
  },
  'thunder-boy': {
    maxHealth: 185,
    highDamage: 16,
    highKnockback: 310,
    highHitstun: 360,
    lowDamage: 26,
    lowKnockback: 520,
    lowHitstun: 580,
    specialDamage: 24,
    specialKnockback: 480,
    specialHitstun: 500
  },
  'caped-hero': {
    maxHealth: 135,
    highDamage: 12,
    highKnockback: 260,
    highHitstun: 340,
    lowDamage: 20,
    lowKnockback: 460,
    lowHitstun: 540,
    specialDamage: 14,
    specialKnockback: 320,
    specialHitstun: 360
  },
  'ultra-striker': {
    maxHealth: 125,
    highDamage: 10,
    highKnockback: 220,
    highHitstun: 310,
    lowDamage: 17,
    lowKnockback: 400,
    lowHitstun: 490,
    specialDamage: 11,
    specialKnockback: 260,
    specialHitstun: 310
  },
  'void-sorcerer': {
    maxHealth: 120,
    highDamage: 9,
    highKnockback: 210,
    highHitstun: 320,
    lowDamage: 16,
    lowKnockback: 390,
    lowHitstun: 500,
    specialDamage: 12,
    specialKnockback: 270,
    specialHitstun: 340
  },
  'iron-man': {
    maxHealth: 120,
    highDamage: 9,
    highKnockback: 205,
    highHitstun: 300,
    lowDamage: 15,
    lowKnockback: 370,
    lowHitstun: 470,
    specialDamage: 10,
    specialKnockback: 240,
    specialHitstun: 300
  },
  'fox-shinobi': {
    maxHealth: 115,
    highDamage: 8,
    highKnockback: 195,
    highHitstun: 290,
    lowDamage: 14,
    lowKnockback: 350,
    lowHitstun: 450,
    specialDamage: 9,
    specialKnockback: 230,
    specialHitstun: 280
  },
  'strawhat-brawler': {
    maxHealth: 115,
    highDamage: 9,
    highKnockback: 210,
    highHitstun: 290,
    lowDamage: 15,
    lowKnockback: 380,
    lowHitstun: 470,
    specialDamage: 9,
    specialKnockback: 220,
    specialHitstun: 270
  },
  'hollow-blade': {
    maxHealth: 115,
    highDamage: 9,
    highKnockback: 215,
    highHitstun: 300,
    lowDamage: 15,
    lowKnockback: 375,
    lowHitstun: 470,
    specialDamage: 9,
    specialKnockback: 235,
    specialHitstun: 280
  },
  'sun-slayer': {
    maxHealth: 110,
    highDamage: 8,
    highKnockback: 190,
    highHitstun: 290,
    lowDamage: 14,
    lowKnockback: 350,
    lowHitstun: 450,
    specialDamage: 9,
    specialKnockback: 220,
    specialHitstun: 270
  },
  'bolt-assassin': {
    maxHealth: 105,
    highDamage: 8,
    highKnockback: 180,
    highHitstun: 300,
    lowDamage: 13,
    lowKnockback: 330,
    lowHitstun: 440,
    specialDamage: 8,
    specialKnockback: 200,
    specialHitstun: 270
  },
  'blade-scout': {
    maxHealth: 105,
    highDamage: 8,
    highKnockback: 185,
    highHitstun: 280,
    lowDamage: 13,
    lowKnockback: 340,
    lowHitstun: 440,
    specialDamage: 8,
    specialKnockback: 205,
    specialHitstun: 260
  },
  'flame-dragon': {
    maxHealth: 110,
    highDamage: 8,
    highKnockback: 205,
    highHitstun: 280,
    lowDamage: 14,
    lowKnockback: 360,
    lowHitstun: 450,
    specialDamage: 8,
    specialKnockback: 215,
    specialHitstun: 260
  },
  'metal-alchemist': {
    maxHealth: 110,
    highDamage: 8,
    highKnockback: 195,
    highHitstun: 285,
    lowDamage: 13,
    lowKnockback: 350,
    lowHitstun: 450,
    specialDamage: 8,
    specialKnockback: 200,
    specialHitstun: 260
  },
  'chain-devil': {
    maxHealth: 105,
    highDamage: 9,
    highKnockback: 190,
    highHitstun: 290,
    lowDamage: 14,
    lowKnockback: 345,
    lowHitstun: 445,
    specialDamage: 8,
    specialKnockback: 210,
    specialHitstun: 265
  },
  [RED_BRAWLER_CHARACTER_ID]: { specialDamage: 7, specialKnockback: 170 },
  [GREEN_BOXER_CHARACTER_ID]: { highDamage: 9, highKnockback: 220, lowDamage: 10, lowKnockback: 300 },
  [JIUJITSU_FIGHTER_CHARACTER_ID]: {
    maxHealth: 110,
    highDamage: 6,
    lowDamage: 14,
    lowKnockback: 380,
    lowHitstun: 480,
    specialDamage: 5,
    specialHitstun: 220
  },
  [BAYASAA_CHARACTER_ID]: {
    maxHealth: 110,
    highDamage: 8,
    highKnockback: 200,
    highHitstun: 290,
    lowDamage: 15,
    lowKnockback: 360,
    lowHitstun: 460,
    specialDamage: 8,
    specialKnockback: 200,
    specialHitstun: 260
  }
};

/**
 * Editable combat field metadata used to render the debug panel inputs and to
 * clamp values to sane ranges.
 */
export interface FighterCombatField {
  id: keyof FighterCombat;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const FIGHTER_COMBAT_FIELDS: FighterCombatField[] = [
  { id: 'maxHealth', label: 'Max HP', min: 50, max: 300, step: 5 },
  { id: 'highDamage', label: 'High dmg', min: 1, max: 50, step: 1 },
  { id: 'highKnockback', label: 'High kb', min: 0, max: 800, step: 10 },
  { id: 'highHitstun', label: 'High stun', min: 0, max: 1200, step: 20 },
  { id: 'lowDamage', label: 'Low dmg', min: 1, max: 50, step: 1 },
  { id: 'lowKnockback', label: 'Low kb', min: 0, max: 800, step: 10 },
  { id: 'lowHitstun', label: 'Low stun', min: 0, max: 1200, step: 20 },
  { id: 'specialDamage', label: 'Special dmg', min: 1, max: 50, step: 1 },
  { id: 'specialKnockback', label: 'Special kb', min: 0, max: 800, step: 10 },
  { id: 'specialHitstun', label: 'Special stun', min: 0, max: 1200, step: 20 }
];

/**
 * Debug bounds overlay metadata, shared by the playground panel (colour
 * swatches) and the scene renderer (stroke/fill colours).
 */
export interface FighterBoundsField {
  id: keyof FighterBoundsVisibility;
  label: string;
  color: string;
}

export const FIGHTER_BOUNDS_FIELDS: FighterBoundsField[] = [
  { id: 'visual', label: 'Visual', color: '#38bdf8' },
  { id: 'collision', label: 'Collision', color: '#facc15' },
  { id: 'hit', label: 'Hit', color: '#22c55e' },
  { id: 'attack', label: 'Attack', color: '#f43f5e' },
  { id: 'guard', label: 'Guard', color: '#a855f7' }
];

export interface FighterPlaygroundConfigExport {
  version: number;
  savedAt: string;
  characterId: string;
  reverseWalk: boolean;
  stats: Record<string, FighterStats>;
  combat: Record<string, FighterCombat>;
}

/**
 * Build the default per-character stats map for every selectable fighter.
 */
export function buildDefaultFighterStats(): Record<string, FighterStats> {
  const stats: Record<string, FighterStats> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    stats[character.id] = clampFighterStats({
      ...DEFAULT_FIGHTER_STATS,
      ...FIGHTER_STAT_OVERRIDES[character.id]
    });
  });

  return stats;
}

/**
 * Build the default per-character combat map for every selectable fighter.
 */
export function buildDefaultFighterCombat(): Record<string, FighterCombat> {
  const combat: Record<string, FighterCombat> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    combat[character.id] = clampFighterCombat({
      ...DEFAULT_FIGHTER_COMBAT,
      ...FIGHTER_COMBAT_OVERRIDES[character.id]
    });
  });

  return combat;
}

/**
 * Build the default Fighter Playground debug state (default selection + stats).
 */
export function createDefaultFighterPlaygroundState(): FighterPlaygroundDebugState {
  return {
    characterId: defaultFighterCharacterId(),
    stats: buildDefaultFighterStats(),
    combat: buildDefaultFighterCombat(),
    bounds: { visual: false, collision: false, hit: false, attack: false, guard: false },
    reverseWalk: false,
    fillSpecial: false,
    saveStatus: 'Loaded from public/configs/fighter-playground.json'
  };
}

/**
 * Resolve the stats for a character, falling back to defaults when absent.
 * @param state - The current playground debug state.
 * @param characterId - The character to resolve stats for.
 */
export function getFighterStats(
  state: FighterPlaygroundDebugState,
  characterId: string
): FighterStats {
  return state.stats[characterId] ?? clampFighterStats(DEFAULT_FIGHTER_STATS);
}

/**
 * Resolve the combat tuning for a character, falling back to defaults.
 * @param state - The current playground debug state.
 * @param characterId - The character to resolve combat for.
 */
export function getFighterCombat(
  state: FighterPlaygroundDebugState,
  characterId: string
): FighterCombat {
  return state.combat?.[characterId] ?? clampFighterCombat(DEFAULT_FIGHTER_COMBAT);
}

/**
 * Resolve a single attack's profile (damage/knockback/hitstun + guard height)
 * for the given attack button.
 * @param combat - The character's combat tuning.
 * @param kind - Which attack: `high` (light) or `low` (heavy).
 */
export function getAttackProfile(combat: FighterCombat, kind: AttackKind): AttackProfile {
  if (kind === 'high') {
    return {
      kind: 'high',
      height: 'high',
      damage: combat.highDamage,
      knockback: combat.highKnockback,
      hitstun: combat.highHitstun
    };
  }

  if (kind === 'special') {
    return {
      kind: 'special',
      height: 'high',
      damage: combat.specialDamage,
      knockback: combat.specialKnockback,
      hitstun: combat.specialHitstun
    };
  }

  return {
    kind: 'low',
    height: 'low',
    damage: combat.lowDamage,
    knockback: combat.lowKnockback,
    hitstun: combat.lowHitstun
  };
}

/**
 * Serialize the playground stats for persistence.
 * @param state - The current playground debug state.
 */
export function buildFighterPlaygroundConfigExport(
  state: FighterPlaygroundDebugState
): FighterPlaygroundConfigExport {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    characterId: normalizeFighterCharacterId(state.characterId),
    reverseWalk: Boolean(state.reverseWalk),
    stats: normalizeFighterStatsMap(state.stats),
    combat: normalizeFighterCombatMap(state.combat)
  };
}

/**
 * Fetch the persisted playground config, returning null when unavailable.
 */
export async function loadFighterPlaygroundConfig(): Promise<Partial<FighterPlaygroundConfigExport> | null> {
  try {
    const response = await fetch(FIGHTER_PLAYGROUND_CONFIG_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Partial<FighterPlaygroundConfigExport>;
  } catch {
    return null;
  }
}

/**
 * Merge a persisted config into the current playground state, keeping defaults
 * for any missing characters or fields.
 * @param current - The current playground debug state.
 * @param saved - The persisted config (may be partial or null).
 */
export function mergeFighterPlaygroundState(
  current: FighterPlaygroundDebugState,
  saved: Partial<FighterPlaygroundConfigExport> | null
): FighterPlaygroundDebugState {
  if (!saved) {
    return current;
  }

  const mergedStats: Record<string, FighterStats> = { ...current.stats };

  if (saved.stats && typeof saved.stats === 'object') {
    FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
      const savedStats = saved.stats?.[character.id];

      if (savedStats) {
        mergedStats[character.id] = clampFighterStats({
          ...mergedStats[character.id],
          ...savedStats
        });
      }
    });
  }

  const mergedCombat: Record<string, FighterCombat> = { ...current.combat };

  if (saved.combat && typeof saved.combat === 'object') {
    FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
      const savedCombat = saved.combat?.[character.id];

      if (savedCombat) {
        mergedCombat[character.id] = clampFighterCombat({
          ...mergedCombat[character.id],
          ...savedCombat
        });
      }
    });
  }

  return {
    ...current,
    characterId: normalizeFighterCharacterId(saved.characterId ?? current.characterId),
    reverseWalk: typeof saved.reverseWalk === 'boolean' ? saved.reverseWalk : current.reverseWalk,
    stats: mergedStats,
    combat: mergedCombat
  };
}

/**
 * Clamp a stats object to the configured field ranges, filling missing fields.
 * @param value - Partial stats to clamp.
 */
export function clampFighterStats(value: Partial<FighterStats>): FighterStats {
  const result = {} as FighterStats;

  FIGHTER_STAT_FIELDS.forEach((field) => {
    result[field.id] = clamp(value[field.id], field.min, field.max, DEFAULT_FIGHTER_STATS[field.id]);
  });

  return result;
}

/**
 * Clamp a combat object to the configured field ranges, filling missing fields.
 * @param value - Partial combat tuning to clamp.
 */
export function clampFighterCombat(value: Partial<FighterCombat>): FighterCombat {
  const result = {} as FighterCombat;

  FIGHTER_COMBAT_FIELDS.forEach((field) => {
    result[field.id] = clamp(value[field.id], field.min, field.max, DEFAULT_FIGHTER_COMBAT[field.id]);
  });

  return result;
}

/**
 * Default selectable fighter (first fighter in the roster, preferring the red brawler).
 */
export function defaultFighterCharacterId(): string {
  const preferred = FIGHTER_CHARACTER_DEFINITIONS.find(
    (character) => character.id === RED_BRAWLER_CHARACTER_ID
  );

  return preferred?.id ?? FIGHTER_CHARACTER_DEFINITIONS[0]?.id ?? RED_BRAWLER_CHARACTER_ID;
}

function normalizeFighterCharacterId(value: unknown): string {
  if (typeof value === 'string' && FIGHTER_CHARACTER_DEFINITIONS.some((character) => character.id === value)) {
    return getCharacterDefinition(value).id;
  }

  return defaultFighterCharacterId();
}

function normalizeFighterStatsMap(value: unknown): Record<string, FighterStats> {
  const stats: Record<string, FighterStats> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    const candidate = (value as Record<string, Partial<FighterStats>> | undefined)?.[character.id];
    stats[character.id] = clampFighterStats({
      ...DEFAULT_FIGHTER_STATS,
      ...FIGHTER_STAT_OVERRIDES[character.id],
      ...candidate
    });
  });

  return stats;
}

function normalizeFighterCombatMap(value: unknown): Record<string, FighterCombat> {
  const combat: Record<string, FighterCombat> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    const candidate = (value as Record<string, Partial<FighterCombat>> | undefined)?.[character.id];
    combat[character.id] = clampFighterCombat({
      ...DEFAULT_FIGHTER_COMBAT,
      ...FIGHTER_COMBAT_OVERRIDES[character.id],
      ...candidate
    });
  });

  return combat;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
