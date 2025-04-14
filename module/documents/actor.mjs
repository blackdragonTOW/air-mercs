import { toggleReadyOverlay } from "../air-mercs.mjs";
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AirMercsActor extends Actor {


  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.airmercs || {};
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
    if (this.type == "aircraft") {
      this.system.capacity.value = this.calcTotalWeight;
      this.system.abilities = this.calcUpdatedAbilities
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = ability.value;
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  onUpdate() {    
      const currentHP = foundry.utils.getProperty(actor, 'system.hitPoints.value');
      const maxHP = foundry.utils.getProperty(actor, 'system.hitPoints.max');
    
      if (currentHP <= Math.ceil(maxHP / 2)) {
          // Looking for half max, rounding up
          if (!actor.effects.some(e => e.statuses.has('crippled'))) {
              // Create the ActiveEffect from CONFIG.statusEffects
              const crippledEffect = ActiveEffect.fromStatusEffect('crippled');
              if (crippledEffect) {
                  // Apply the effect to the actor
                  actor.createEmbeddedDocuments("ActiveEffect", [crippledEffect]);
              }
          }
      } else {
          // Remove it if HP goes above half
          const existingEffect = actor.effects.find(e => e.statuses.has('crippled'));
          if (existingEffect) {
              existingEffect.delete();
          }
      }
  }

  async updateTokenReadyState(actorData) {
    if (game.user.isGM) {
      game.socket.emit("system.air-mercs", {action: "drawReadyOverlay", targetUUID: actorData.uuid});
      toggleReadyOverlay(actorData.uuid)
    }
    else game.socket.emit("system.air-mercs", {action: "playerReadyToggle", targetUUID: actorData.uuid});
  } 

  getRelBearing(shooterToken, targetToken) {
    const shooterTokenCenter = shooterToken.object.center; 
    const targetTokenCenter = targetToken.object.center;

    const x1 = shooterTokenCenter.x;
    const y1 = shooterTokenCenter.y;
    const x2 = targetTokenCenter.x;
    const y2 = targetTokenCenter.y;
    
    // Calculate the angle between the two tokens
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let angleToTarget = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) - 90;

    // Normalize angleToTarget to 0-360 degrees
    if (angleToTarget < 0) {
      angleToTarget += 360;
    }
    // Get the rotation of the shooter
    const shooterRotation = shooterToken.rotation;

    // Calculate relative bearing
    let relativeBearing = angleToTarget - shooterRotation;

    // Normalize relative bearing to 0-360 degrees
    if (relativeBearing < 0) {
      relativeBearing += 360;
    }
    return relativeBearing;
  }

  getInterceptBearing(shooterToken, targetToken) {
    const shooterTokenCenter = shooterToken.object.center; 
    let targetTokenCenter = 0;
    if (!targetToken.object) {
      //If targetToken isn't an object, it is a fixed point
      targetTokenCenter = targetToken;
    } else targetTokenCenter = targetToken.object.center;

    const x1 = shooterTokenCenter.x;
    const y1 = shooterTokenCenter.y;
    const x2 = targetTokenCenter.x;
    const y2 = targetTokenCenter.y;
    
    // Calculate the angle between the two tokens
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let angleToTarget = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) - 90;

    // Normalize angleToTarget to 0-360 degrees
    if (angleToTarget < 0) {
      angleToTarget += 360;
    }
    // Get the rotation of the shooter
    const shooterRotation = shooterToken.rotation;

    // Calculate relative bearing
    let relativeBearing = angleToTarget - shooterRotation;

    // Normalize relative bearing to 0-360 degrees
    if (relativeBearing < 0) {
      relativeBearing += 360;
    }
    return relativeBearing;
  }

  getDistance(shooterToken, targetToken) {
    const shooterTokenCenter = shooterToken.object.center; 
    const targetTokenCenter = targetToken.object.center;

    const x1 = shooterTokenCenter.x;
    const y1 = shooterTokenCenter.y;
    const x2 = targetTokenCenter.x;
    const y2 = targetTokenCenter.y;

    const pixelDistance = Math.hypot(x2 - x1, y2 - y1);

    const gridDistance = pixelDistance / canvas.grid.size;
    return gridDistance;
  } 

  get calcUpdatedAbilities() {
    const curAbilities = this.system.abilities
    const pilotAbilities = this.system.curPilot?.system?.abilities || {};

    let newTotal = {};
    for (const key in curAbilities) {
      if (curAbilities.hasOwnProperty(key)) {
          newTotal[key] = {
            total: (curAbilities[key]?.value ?? 0) + (pilotAbilities[key]?.value ?? 0)
          };
      }
    }
    return newTotal
  } 

  get calcTotalWeight() {
    const items = this.items; // Get all items
    const totalWeight = items.reduce((total, item) => {
        const weight = item.system.load || 0; // Ensure weight is valid
        return total + weight;
    }, 0);
    return totalWeight;
  }
}

async function drawDebugCircles(points, radius = 10, color = "#FF0000") {
  if (!canvas.scene) {
    console.error("No active scene found.");
    return;
  }

  let drawings = points.map((point) => ({
    x: point.x, // Center the circle
    y: point.y,
    shape: { type: "e", width: radius * 2, height: radius * 2 }, // "e" for ellipse
    strokeColor: color, // Outline color
    strokeWidth: 2,
    fillColor: color, // Fill color
    fillAlpha: 0.5, // Transparency
    locked: true // Prevent accidental movement
  }));

  // Use createEmbeddedDocuments to properly add drawings to the scene
  await canvas.scene.createEmbeddedDocuments("Drawing", drawings);
}
