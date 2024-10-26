export const AIR_MERCS = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
AIR_MERCS.abilities = {
  reactions: 'Reactions',
  finesse: 'Finesse',
  maneuvers: 'Maneuvers',
  perception: 'Perception',
  gunnery: 'Gunnery',
  ir_missiles: 'Missiles (IR)',
  radar_missiles: 'Missiles (Radar)',
  ground_unguided: 'Ground Attack (Unguided)',
  ground_guided: 'Ground Attack (Guided)',
};

AIR_MERCS.abilityAbbreviations = {
  rct: 'AIR_MERCS.Ability.Rct.abbr',
  fin: 'AIR_MERCS.Ability.Fin.abbr',
  man: 'AIR_MERCS.Ability.Man.abbr',
  per: 'AIR_MERCS.Ability.Per.abbr',
  gun: 'AIR_MERCS.Ability.Gun.abbr',
  ir: 'AIR_MERCS.Ability.IR.abbr',
  rdr: 'AIR_MERCS.Ability.RDR.abbr',
  ugw: 'AIR_MERCS.Ability.UGW.abbr',
  gw: 'AIR_MERCS.Ability.GW.abbr',
};

AIR_MERCS.maneuver = {
  none: {
    name: "No Maneuver",
    diff: 0,
    passEffect: "Move 1/2 speed, turn up to turn rate, move 1/2 speed again, and turn up to turn rate again",
    failEffect: "Cannot Fail",
    img: "none"
  },
  barrelroll: {
    name: "Barrel Roll",
    diff: 5,
    passEffect: "Move 1/2 speed @ 60 degrees from flight path, maintaining orientation.  Speed -4,  +1 against missiles",
    failEffect: "Move 1/2 speed @ 60 degrees from flight path, then rotate 60 degrees away from flight path.  Speed -6",
    img: "barrelroll"
  },
  barrelrollandturn: {
    name: "Barrel Roll and Turn",
    diff: 6,
    passEffect: "Move 1/2 speed @ 60 degrees from flight path, then may 60 degree turn inward.  Speed -4, +2 against missiles",
    failEffect: "Move 1/2 speed @ 60 degrees from flight path, then may 60 degree turn inward. then rotate 60 degrees away from flight path.  Speed -6",
    img: "barrelrollandturn"
  },
  breakturn: {
    name: "Break Turn",
    diff: 5,
    passEffect: "Turn Rate +30, then as normal move, except first turn must use full turn rate.  May not use missiles, Speed -3, +3 against missiles",
    failEffect: "As normal move but both turns must be at max turn rate, Speed -5",
    img: "breakturn"
  },
  highyoyo: {
    name: "High Yo-Yo",
    diff: 7,
    passEffect: "Half move, turn @ 60 degrees, One-third move, second turn same direction up to 60 degrees.  Speed -2, +1 against missiles",
    failEffect: "One-third move, turn 120 degrees, half move.  Speed -4, -1 against missiles",
    img: "highyoyo"
  },
  immelmann: {
    name: "Immelmann",
    diff: 6,
    passEffect: "Half move, turn to any heading, Speed -5",
    failEffect: "Half move, turn to a randomized heading, Speed -6, -1 against missiles",
    img: "immelmann"
  },
  splits: {
    name: "Split-S",
    diff: 7,
    passEffect: "Half move, turn to any heading, adjust speed to +2 to +5",
    failEffect: "Half move, turn to a randomized heading, Speed +6, -1 against missiles",
    img: "splits"
  },
  unload: {
    name: "Unload",
    diff: 3,
    passEffect: "Full move forward, no turns, Speed +1 to +3",
    failEffect: "Full move forward, no turns, Speed +2, -1 against missiles",
    img: "unload"
  },
  viff: {
    name: "Viff",
    diff: 7,
    passEffect: "Up to half move, Speed -12",
    failEffect: "Speed -12, then move forward at that speed full move, then turn randomly left or right 60 degrees, -1 against missiles",
    img: "viff"
  }
};
