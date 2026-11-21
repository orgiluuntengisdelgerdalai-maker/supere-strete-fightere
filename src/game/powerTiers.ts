export type PowerTier = 'S' | 'A' | 'B' | 'C';

export interface PowerTierMeta {
  id: PowerTier;
  label: string;
  shortLabel: string;
  color: number;
  hex: string;
}

export interface CharacterPowerProfile {
  tier: PowerTier;
  power: number;
  origin: string;
}

export const POWER_TIERS: PowerTierMeta[] = [
  { id: 'S', label: 'S-Rank • Mythic', shortLabel: 'S-RANK', color: 0xfacc15, hex: '#facc15' },
  { id: 'A', label: 'A-Rank • Master', shortLabel: 'A-RANK', color: 0xf43f5e, hex: '#f43f5e' },
  { id: 'B', label: 'B-Rank • Elite', shortLabel: 'B-RANK', color: 0x38bdf8, hex: '#38bdf8' },
  { id: 'C', label: 'C-Rank • Brawler', shortLabel: 'C-RANK', color: 0x94a3b8, hex: '#94a3b8' }
];

const TIER_ORDER: Record<PowerTier, number> = { S: 0, A: 1, B: 2, C: 3 };

const CHARACTER_POWER_MAP: Record<string, CharacterPowerProfile> = {
  'cosmic-girl': { tier: 'S', power: 100, origin: 'Super' },
  'thunder-boy': { tier: 'S', power: 100, origin: 'Super' },
  'caped-hero': { tier: 'S', power: 99, origin: 'Anime' },
  'ultra-striker': { tier: 'S', power: 97, origin: 'Anime' },
  'void-sorcerer': { tier: 'S', power: 96, origin: 'Anime' },
  'iron-man': { tier: 'S', power: 95, origin: 'Avengers' },

  'fox-shinobi': { tier: 'A', power: 92, origin: 'Anime' },
  'strawhat-brawler': { tier: 'A', power: 91, origin: 'Anime' },
  'hollow-blade': { tier: 'A', power: 90, origin: 'Anime' },
  'sun-slayer': { tier: 'A', power: 89, origin: 'Anime' },
  bayasaa: { tier: 'A', power: 88, origin: 'Original' },

  'bolt-assassin': { tier: 'B', power: 85, origin: 'Anime' },
  'blade-scout': { tier: 'B', power: 84, origin: 'Anime' },
  'flame-dragon': { tier: 'B', power: 83, origin: 'Anime' },
  'metal-alchemist': { tier: 'B', power: 82, origin: 'Anime' },
  'chain-devil': { tier: 'B', power: 81, origin: 'Anime' },
  'jiujitsu-fighter': { tier: 'B', power: 80, origin: 'Original' },

  'red-brawler': { tier: 'C', power: 76, origin: 'Original' },
  'green-boxer': { tier: 'C', power: 75, origin: 'Original' }
};

export function getCharacterPowerProfile(characterId: string): CharacterPowerProfile {
  return CHARACTER_POWER_MAP[characterId] ?? { tier: 'C', power: 75, origin: 'Fighter' };
}

export function getPowerTierMeta(tier: PowerTier): PowerTierMeta {
  return POWER_TIERS.find((entry) => entry.id === tier) ?? POWER_TIERS[POWER_TIERS.length - 1];
}

export function compareByPowerDesc(aId: string, bId: string): number {
  const a = getCharacterPowerProfile(aId);
  const b = getCharacterPowerProfile(bId);

  if (TIER_ORDER[a.tier] !== TIER_ORDER[b.tier]) {
    return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
  }

  return b.power - a.power;
}
