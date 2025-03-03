// Import document classes.
import { AirMercsActor } from './documents/actor.mjs';
import { AirMercsItem } from './documents/item.mjs';
// Import sheet classes.
import { AirMercsActorSheet } from './sheets/actor-sheet.mjs';
import { AirMercsItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { AIR_MERCS } from './helpers/config.mjs';

// Import Initiative logic
import { Initiative } from './combat/initiative.mjs'

//Custom combatant changes
import { CustomCombatant } from './combat/customCombatant.mjs'

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.airMercs = {
  documents: {
    AirMercsActor,
    AirMercsItem,
  },
  applications: {
    AirMercsActorSheet,
    AirMercsItemSheet,
  },
  utils: {
    rollItemMacro,
  },

};

async function loadHandleBarTemplates()
{
  // register templates parts
  const templatePaths = [
    'systems/air-mercs/templates/item/sheet-missile.hbs',
    'systems/air-mercs/templates/item/sheet-rack.hbs',
    'systems/air-mercs/templates/item/sheet-bomb.hbs',
    'systems/air-mercs/templates/item/sheet-rocket.hbs',
    'systems/air-mercs/templates/item/sheet-equipment.hbs',
  ];
  return loadTemplates( templatePaths );
}

//Token HUD stuff
class MyTokenHud extends TokenHUD {

}

Hooks.once('init', function () {
  //Custom status Effect changes.mode keys:
  // 0 Custom - custom logic
  // 1 Multiply - multiplies KEY by VALUE
  // 2 Add - adds VALUE to KEY
  // 3 Downgrade - takes the lower between VALUE and KEY
  // 4 Upgrade - takes the higher between VALUE and KEY
  // 5 Override - sets KEY to VALUE temporarily

  CONFIG.statusEffects = [
    {
      id: "crippled",
      name: "AIR_MERCS.Effect.crippled",
      img: "icons/svg/skull.svg",
      changes: [
        {
          key: "system.manv.value",
          value: "-15",
          mode: 2,
          priority: null
        },
        {
          key: "system.gun.value",
          value: "-1",
          mode: 2,
          priority: null
        },
        {
          key: "system.maxSpeed.value",
          value: "0.5",
          mode: 1,
          priority: null
        },
      ]
    },
    {
      id: "stalled",
      name: "AIR_MERCS.Effect.stalled",
      img: "icons/svg/skull.svg",
      changes: [
        {
          key: "system.curSpeed.value",
          value: "0",
          mode: 5,
          priority: null
        },
      ]
    },
    {
      id: "radar_failure",
      name: "AIR_MERCS.Effect.radar_failure",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "missile_failure",
      name: "AIR_MERCS.Effect.missile_failure",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "gun_failure",
      name: "AIR_MERCS.Effect.gun_failure",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "systems_failure",
      name: "AIR_MERCS.Effect.systems_failure",
      img: "icons/svg/skull.svg",
      changes: [
        {
          key: "key",
          value: "0",
          mode: 2,
          priority: null
        },
      ]
    },
    {
      id: "engine_damage",
      name: "AIR_MERCS.Effect.engine_damage",
      img: "icons/svg/skull.svg",
      changes: [
        {
          key: "system.accel.value",
          value: "-1",
          mode: 2,
          priority: null
        },
      ]
    },
    {
      id: "control_damage",
      name: "AIR_MERCS.Effect.control_damage",
      img: "icons/svg/skull.svg",
      changes: [
        {
          key: "system.manv.value",
          value: "-15",
          mode: 2,
          priority: null
        },
      ]
    },
    {
      id: "control_jammed_left",
      name: "AIR_MERCS.Effect.control_jammed_left",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "control_jammed_right",
      name: "AIR_MERCS.Effect.control_jammed_right",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "pilot_wounded",
      name: "AIR_MERCS.Effect.pilot_wounded",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "power_failure",
      name: "AIR_MERCS.Effect.power_failure",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "fuel_leak",
      name: "AIR_MERCS.Effect.fuel_leak",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "airframe_damaged",
      name: "AIR_MERCS.Effect.airframe_damaged",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "pilot_incap",
      name: "AIR_MERCS.Effect.pilot_incap",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "firefirefire",
      name: "AIR_MERCS.Effect.firefirefire",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
    {
      id: "downlow",
      name: "AIR_MERCS.Effect.downlow",
      img: "icons/svg/skull.svg",
      changes: [
      ]
    },
  ]
  loadHandleBarTemplates();
  // Add custom constants for configuration.
  CONFIG.AIR_MERCS = AIR_MERCS;

  // Custom initiative logic
  CONFIG.Combat.documentClass = Initiative
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @abilities.reactions.total',
    decimals: 0,
  };

  CONFIG.Combatant.documentClass = CustomCombatant;

  // Define custom Document classes
  CONFIG.Actor.documentClass = AirMercsActor;
  CONFIG.Item.documentClass = AirMercsItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('air-mercs', AirMercsActorSheet, {
    makeDefault: true,
    label: 'AIR_MERCS.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('air-mercs', AirMercsItemSheet, {
    makeDefault: true,
    label: 'AIR_MERCS.SheetLabels.Item',
  });

  // Token HUD
  CONFIG.Token.hudClass = MyTokenHud

  //Custom Keybinds
  registerKeys();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('switch', function(value, options) {
  this.switch_value = value;
  return options.fn(this);
});

Handlebars.registerHelper('case', function(value, options) {
  if (value == this.switch_value) {
    return options.fn(this);
  }
});

Handlebars.registerHelper('default', function(value, options) {
    return true; 
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
  
});



/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.airmercs.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'air-mercs.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

async function toggleMovementTemplate() {
  if (!canvas.tokens.controlled[0]) {
    ui.notifications.warn("No token selected")
    return
  }
  if (canvas.tokens.controlled[0].actor.type != 'aircraft') {
    ui.notifications.warn("This token is not an Aircraft");
    return
  }
  const token = canvas.tokens.controlled[0];

 // Check for an existing movement template and remove it
  const existingTemplateId = token.document.flags["air-mercs"]?.moveTemplate;
  if (existingTemplateId) {
    const existingTemplate = canvas.tokens.get(existingTemplateId);
    if (existingTemplate) await existingTemplate.document.delete();

    await token.document.unsetFlag("air-mercs", "moveTemplate");
    return;
  }

 // Calculate positioning
  let tokenRotation = token.document.rotation;
  let tokenCenterX = token.document.width * canvas.grid.size / 2;
  let tokenCenterY = token.document.height * canvas.grid.size / 2;

  const templateData = {
    name: "Movement Template",
    texture: {src: "systems/air-mercs/assets/protractorbase2.png"}, 
    x: token.document.x + tokenCenterX - 250,
    y: token.document.y + tokenCenterY - 250,
    width: 500 / canvas.grid.size, 
    height: 500 / canvas.grid.size, 
    rotation: tokenRotation + 180,
    actorLink: false, 
    hidden: false,
    locked: true,
    disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL, 
    vision: false, 
    sort: -99,
    flags: { "air-mercs": { moveTemplate: true } }
  };

 // Create the token
  const templateToken = await TokenDocument.create(templateData, { parent: canvas.scene });

 // Store the token ID in the aircraft's flags
  await token.document.setFlag("air-mercs", "moveTemplate", templateToken.id);
}

function registerKeys() {
  registerMovementKey();

  //Movement Template Toggle Key
  function registerMovementKey() {
      game.keybindings.register("air-mercs", "MovementTemplate", {
      name: "SETTINGS.air-mercs.MovementTemplateName",
      hint: "SETTINGS.air-mercs.MovementTemplateHint",
      editable: [
          {
          key: "KeyM",
          },
      ],
      onDown: () => {
          toggleMovementTemplate();
          return true;
      },
    });
  }
}

Hooks.once("setup", () => {
  if (game.user.isGM) {
    game.socket.on("system.air-mercs", async (data) => {
      if (data.action === "updateHP") {
        let target = await fromUuid(data.targetUUID);
        console.log(target)
        if (target) {
          await target.update({system: {hitPoints: {value: (target.system.hitPoints.value - data.damage)}}});
        }
      }
    });
  }
});
