/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AirMercsActor extends Actor {
  /** @override */
  prepareData() {
    Hooks.on('dropActorSheetData', async (actor, sheet, data) => {
      if (data.type === "Item") {
        setTimeout(() => {
          console.log(actor.calculateTotalWeight())
          actor.update({ "system.capacity.value": actor.calculateTotalWeight() });
        }, 100);
      }
    });
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

  updateTokenReadyState(actorData) {
    const readyState = actorData.getFlag('air-mercs', 'prepPhaseReady')
    if (readyState == null) {
      return;
    }
    const tokens = canvas.tokens.placeables.filter(t => t.actor?.id === this.id);
    tokens.forEach(token => {
      let existingText = token.children.find(child => child.name === 'readyText');

    if (!readyState) {
      let readyText = new PIXI.Text('READY!', {
        fontFamily: 'Arial',
        fontSize: 30,
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 4,
      });

      readyText.name = 'readyText';
      readyText.anchor.set(0,1);
      readyText.x = ((token.width / 2) - (readyText.width / 2));
      readyText.y = 0;

      token.addChild(readyText)
    } 

    if (readyState) {
      token.removeChild(existingText);
    }

    });
  } 

  getRelBearing(shooter, target) {

    // Get the position of both tokens
    const x1 = shooter.token.x //+ (shooter.token.width * canvas.grid.size) / 2;
    const y1 = shooter.token.y //+ (shooter.token.height * canvas.grid.size) / 2;
    const x2 = target.token.x //+ (target.token.width * canvas.grid.size) / 2;
    const y2 = target.token.y //+ (target.token.height * canvas.grid.size) / 2;
    
    // Calculate the angle between the two tokens
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let angleToTarget = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) - 90;

    // Normalize angleToTarget to 0-360 degrees
    if (angleToTarget < 0) {
      angleToTarget += 360;
    }
    // Get the rotation of the shooter
    const shooterRotation = shooter.token.rotation;

    // Calculate relative bearing
    let relativeBearing = angleToTarget - shooterRotation;

    // Normalize relative bearing to 0-360 degrees
    if (relativeBearing < 0) {
      relativeBearing += 360;
    }
    return relativeBearing;
  }

  getDistance(shooter, target) {
    const x1 = shooter.token.x;
    const y1 = shooter.token.y;
    const x2 = target.token.x;
    const y2 = target.token.y;

    const pixelDistance = Math.hypot(x2 - x1, y2 - y1);

    const gridDistance = pixelDistance / canvas.grid.size;

    console.log(`Pixel Distance: ${pixelDistance}, Grid Distance: ${gridDistance}`);

    return gridDistance;
  } 


  calculateTotalWeight() {
    const items = this.items.contents; // Get all items
    const totalWeight = items.reduce((total, item) => {
        const weight = item.system.load || 0; // Ensure weight is valid
        return total + weight;
    }, 0);
    console.log(totalWeight)
    return totalWeight;
  }

  shootCannon(burst, shooter, target) {
    const relBearing = shooter.getRelBearing(shooter,target)
    const aspect = shooter.getRelBearing(target,shooter)
    const distance = Number(shooter.getDistance(target,shooter)).toPrecision(2)
    const ammoCount = shooter.system.ammo.value
    const burstLen = burst
    const pilotSkill = shooter.system.abilities.gunnery.value
    const gunValue = shooter.system.gun.value
    const tarSpeed = target.system.curSpeed
    
    let rangeBand = 0
    let diceCount = 0
    let distanceName = ''

    if (ammoCount < 1) {return ui.notifications.warn('Out of Ammo!');}
    if (ammoCount < burstLen) {return ui.notifications.warn('Not enough Ammo for this Burst Length!');}   
    if (!(relBearing <= 15 || relBearing >= 345)) {return ui.notifications.warn('Target not in frontal 30 degree arc');}
    if (distance > 9) {return ui.notifications.warn('Target is out of range: Further than 9');}
    if (distance <= 3) {rangeBand = 3; distanceName = 'Short'}
    else if (distance <= 6) {rangeBand = 5; distanceName = 'Medium'}
    else if (distance <= 9) {rangeBand = 6; distanceName = 'Long'}
    
    let chatMessage = `
                      <h2><b>${shooter.name}</b> fires a ${burstLen} burst at: <b>${target.name}</b> from ${distanceName} range!</h2>
                      `

    //Value of onboard Gun
    diceCount += gunValue
    chatMessage += `<p>+${gunValue}:<b> Aircraft Gun Rating</b>`
    console.log("Gun Value:", diceCount)

    //Length of Burst bonus
    switch (burstLen) {
      case 'Short':
        diceCount += -2;
        shooter.system.ammo.value += -1
        chatMessage += `<br>-2:<b> Burst Length</b>`
        console.log("Burst Length: Short")
        break;
      case 'Medium':
        diceCount += 0;
        shooter.system.ammo.value += -2
        chatMessage += `<br>+0:<b> Burst Length</b>`
        console.log("Burst Length: Medium")
        break;
      case 'Long':
        diceCount += 2;
        shooter.system.ammo.value += -3
        chatMessage += `<br>+2:<b> Burst Length</b>`
        console.log("Burst Length: Long")
        break;
    }
    console.log("Dice Pool Now:", diceCount)

    //Pilot Skill (Gunnery)
    diceCount += pilotSkill;
    pilotSkill < 0 ? chatMessage += `<br>${pilotSkill}:<b> Pilot Gunnery Rating</b>` : chatMessage += `<br>+${pilotSkill}:<b> Pilot Gunnery Rating</b>`
    console.log("Pilot Skill:", pilotSkill)
    console.log("Dice Pool Now:", diceCount)

    //Firing from Beam aspect
    if ((aspect <= 130 && aspect >= 90) || (aspect <= 270 && aspect >= 210)) {
      diceCount += -2
      chatMessage += `<br>-2<b>: Firing From Beam</b>`
      console.log("Firing From Beam")
      console.log("Dice Pool Now:", diceCount)
    }

    //Enemy Maneuver Bonus/Malus
    if (tarSpeed == 0) {
      diceCount += 2
      chatMessage += `<br>+2<b>: Target Stalled</b>`
      console.log("Target Stalled")
      console.log("Dice Pool Now:", diceCount)
    }
    else if (target.attemptedManeuverOutcome == 'failure' && target.attemptedManeuver.failEffect.defBonus != 0) {
      diceCount += 2
      chatMessage += `<br>+2<b>: Target Failed Maneuver</b>`
      console.log("Target Failed Maneuver")
      console.log("Dice Pool Now:", diceCount)
    }

    //Firing from Front
    if (aspect < 90 || aspect > 270) {
      diceCount = Math.ceil((diceCount / 2))
      chatMessage += `<br>DICE COUNT HALVED<b>: Firing From Front</b`
      console.log("Firing From Front Aspect")
      console.log("Dice Pool Now:", diceCount)
    }

    //Target is Maneuvering
    if (target.attemptedManeuverOutcome == 'success') {
      diceCount = Math.ceil((diceCount / 2))
      chatMessage += `<br>DICE COUNT HALVED<b>: Target Successfully Maneuvering</b>`
      console.log("Target Is Maneuvering")
      console.log("Dice Pool Now:", diceCount)
    }
    
    chatMessage += `
                    <p><b>Total Dice:</b> ${diceCount}d6 hitting on ${rangeBand}+ 
                    <button class="roll-gunsgunsguns" type="button">Guns! Guns! Guns!</button>
                    `

    console.log('Final Dice Pool of:', diceCount, "With Target Number:", rangeBand)
    return [diceCount, rangeBand, chatMessage];
  } 

}
