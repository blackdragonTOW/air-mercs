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

//Token HUD stuff
class MyTokenHud extends TokenHUD {

}

Hooks.once('init', function () {
  // Add custom constants for configuration.
  CONFIG.AIR_MERCS = AIR_MERCS;

  // Custom initiative logic
  CONFIG.Combat.documentClass = Initiative
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @abilities.reactions.value',
    decimals: 0,
  };

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
  const token = TokenLayer.instance.controlled[0];
  if (!token) return;
  if (document.body !== document.activeElement) return;

  if (token.document.flags["air-mercs"]?.moveTemplate) {
  const templateTile = fromUuidSync(token.document.flags["air-mercs"].moveTemplate);

  if (templateTile) {
      await templateTile.delete();
  }
  await token.document.unsetFlag("air-mercs", "moveTemplate");
  return;
  }

  let tokenRotation = token.document.rotation;

  let tokenCenterX = (token.document._object.shape.height / 2)
  let tokenCenterY = (token.document._object.shape.width / 2)

  const posData = {
  rotation: tokenRotation,
  x: (token.document.x - (250 - tokenCenterX)),
  y: (token.document.y - (250 - tokenCenterY)),
  texture: {
    alphaThreshold: 0.75,
    anchorX: 0.5,
    anchorY: 0.5,
    fit: "fill",
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    src: "systems/air-mercs/assets/protractorbase2.png",
    },
  width: 500,
  height: 500,
  sort: 99,
  };

  const placedTemplate = await TileDocument.create(posData, { parent: canvas.scene });

  await token.document.setFlag("air-mercs", "moveTemplate", placedTemplate.uuid);
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