/**
 * YOUR FIGHTERS — add one line per fighter.
 *
 *   id    the folder name: public/assets/<id>/   (english, lowercase, no spaces)
 *   name  the name shown in the game
 *   flip  true if your pictures face RIGHT (the game needs fighters facing LEFT)
 *
 * Pictures go in public/assets/<id>/ :
 *   idle  walk  punch  kick  hit  ko        (needed)
 *   jump  crouch  block  special  portrait  (bonus)
 *
 * Full rules: ADD_CHARACTER.md
 */
export interface MyFighter {
  id: string;
  name: string;
  flip?: boolean;
  /** Only if auto-detect counts the poses wrong: { kick: 4 } */
  frames?: Record<string, number>;
  /** Exact asset filenames present in public/assets/<id>/ to avoid slow 404 probing. */
  files?: string[];
}

export const MY_FIGHTERS: MyFighter[] = [
  {
    id: 'cosmic-girl',
    name: 'Cosmic Girl',
    flip: true,
    frames: { punch: 4, special: 4 },
    files: ['idle.jpg', 'punch.jpg', 'special.jpg', 'portrait.jpg']
  },
  {
    id: 'thunder-boy',
    name: 'Thunder Boy',
    flip: true,
    frames: { punch: 4, special: 4 },
    files: ['idle.jpg', 'punch.jpg', 'special.jpg', 'portrait.jpg']
  },
  { id: 'caped-hero', name: 'One-Punch Hero', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'ultra-striker', name: 'Ultra Striker', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'void-sorcerer', name: 'Infinity Sage', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  {
    id: 'iron-man',
    name: 'Iron Man',
    flip: true,
    files: ['hit.jpg', 'idle.jpg', 'kick.jpg', 'ko.jpg', 'punch.jpg', 'special.jpg', 'walk.jpg']
  },
  { id: 'fox-shinobi', name: 'Fox Shinobi', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'strawhat-brawler', name: 'Strawhat Brawler', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'hollow-blade', name: 'Hollow Blade', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'sun-slayer', name: 'Sun Slayer', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'bolt-assassin', name: 'Bolt Assassin', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'blade-scout', name: 'Blade Scout', flip: true, frames: { punch: 4 }, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'flame-dragon', name: 'Flame Dragon', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'metal-alchemist', name: 'Metal Alchemist', flip: true, files: ['idle.jpg', 'punch.jpg'] },
  { id: 'chain-devil', name: 'Chain Devil', flip: true, frames: { punch: 4 }, files: ['idle.jpg', 'punch.jpg'] },
];
