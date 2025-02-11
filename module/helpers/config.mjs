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
  ir_missiles: 'IR Missiles',
  radar_missiles: 'Radar Missiles',
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
    passEffect: {movement: "Move forward 1/2 Speed, turn up to Turn Rate, move forward 1/2 Speed again, and turn up to Turn Rate again",
                movementHTML: "Move forward 1/2 Speed, turn up to Turn Rate, move forward 1/2 Speed again, and turn up to Turn Rate again",
                speedChange: 0,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    failEffect: {movement: "Move forward 1/2 Speed, turn up to Turn Rate, move forward 1/2 Speed again, and turn up to Turn Rate again",
                movementHTML: "Move forward 1/2 Speed, turn up to Turn Rate, move forward 1/2 Speed again, and turn up to Turn Rate again",
                speedChange: 0,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    img: "none"
  },
  barrelroll: {
    name: "Barrel Roll",
    diff: 5,
    passEffect: {movement: "Move forward 1/2 Speed @ 60 degrees from flight path, maintaining orientation.  Speed: -4, Missile Defense: +1",
                movementHTML: "Move forward 1/2 Speed @ 60 degrees from flight path, maintaining orientation.  <br><br><b>Speed:</b> -4, <br><b>Missile Defense:</b> +1",
                speedChange: -4,
                speedChangeIsVariable: false,
                defBonus: 1
                },
    failEffect: {movement: "Move forward 1/2 Speed @ 60 degrees from flight path, then rotate 60 degrees away from flight path.  Speed: -6",
                movementHTML: "Move forward 1/2 Speed @ 60 degrees from flight path, then rotate 60 degrees away from flight path.  <br><br><b>Speed:</b> -6",
                speedChange: -6,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    img: "barrelroll"
  },
  barrelrollandturn: {
    name: "Barrel Roll and Turn",
    diff: 6,
    passEffect: {movement: "Move 1/2 Speed @ 60 degrees from flight path, then may 60 degree turn inward.  Speed: -4, Missile Defense: +2",
                movementHTML: "Move 1/2 Speed @ 60 degrees from flight path, then may 60 degree turn inward.  <br><br><b>Speed:</b> -4, <br><b>Missile Defense:</b> +2",
                speedChange: -4,
                speedChangeIsVariable: false,
                defBonus: 2
                },
    failEffect: {movement: "Move 1/2 Speed @ 60 degrees from flight path, then may 60 degree turn inward. Then rotate 60 degrees away from flight path.  Speed: -6",
                movementHTML: "Move 1/2 Speed @ 60 degrees from flight path, then may 60 degree turn inward. Then rotate 60 degrees away from flight path.  <br><br><b>Speed:</b> -6",
                speedChange: -6,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    img: "barrelrollandturn"
  },
  breakturn: {
    name: "Break Turn",
    diff: 5,
    passEffect: {movement: "Turn Rate: +30, then as normal move, except first turn must use full turn rate.  May not use missiles, Speed: -3, Missile Defense: +3",
                movementHTML: "Turn Rate: +30, then as normal move, except first turn must use full turn rate.  May not use missiles, <br><br><b>Speed:</b> -3, <br><b>Missile Defense:</b> +3",
                speedChange: -3,
                speedChangeIsVariable: false,
                defBonus: 3
                },
    failEffect: {movement: "As normal move but both turns must be at max turn rate, Speed: -5",
                movementHTML: "As normal move but both turns must be at max turn rate, <br><br><b>Speed:</b> -5",
                speedChange: -5,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    img: "breakturn"
  },
  highyoyo: {
    name: "High Yo-Yo",
    diff: 7,
    passEffect: {movement: "Half move forward, turn 60 to 120 degrees, One-third move forward, turn up to 60 degrees (max 120 between both turns).  Speed: -2, Missile Defense: +1",
                movementHTML: "Half move forward, turn 60 to 120 degrees, One-third move forward, turn up to 60 degrees (max 120 between both turns).  <br><br><b>Speed:</b> -2, <br><b>Missile Defense:</b> +1",
                speedChange: -2,
                speedChangeIsVariable: false,
                defBonus: 1
                },
    failEffect: {movement: "One-third move forward, turn 120 degrees, half move forward.  Speed: -4, Missile Defense: -1",
                movementHTML: "One-third move forward, turn 120 degrees, half move forward.  <br><br><b>Speed:</b> -4, <br><b>Missile Defense:</b> -1",
                speedChange: -4,
                speedChangeIsVariable: false,
                defBonus: -1
                },
    img: "highyoyo"
  },
  immelmann: {
    name: "Immelmann",
    diff: 6,
    passEffect: {movement: "Up to Half move forward, turn to any heading, Speed: -5",
                movementHTML: "Up to Half move forward, turn to any heading, <br><br><b>Speed:</b> -5",
                speedChange: -5,
                speedChangeIsVariable: false,
                defBonus: 0
                },
    failEffect: {movement: "Half move, turn to a randomized heading, Speed: -6, Missile Defense: -1",
                movementHTML: "Half move, turn to a randomized heading, <br><br><b>Speed:</b> -6, <br><b>Missile Defense:</b> -1",
                speedChange: -6,
                speedChangeIsVariable: false,
                defBonus: -1
                },
    img: "immelmann"
  },
  splits: {
    name: "Split-S",
    diff: 7,
    passEffect: {movement: "Half move forward, turn to any heading, Speed: +2 up to +5",
                movementHTML: "Half move forward, turn to any heading, <br><br><b>Speed:</b> +2 up to +5",
                speedChange: 5,
                speedChangeIsVariable: true,
                speedVariable: {min: 2, max: 5},
                defBonus: 0
                },
    failEffect: {movement: "Half move forward, turn to a randomized heading, Speed: +6, Missile Defense: -1",
                movementHTML: "Half move forward, turn to a randomized heading, <br><br><b>Speed:</b> +6, <br><b>Missile Defense:</b> -1",
                speedChange: 6,
                speedChangeIsVariable: false,
                defBonus: -1
                },
    img: "splits"
  },
  unload: {
    name: "Unload",
    diff: 3,
    passEffect: {movement: "Full move forward, no turns, Speed: +1 up to +3",
                movementHTML: "Full move forward, no turns, <br><br><b>Speed:</b> +1 up to +3",
                speedChange: 3,
                speedChangeIsVariable: true,
                speedVariable: {min: 1, max: 3},
                defBonus: 0
                },
    failEffect: {movement: "Full move forward, no turns, Speed: +2, Missile Defense: -1",
                movementHTML: "Full move forward, no turns, <br><br><b>Speed:</b> +2, <br><b>Missile Defense:</b> -1",
                speedChange: 2,
                speedChangeIsVariable: false,
                defBonus: -1
                },
    img: "unload"
  },
  viff: {
    name: "Viff",
    diff: 7,
    passEffect: {movement: "Up to half move, Speed: -1 up to -12",
                movementHTML: "Up to half move, <br><br><b>Speed:</b> -1 up to -12",
                speedChange: -1,
                speedChangeIsVariable: true,
                speedVariable: {min: -12, max: -1},
                defBonus: 0
                },
    failEffect: {movement: "Speed: -12, Full move forward at new Speed, then turn 60 degrees randomly left or right, Missile Defense: -1",
                movementHTML: "<b>Speed:</b> -12, Full move forward at new Speed, then turn 60 degrees randomly left or right, <br><br><b>Missile Defense:</b> -1",
                speedChange: -12,
                speedChangeIsVariable: false,
                defBonus: -1
                },
    img: "viff"
  }
};
