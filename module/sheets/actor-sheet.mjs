import { prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class AirMercsActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  //BUTTON FUNCTIONS AND METHODS GO HERE TOO
  static DEFAULT_OPTIONS = {
    classes: ['air-mercs', 'actor'],
    position: {
      width: 750,
      height: 600,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
      prepPhaseReadyButton: this.prepPhaseReadyStoreData,
      prepPhaseExecuteButton: this.prepPhaseExecute,
      jettisonButton: this.jettisonOrdinance,
      cannonfireButton: this.burstSelect,
      weaponPrep: this.weaponPrepMessage,
      deleteMissile: this.missileDelete,
      chafffireButton: this.dispRadarCM,
      flarefireButton: this.dispIRCM,
      resolveMissileAttack: this.missileHit,
      removePilot: this.removePilot,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/air-mercs/templates/actor/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    features: {
      template: 'systems/air-mercs/templates/actor/features.hbs',
    },
    biography: {
      template: 'systems/air-mercs/templates/actor/biography.hbs',
    },
    gear: {
      template: 'systems/air-mercs/templates/actor/gear.hbs',
    },
    aircraft_weapons: {
      template: 'systems/air-mercs/templates/actor/aircraft_weapons.hbs',
    },
    effects: {
      template: 'systems/air-mercs/templates/actor/effects.hbs',
    },
    missile_header: {
      template: 'systems/air-mercs/templates/actor/missile_header.hbs',
    },
    missile_features: {
      template: 'systems/air-mercs/templates/actor/missile_features.hbs',
    },
    aircraft_header: {
      template: 'systems/air-mercs/templates/actor/aircraft_header.hbs',
    },
    aircraft_features: {
      template: 'systems/air-mercs/templates/actor/aircraft_features.hbs',
    },
    aircraft_speed: {
      template: 'systems/air-mercs/templates/actor/aircraft_speed.hbs',
    },
    character_features: {
      template: 'systems/air-mercs/templates/actor/character_features.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render, ['header', 'tabs', 'biography']
    options.parts = [];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'aircraft':
        options.parts.push('aircraft_header', 'tabs', 'aircraft_features', 'aircraft_speed', 'aircraft_weapons', 'effects', 'biography');
        break;
      case 'character':
        options.parts.push('header', 'tabs','character_features', 'gear', 'effects', 'biography');
        break;
      case 'npc':
        options.parts.push('header', 'tabs','gear', 'effects', 'biography');
      case 'missile':
        options.parts.push('missile_header', 'missile_features');
        break;
    }
  
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Output initialization
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.AIR_MERCS
      config: CONFIG.AIR_MERCS,
      tabs: this._getTabs(options.parts),
    };
    // Offloading context prep to a helper function
    this._prepareItems(context);

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'features':
      case 'character_features':
      case 'aircraft_features':
      case 'missile_features':
      case 'aircraft_speed':
      case 'aircraft_weapons':
      case 'missile_header':
      case 'gear':
        context.tab = context.tabs[partId];
        break;
      case 'biography':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        // Prepare active effects
        context.effects = prepareActiveEffectCategories(
          // A generator that returns all effects stored on the actor
          // as well as any items
          this.actor.allApplicableEffects()
        );
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    let defaultTab = null;
    switch (this.actor.type) {
      case "missile":
        defaultTab = 'missile_features'
        break;
      case "aircraft":
        defaultTab = 'aircraft_features'
        break;
      case "character":
        defaultTab = 'character_features'
        break;
    }

    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = defaultTab;
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'AIR_MERCS.Actor.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'missile_header':
        case 'aircraft_header':
        case 'tabs':
          return tabs;
        case 'biography':
          tab.id = 'biography';
          tab.label += 'Biography';
          break;
        case 'features':
          tab.id = 'features';
          tab.label += 'Features';
          break;
        case 'aircraft_features':
          tab.id = 'aircraft_features';
          tab.label += 'aircraft_features';
          break;
          case 'character_features':
          tab.id = 'character_features';
          tab.label += 'character_features';
          break;
        case 'missile_features':
          tab.id = 'missile_features';
          tab.label += 'missile_features';
          break;
        case 'aircraft_speed':
          tab.id = 'aircraft_speed';
          tab.label += 'aircraft_speed';
          break;
        case 'gear':
          tab.id = 'gear';
          tab.label += 'Gear';
          break;
        case 'aircraft_weapons':
          tab.id = 'aircraft_weapons';
          tab.label += 'aircraft_weapons';
          break;
        case 'effects':
          tab.id = 'effects';
          tab.label += 'Effects';
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    // You can just use `this.document.itemTypes` instead
    // if you don't need to subdivide a given type like
    // this sheet does with spells/aircraft_weapons 
    const gear = [];
    const features = [];
    const aircraft_weapons = [];

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {
      // Append to gear.
      if (i.type === 'gear') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells/aircraft_weapons.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          aircraft_weapons[i.system.spellLevel].push(i);
        }
      }
    }

    for (const s of Object.values(aircraft_weapons)) {
      s.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }

    // Sort then assign
    context.gear = gear.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.features = features.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.aircraft_weapons = aircraft_weapons;
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   * @override
   */
  _onRender(context, options) {

    super._onRender(context, options); // Ensure to call the parent render method
    
    if (this.actor.type == 'aircraft') {
      let maneuverSelect = document.getElementById("maneuver");
      const maneuverDetails = CONFIG.AIR_MERCS.maneuver; // Make sure to use "maneuver" for accessing the object
      const actor = this.actor;

      // Load saved maneuver from actor's data
      let savedManeuver = actor.currentManeuver; // Use flags to persist data
      if (savedManeuver) {
          maneuverSelect.value = savedManeuver; // Set the dropdown to the saved value
      }

      // Event listener for when the maneuver changes
      maneuverSelect.addEventListener("change", async (event) => {
          const selectedKey = event.target.value;

          const selectedManeuver = maneuverDetails[selectedKey];

          // Save the selection to the actor's flags for future tracking
          actor.currentManeuver = selectedKey // Use flags for persistence
          // Update the maneuver details display
          document.getElementById("maneuverName").textContent = selectedManeuver.name;
          document.getElementById("maneuverDiff").textContent = selectedManeuver.diff;
          document.getElementById("maneuverPassEffect").textContent = selectedManeuver.passEffect.movement;
          document.getElementById("maneuverFailEffect").textContent = selectedManeuver.failEffect.movement;

          const maneuverImageElement = document.getElementById("maneuverImage");
          maneuverImageElement.src = `systems/air-mercs/assets/maneuvers/${selectedManeuver.img}.png`;
      });

      // Update the details display immediately if a maneuver is already selected
      if (savedManeuver && maneuverDetails[savedManeuver]) {
          const selectedManeuver = maneuverDetails[savedManeuver];
          document.getElementById("maneuverName").textContent = selectedManeuver.name;
          document.getElementById("maneuverDiff").textContent = selectedManeuver.diff;
          document.getElementById("maneuverPassEffect").textContent = selectedManeuver.passEffect.movement;
          document.getElementById("maneuverFailEffect").textContent = selectedManeuver.failEffect.movement;

          const maneuverImageElement = document.getElementById("maneuverImage");
          maneuverImageElement.src = `systems/air-mercs/assets/maneuvers/${selectedManeuver.img}.png`;
      }

      this.#dragDrop.forEach((d) => d.bind(this.element));
      this.#disableOverrides();
      // You may want to add other special handling here
      // Foundry comes with a large number of utility classes, e.g. SearchFilter
      // That you may want to implement yourself.
      const speedSlider = this.element.querySelectorAll('.aircraft-speed-slider');

      for (const slider of speedSlider) {
        slider.addEventListener("change", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          const sliderValue = e.currentTarget.value;
          
          const valueDisplay = this.element.querySelector('.slider-value-display');
          if (valueDisplay) {
            valueDisplay.textContent = sliderValue;
          }
          
          const actorId = e.currentTarget.dataset.actorId;
          this.actor.update({ system: { speed: sliderValue } })
        });
      }
    }
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *
   * @this AirMercsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case 'item':
        const item = this._getEmbeddedDocument(target);
        if (item) return item.roll();
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest('li[data-document-class]');
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }

  _getTargetItem(target) {
    const li = target.closest(".item");
    console.log(li?.dataset.itemId) 
    return this.actor.items.get(li?.dataset.itemId);
  }

  //Chaff and Flare functions are largely identical, but I may want to do things with them differently in the future
  //Thus they are two seperate functions for the time being
  static async dispRadarCM() {
    this.dispCountermeasures('chaff')
  }

  static async dispIRCM() {
    this.dispCountermeasures('flare')
  }

  dispCountermeasures(type) {
    const shooter = this.actor
    const target = game.user.targets.values().next().value
    const cmType = type
    const missileType = target.actor.system.guidance
    const cmCount = shooter.system[cmType].value

    //Target validation checkpoint, papers please
    if (!shooter) {return ui.notifications.warn('No token selected');}
    if (!target) {return ui.notifications.warn('No target selected to defend against');}
    if (!cmCount) {return ui.notifications.warn(`You have no ${cmType} left`);}
    if (target.actor.type != 'missile') {return ui.notifications.warn(`Target is not a missile`);}
    if (target.actor.flags.airmercs.missileData.shotAt._id != shooter.id) {return ui.notifications.warn(`This missile is not fired at you`);}
    if (target.actor.flags.airmercs.missileData.isCounterMeasured) {return ui.notifications.warn(`This missile has already been countered`);}
    if (cmType == 'flare' && missileType != 'IR') {return ui.notifications.warn(`Flares only work on IR guided missiles!`);}
    if (cmType == 'chaff' && (!['ARH', 'SARH', 'CGR'].includes(missileType))) {return ui.notifications.warn(`Chaff only work on Radar guided missiles!`);}

    target.actor.update({flags: {airmercs: {missileData: {isCounterMeasured: {value: true}}}}});
    shooter.update({system: {[cmType]: {value: cmCount - 1}}});

    const chatMessage = `<h2><b>${shooter.name}</b> dispenses ${cmType} countermeasures against <b>${target.actor.name}</b></h2>`
    ChatMessage.create({ content: chatMessage });
  }

  static async removePilot() {
    this.actor.update({system: {curPilot: null}})
    console.log(this.actor.system)
  }

  static async missileHit() {
    const weapon = this.actor
    const weaponType = weapon.system.guidance

    const shooter = await fromUuid(weapon.flags.airmercs.missileData.shotByUUID);
    const target = await fromUuid(weapon.flags.airmercs.missileData.shotAtUUID);
    console.log(shooter)
    console.log(target)

    const weaponData = weapon.flags.airmercs.missileData

    let pilotSkill = 0; // Default value in case weaponType doesn't match

    if (weaponType === 'IR') {
        pilotSkill = shooter.system.abilities.ir_missiles.total;
    } else if (['ARH', 'SARH', 'CRG'].includes(weaponType)) {
        pilotSkill = shooter.system.abilities.radar_missiles.total;
    }
    const relBearing = shooter.getRelBearing(shooter,target)
    const outOfGimbal = !(relBearing <= 30 || relBearing >= 330) // If the radar can still be pointed at the target at the time of impact, only matters for SARH weapons
    let hitMod = 0
    let chatMessage =  `
                        <h2><b>${weapon.name}</b> flies towards <b>${target.name}</b>!</h2>
                        `

    hitMod += pilotSkill;
    pilotSkill < 0 ? chatMessage += `${pilotSkill}:<b> Pilot Weapon Rating</b>` : chatMessage += `+${pilotSkill}:<b> Pilot Weapon Rating</b>`
    console.log(`Pilot skill: ${pilotSkill}, total now: ${hitMod}`)

    switch (weaponType) {
      case 'IR':
        if (weaponData.launchAspect == 'Front') {
          hitMod += -2
          chatMessage += `<br>-2:<b> Frontal Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)
        }
        if (weaponData.launchAspect == 'Beam') {
          hitMod += -1
          chatMessage += `<br>-1:<b> Beam Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)

        }
        if (weaponData.launchAspect == 'Rear') {
          hitMod += 0
          chatMessage += `<br>+0:<b> Rear Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)
        }
        if (target.system.curSpeed.value >= 14) {
          hitMod += 1
          chatMessage += `<br>+1:<b> Target Engines Hot</b>`
          console.log(`Target Speed: ${target.system.curSpeed.value}, total now: ${hitMod}`)
        }
        break;
      case 'ARH':
      case 'SARH':
      case 'CRG':
      case 'OG':
      case 'LG':
        if (weaponData.launchAspect == 'Front') {
          hitMod += -1
          chatMessage += `<br>-1:<b> Frontal Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)
        }
        if (weaponData.launchAspect == 'Beam') {
          hitMod += -2
          chatMessage += `<br>-2:<b> Beam Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)
        }
        if (weaponData.launchAspect == 'Rear') {
          hitMod += 0
          chatMessage += `<br>+0:<b> Rear Launch Aspect</b>`
          console.log(`Aspect on launch: ${weaponData.launchAspect}, total now: ${hitMod}`)
        }
        if (weaponData.launchDistance > weapon.system.maxRange) {
          hitMod += -1
          chatMessage += `<br>+1:<b> Launched beyond Maximum range</b>`
          console.log(`Launched beyond max range: ${weaponData.launchDistance}, total now: ${hitMod}`)
        }
        break;
    }

    if (weaponData.launchDistance < weapon.system.minRange) {
      hitMod += -3
      chatMessage += `<br>-3:<b> Launched under Minimum range</b>`
      console.log(`Launched beyond min range: ${weaponData.launchDistance}, total now: ${hitMod}`)
    }

    if (weaponData.shooterSpeed >= 14) {
      mach = Math.floor((weaponData.shooterSpeed / 14));
      hitMod += mach
      chatMessage += `<br>+${mach}:<b> Launched at Mach ${mach}</b>`
      console.log(`Launched at mach ${mach}, total now: ${hitMod}`)
    }

    if (weaponData.hasLock) {
      if (['SARH'].includes(weaponType) && outOfGimbal) {
        hitMod += -3
        chatMessage += `<br>-3:<b> SARH Lock Lost!!</b>`
        console.log(`Lock lost from bearing ${relBearing}, total now: ${hitMod}`)
      }
    }

    if (!weaponData.hasLock) {
      hitMod += -3
      chatMessage += `<br>-3:<b> No Lock</b>`
      console.log(`No Lock, total now: ${hitMod}`)
    }

    if (target.system.curSpeed.value == 0) {
      hitMod += 1
      chatMessage += `<br>+1<b>: Target Stalled</b>`
      console.log(`Target Stalled total now ${hitMod}`)
    }
    else if (target.attemptedManeuverOutcome == 'failure' && target.attemptedManeuver.failEffect.defBonus != 0) {
      diceCount += 1
      chatMessage += `<br>+1<b>: Target Failed Maneuver</b>`
      console.log(`Target Failed to maneuver total now ${hitMod}`)
    }

    if (target.attemptedManeuverOutcome == 'success') {
      switch (target.attemptedManeuver) {
        case 'Break':
        case 'Viff':
          hitMod += -3
          chatMessage += `<br>-3:<b> Defensive ${target.attemptedManeuve}</b>`
          console.log(`Performed ${target.attemptedManeuve}: now at ${hitMod}`)
        break;
        case 'Split-S':
        case 'Immelmann':
        case 'Barrel Roll and Turn':
          hitMod += -2
          chatMessage += `<br>-2:<b> Defensive ${target.attemptedManeuve}</b>`
          console.log(`Performed ${target.attemptedManeuve}: now at ${hitMod}`)
        break;
        case 'Barrel Roll':
        case 'High Yo-Yo':
          hitMod += -1
          chatMessage += `<br>-1:<b> Defensive ${target.attemptedManeuve}</b>`
          console.log(`Performed ${target.attemptedManeuve}: now at ${hitMod}`)
        break;
      }
    }

    if (target.lowAltitude) {
      hitMod += -1
      chatMessage += `<br>-1:<b> Target is down low</b>`
      console.log(`Target Low, total now: ${hitMod}`)
    }

    if (weaponData.isCounterMeasured) {
      switch (weaponType) {
        case 'IR':
          hitMod += -2
          chatMessage += `<br>-2:<b> Dispensed Countermeasures</b>`
          console.log(`Countermeasures deployed, total now: ${hitMod}`)
        break;
        case 'SARH':
        case 'ARH':
          hitMod += -1
          chatMessage += `<br>-1:<b> Dispensed Countermeasures</b>`
          console.log(`Countermeasures deployed, total now: ${hitMod}`)
        break;
      }
    }

    if (target.hasDecoy) {
      hitMod += -2
      chatMessage += `<br>-2:<b> Towed Decoy</b>`
      console.log(`Towing Decoy, total now: ${hitMod}`)
    }

    const modifiedHit = hitMod < 0 ? `${hitMod}` : `+${hitMod}`

    chatMessage += `<br><br><b>Hit Roll: </b>1d10${modifiedHit}
                    <br><b>Weapon hits on: </b>${weapon.system.hit}+
                    <br><b>Damage: </b>${weapon.system.damage} 
                    <button class="roll-missilehitattempt" type="button">Roll to Hit</button>
                    `
    ChatMessage.create({ content: chatMessage }).then(msg => {
      Hooks.once("renderChatMessage", (chatMessage, html) => {
        html.find(".roll-missilehitattempt").click(() => {missilehitattempt(weapon, shooter, target, modifiedHit)});
      });
    });
    async function missilehitattempt(weapon, shooter, target, modifiedHit) {
      event.preventDefault();
      let roll = await new Roll(`1d10`).evaluate({ async: true });
      const diceResults = roll.dice[0].results.map(r => Number(r.result));

      const dieTotal = Number(diceResults) + Number(modifiedHit)
      let resultEvent = dieTotal >= weapon.system.hit ? 'Hit!' : 'Miss!'
      if (diceResults == 1) {resultEvent = 'Automatic Miss!'};
      if (diceResults == 10) {resultEvent = 'Automatic Hit!'};

      const chatMessage = `<h2><b>${weapon.name}</b> flies towards <b>${target.name}</b>!</h2>
                          <p style="text-align:center"><b>Hit Roll: </b>1d10${modifiedHit}<br><b>Weapon hits on: </b>${weapon.system.hit}+<p>
                          <h3><p style="text-align:center"><b>Result: ${diceResults}${modifiedHit} = ${dieTotal}<br>${resultEvent}</p></b></h3>
                          <button class="roll-missiledamage" type="button">Roll Damage</button>
                          `

      ChatMessage.create({ content: chatMessage }).then(msg => {
        Hooks.once("renderChatMessage", (chatMessage, html) => {
          html.find(".roll-missiledamage").click(() => {missiledamage(weapon, shooter, target)});
        });
      });
    }
    async function missiledamage(weapon, shooter, target) {
      let roll = await new Roll(`${weapon.system.damage}`).evaluate({ async: true });
      const diceResults = roll.dice[0].results.map(r => Number(r.result));
      const totalDamage = diceResults.reduce((sum, value) => sum + value, 0);
      const chatMessage = `<h2><b>${weapon.name}</b> detonates!</h2>
                          <p style="text-align:center"><b>Damage Roll: </b>${weapon.system.damage}<p>
                          <h3><p style="text-align:center"><b>${weapon.system.damage} Result: ${diceResults} <br>${totalDamage} Damage!</p></b></h3>
                          <button class="roll-extraDamageTable" type="button">Additional Damage Table</button>
                          `
      target.update({system: {hitPoints: {value: (target.system.hitPoints.value - totalDamage)}}})

      ChatMessage.create({ content: chatMessage }).then(msg => {
        Hooks.once("renderChatMessage", (chatMessage, html) => {
          html.find(".roll-extraDamageTable").click(() => {extraDamageTable('air-mercs.rollable-tables', 'Aircraft Damage')});
          });
        });

        async function extraDamageTable(compendiumName, tableName) {
          console.log("starting table")
          // Get the compendium
          const pack = game.packs.get(compendiumName);
          if (!pack) {
              console.error(`Compendium '${compendiumName}' not found.`);
              return;
          }
      
          // Load all index data (so we can search by name)
          await pack.getIndex();
          
          // Find the table entry
          const tableEntry = pack.index.find(e => e.name === tableName);
          if (!tableEntry) {
              console.error(`Table '${tableName}' not found in compendium '${compendiumName}'.`);
              return;
          }
      
          // Get the full RollTable document
          const table = await pack.getDocument(tableEntry._id);
          if (!table) {
              console.error(`Failed to retrieve table '${tableName}'.`);
              return;
          }
      
          // Roll on the table and return the result
          console.log("rolling table")
          return await table.draw();
      }
    }
  }



  static async missileDelete() {
    //I know some coder somewhere is going to be really upset by this
    //But missiles start as items for actors, and then temporarily become actors in order to have sheets and a token
    //and once We're done with them they can be disposed of, otherwise we accumulate actors per missile fired
    //So a campaign might be several missions in and you'll have 80 some actors you will NEVER use again
    if (this.actor.type === !'missile') {return ui.notifications.warn('Something has gone very wrong in the delete process!');}

    new Dialog({
      title: "Confirm Action",
      content: `Are you sure you wish to delete <strong>${this.actor.name}</strong>?`,
      buttons: {
        Yes: {
          label: "Delete",
          callback: () => {
            const weaponActor = this.actor
            const weaponToken = canvas.tokens.placeables.filter(t => t.actor?.id === weaponActor.id);
            const weaponTokenUUID = weaponToken.map(t => t.document.uuid)
            Promise.all(weaponToken.map(t => t.document.delete()));
            weaponActor.delete();
          }
        },
        Cancel: {
          label: "Cancel",
          callback: () => {} // No action needed for cancel
        }
      },
      default: "Cancel", // Sets the default button to "No"
    }).render(true);
  }

  static async jettisonOrdinance(event, target) { 
    const tarItem = this._getTargetItem(target);
    await tarItem.delete();
  }

  static async weaponPrepMessage(event, target) {
    const airTarget = game.user.targets.values().next().value
    const shooterUUID = this.actor?.uuid
    let shooter = await fromUuid(shooterUUID);

    let weapon = this._getTargetItem(target)
    switch (weapon.type) {
      case 'missile':
      const lockon = weapon.system.lock === 'radar'? shooter.system.radar.value : weapon.system.lock;
      const lockType = weapon.system.lock
      const locks = 0
      const pilotSkill = weapon.system.lock === 'radar'? shooter.system.abilities.radar_missiles : shooter.system.abilities.ir_missiles
      const availableWeapons = shooter.items.reduce((count, item) => count + (item.name === weapon.name ? 1 : 0), 0)
      const chatMessage = `
                          <h2><b>${shooter.name}</b> preps a <b>${weapon.name}</b>!</h2>
                          <b>${weapon.system.guidance} Lock: </b>${lockon}+
                          <br><b>Aspect: </b>${weapon.system.aspect}
                          <br><b>Range: </b>${weapon.system.minRange} - ${weapon.system.maxRange} 
                          <br><b>Hit: </b>${weapon.system.hit}+
                          <br><b>Damage: </b>${weapon.system.damage} 
                          <button class="roll-lockattempt" type="button" data-lockvalue="${lockon}">Attempt Lock-on</button>
                          <button class="roll-launchattempt" type="button">Launch Weapon (unlocked)</button>
                          `
      ChatMessage.create({ content: chatMessage }).then(msg => {
        Hooks.once("renderChatMessage", (chatMessage, html) => {
          html.find(".roll-lockattempt").click(() => {handleMissileLock(weapon, lockType, shooter)});
          html.find(".roll-launchattempt").click(() => {launchAttempt(locks, weapon, airTarget, pilotSkill, availableWeapons)});
        });
      });
        return;
      case 'actor':
        console.log("It's not a missile!")
        return;
      }

    async function handleMissileLock(weapon, lockType, shooter) {
      event.preventDefault();
      if (!game.user.targets.values().next().value) {return ui.notifications.warn('No Lock Target Selected!');} 
      const target = game.user.targets.values().next().value.actor
      const availableWeapons = shooter.items.reduce((count, item) => count + (item.name === weapon.name ? 1 : 0), 0)
      let diceCount = 0
      availableWeapons > 1 ? diceCount = 2 : diceCount = 1
      lockType === 'radar'? diceCount = 1 : diceCount = 2
      if (shooter == target) {return ui.notifications.warn('Attempting to Fire at Self');}    
      if (shooter.system.radar.value == 0) {ChatMessage.create({ content: `${this.actor.name} has no Air-to-Air Radar and can't lock-on!` });} 

      //Aspect checks
      let targetAspect = shooter.getRelBearing(target, shooter)
      if (weapon.aspect === 'rear-180') {
        if (!(targetAspect >= 90 && targetAspect <= 270)) {return ui.notifications.warn('This Missile requires a Rear 180 aspect!');};
      };
      if (weapon.aspect === 'rear-60') {
        if (!(targetAspect >= 150 && targetAspect <= 210)) {return ui.notifications.warn('This Missile requires a Rear 60 aspect!');};
      };
  
      let dieTarget = lockType === 'radar' ? shooter.system.radar.value : weapon.system.lock
      let modifiers = 0
      const pilotSkill = lockType === 'radar' ? shooter.system.abilities.radar_missiles : shooter.system.abilities.ir_missiles
      const tarECM = target.system.ecm.value

      let chatMessage = `
                        <h2><b>${shooter.name}</b> attempts to lock onto <b>${target.name}</b>!</h2>
                        <b>${weapon.system.guidance} Locks on: </b>${dieTarget}+<br>
                        `

      if (target.lowAltitude) {
        //TODO: This is a placeholder for when we add high/low alt conditions
        chatMessage += `<br>-1:<b> Target Down Low</b>`
        modifiers += -1
      }
      if (lockType === 'radar') {
        //TODO: This is a placeholder for when we add high/low alt conditions
        chatMessage += `<br>${tarECM}:<b> ECM</b>`
        modifiers += tarECM
      }
      let modString = modifiers < 0 ? modifiers : `+${modifiers}`

      let roll = await new Roll(`${diceCount}d10+${modifiers}`).evaluate({ async: true });
      let diceResults = roll.dice[0].results.map(r => Number(r.result));
      const locks = diceResults.filter(die => die >= dieTarget).length;
      let lockString = lockType === 'radar' ? `Radar locked on!` : `${locks} IR Locks`
      locks == 0 ? lockString = 'Unable to Lock Target!' : ``

      chatMessage +=    `
                        <br><br><b>${diceCount}d10${modString}: </b> ${diceResults.join(", ")}
                        <br><h2><b>${lockString}</b></h2>
                        <button class="roll-launchattempt" type="button" data-lockcount="${locks}">Launch Weapon</button>
                        `

      ChatMessage.create({ content: chatMessage }).then(msg => {
        Hooks.once("renderChatMessage", (chatMessage, html) => {
          html.find(".roll-launchattempt").click(() => {launchAttempt(shooter, locks, weapon, target, pilotSkill, availableWeapons)});
        });
      });
      
    }

    async function launchAttempt(shooter, locks, weapon, target, pilotSkill, availableWeapons) {
      if (!target) {return ui.notifications.warn('No Lock Target Selected!');} 
      event.preventDefault();
      console.log("Attempting to launch with", locks, "locks")
      new Dialog({
        title: "Confirm Action",
        content: `<p>Launching <b>${weapon.name}</b> at <b>${target.name}</b> with: <b>${locks}</b> weapons locked and <b>${availableWeapons}</b> weapons available.<p>How many will you use?`,
        buttons: {
          One: {
            label: "One",
            callback: () => handleMissileLaunch(shooter, 1, locks, weapon, target, pilotSkill)
          },
          Two: {
            label: "Two",
            callback: () => handleMissileLaunch(shooter, 2, locks, weapon, target, pilotSkill)
          },
          Cancel: {
            label: "Cancel",
            callback: () => {} // No action needed for cancel
          }
        },
        default: "Cancel", // Sets the default button to "No"
        render: (html) => {
          if (availableWeapons < 2 || weapon.system.guidance === 'SARH') {
            let twoButton = html.find("button:contains('Two')");
            twoButton.prop("disabled", true).css("opacity", "0.5"); // Disables and greys out
          }
        }
      }).render(true);

      async function handleMissileLaunch(shooter, LaunchCount, locks, weapon, target, pilotSkill) {
        event.preventDefault();
        const scene = game.scenes.active;
        if (!scene) {
            ui.notifications.error("No active scene found!");
            return;
        }

        function getLeadPosition() {
          //This will find the angle of the lead position relative to the shooters facing
          //Given that this is the angle, it's agnostic of the forward or backward facing of the target
          //We will combine it with a distance to the target to calculate a reasonable lead tracking solution
          const angle = (target.parent.rotation + 90) * (Math.PI / 180); // Convert degrees to radians, all South is 0 degrees, Foundry.txt I guess
          const speed = target.system.curSpeed.value
          const gridSize = canvas.scene.grid.size; 
          const gridDistance = canvas.scene.grid.distance; 

          const speedInPixels = (speed * gridSize) / gridDistance;
          const newX = target.parent.x + speedInPixels * Math.cos(angle);
          const newY = target.parent.y + speedInPixels * Math.sin(angle);

          //TODO: Make this not shitty and getRelBearing() should accept more than just actors... or something else idk I'm not a smart man
          let tarPoint = {}
          tarPoint.token = {}
          tarPoint.token.x = 0
          tarPoint.token.y = 0
          tarPoint.token.x = newX
          tarPoint.token.y = newY
          const bearingLead = shooter.getRelBearing(shooter, tarPoint)
          return { x: newX, y: newY, bearing: bearingLead};
        }

        const interceptPoint = getLeadPosition()
        const leadAngle = getLeadPosition().bearing
            const startX = shooter.parent.x, startY = shooter.parent.y; // starting coordinates
            const endX = target.parent.x, endY = target.parent.y
        const tarDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) //raw dist to target
        const ipDistance = Math.sqrt((interceptPoint.x - startX) ** 2 + (interceptPoint.y - startY) ** 2)
        const shortestDist = ipDistance < tarDistance ? ipDistance : tarDistance
        const distScalar = 0.8 //what percent of the distance to target do we want to create our token at
        const calcdistance = shortestDist  * distScalar; 
        // const leadPos = getNewPositionFromAzimuth(startX, startY, leadAngle, distance);
        const leadAngleRad =  Math.toRadians(shooter.parent.rotation + 90+leadAngle)
        const ray = Ray.fromAngle(shooter.parent.x, shooter.parent.y, leadAngleRad , calcdistance )
        const secondWeapon = shooter.items.find(item => item.name === weapon.name && item.id !== weapon.id);
        const weaponIDArray = [weapon, secondWeapon]
        console.log(weaponIDArray)

        //the logic for assigning a second weapon for a second launch is very bad
        //I make no excuses other than my eyes hurt and words are starting to blur together
        //I have dishonored my family

        const aspect = shooter.getRelBearing(target, shooter)
        let tarAspect = ''
          if ((aspect <= 130 && aspect >= 90) || (aspect <= 270 && aspect >= 210))
            {tarAspect = 'Beam'}
          else if (aspect > 90 && aspect < 210)
            {tarAspect = 'Rear'}
          else {tarAspect = 'Front'}
        for (let i = LaunchCount; i > 0; i--) {
          let activeWeapon = weaponIDArray[i - 1]
          console.log(weaponIDArray[i])
          console.log(i)
          
          //Create an actor so the token has a sheet where we click buttons to resolve the token
          let missileActorData = {
            name: `${weapon.name}`,
            type: "missile",
            img: weapon.img,
            system: weapon.toObject().system,
            flags: {
                "airmercs.missileData": {
                    launchAspect: tarAspect,
                    shotBy: shooter,
                    shotByUUID: shooter.uuid,
                    shooterSpeed: shooter.system.curSpeed.value,
                    shotAt: target,
                    shotAtUUID: target.uuid,
                    shooterSkill: pilotSkill.value,
                    hasLock: locks > 0 ? true : false,
                    isCounterMeasured: false,
                    launchDistance: Number(shooter.getDistance(shooter, target).toPrecision(2))
                }
            }
          };

          let missileActor = await Actor.create(missileActorData);
          if (!missileActor) {
              console.error("Failed to create missile actor");
              continue;
          }

          let filename = weapon.img.split("/").pop()
          let tokenData = {
            name: weapon.name,
            texture: { src: `systems/air-mercs/assets/missiles/tokens/${filename}` },
            x: (ray.B.x) + ((i-1) * 25),
            y: (ray.B.y) + ((i-1) * 25),
            rotation: shooter.parent.rotation + leadAngle, 
            width: 0.3, 
            height: 0.3,
            vision: false,
            actorLink: true,
            actorId: missileActor.id, 
          };
          locks--
          await shooter.deleteEmbeddedDocuments("Item", [activeWeapon.id]);
          await scene.createEmbeddedDocuments("Token", [tokenData]);
        }
      }
    }

  }




  static burstSelect() {
    if (!this.actor.getActiveTokens()?.[0]?.document.actor) {return ui.notifications.warn('Select a Token to be the Shooter');}
    if (!game.user.targets.values().next().value.actor) {return ui.notifications.warn('Select a Token to be the Target');}

    const shooter = this.actor.getActiveTokens()?.[0]?.document.actor
    const target = game.user.targets.values().next().value.actor

    if (this.actor.getActiveTokens()?.[0]?.document.actor.uuid != canvas.tokens.controlled[0].actor.token.actor.uuid) {return ui.notifications.warn('Verify your selected Shooter');}
    if (shooter == target) {return ui.notifications.warn('Attempting to Fire at Self');}

    new Dialog({
      title: "Confirm Action",
      content: "<p>Select Burst Length</p>",
      buttons: {
        Long: {
          label: "Long",
          callback: () => handleCannonShot("Long", shooter, target)
        },
        Medium: {
          label: "Medium",
          callback: () => handleCannonShot("Medium", shooter, target)
        },
        Short: {
          label: "Short",
          callback: () => handleCannonShot("Short", shooter, target)
        },
        No: {
          label: "Cancel",
          callback: () => {} // No action needed for cancel
        }
      },
      default: "No" // Sets the default button to "No"
    }).render(true);

      /** Handles shooting logic */
    async function handleCannonShot(range, shooter, target) {
      event.preventDefault();
      
      let [diceCount, rangeBand, chatMessage] = shooter.shootCannon(range, shooter, target);
      ChatMessage.create({ content: chatMessage });

      Hooks.once("renderChatMessage", (chatMessage, html) => {
        html.find(".roll-gunsgunsguns").click(() => resolveAttackRoll(diceCount, rangeBand, shooter));
      });
    }

    /** Processes dice roll and sends results */
    async function resolveAttackRoll(diceCount, rangeBand, shooter) {
      let roll = await new Roll(`${diceCount}d6`).evaluate({ async: true });
      let diceResults = roll.dice[0].results.map(r => Number(r.result));
      let hits = diceResults.filter(die => die >= rangeBand).length;

      console.log(diceResults, rangeBand, hits);

      let chatMessage = `
                        <h2><b>${shooter.name}</b> opens fire!</h2>
                        <b>${diceCount}d6 Rolls: </b> ${diceResults.join(", ")}
                        <br><b>Hitting on:</b> ${rangeBand}+
                        <br><h3><b> Total Damage: </b> ${hits}</h3>
                        <button class="roll-extraDamageTable" type="button">Additional Damage Table</button>
                        `
      target.update({system: {hitPoints: {value: (target.system.hitPoints.value - hits)}}})

      ChatMessage.create({ content: chatMessage }).then(msg => {
        Hooks.once("renderChatMessage", (msg, html) => {
          html.find(".roll-extraDamageTable").click(() => {extraDamageTable('air-mercs.rollable-tables', 'Aircraft Damage')});
        });
      });

      async function extraDamageTable(compendiumName, tableName) {
        console.log("starting table")
        // Get the compendium
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            console.error(`Compendium '${compendiumName}' not found.`);
            return;
        }
    
        // Load all index data (so we can search by name)
        await pack.getIndex();
        
        // Find the table entry
        const tableEntry = pack.index.find(e => e.name === tableName);
        if (!tableEntry) {
            console.error(`Table '${tableName}' not found in compendium '${compendiumName}'.`);
            return;
        }
    
        // Get the full RollTable document
        const table = await pack.getDocument(tableEntry._id);
        if (!table) {
            console.error(`Failed to retrieve table '${tableName}'.`);
            return;
        }
    
        // Roll on the table and return the result
        console.log("rolling table")
        return await table.draw();
    }

    }
  }


  






  static prepPhaseReadyStoreData() {
    if (this.actor.getFlag('air-mercs', 'prepPhaseReady') == true) {
      ui.notifications.warn("You are already locked and ready!");
      return;
      }
    
    new Dialog({
      title: "Confirm Action",
      content: "<p>Are you sure these are the settings you want?</p>",
      buttons: {
        yes: {
          label: "GO!",
          callback: () => {
            this.actor.setFlag('air-mercs', 'prepPhaseReady', true)
            event.preventDefault();
            const actorData = this.actor;
            this.actor.updateTokenReadyState(actorData);
            let lockedManeuver = this.actor.currentManeuver;
            this.actor.update({ 
              system: { 
                speed: 0, 
                curSpeed: {value: Number(this.actor.system.curSpeed.value) + Number(this.actor.system.speed) }, 
                lockedManeuver: lockedManeuver 
              }
            });
            let targetName = this.actor.name;
            let start_message = `<h2><strong>${targetName} is ready!</strong></h2>`
              ChatMessage.create({content: start_message})
          }
        },
        no: {
          label: "No-Go",
          callback: () => {
          }
        }
      },
      default: "no" // Sets the default button to "no"
    }).render(true);
    
  }

  static prepPhaseExecute() {
    const actorData = this.actor;
    if (this.actor.getFlag('air-mercs', 'prepPhaseReady') !== true) {
      ui.notifications.warn("You must Ready Up with a new speed and maneuver first!");
      return;
      }

    new Dialog({
      title: "Confirm Action",
      content: "<p>Are you sure you're ready to execute?</p>",
      buttons: {
        yes: {
          label: "GO!",
          callback: () => {
            event.preventDefault();
            this.actor.setFlag('air-mercs', 'prepPhaseReady', false);
            this.actor.updateTokenReadyState(actorData);

            let targetName = this.actor.name;
            let targetManeuver = CONFIG.AIR_MERCS.maneuver[this.actor.system.lockedManeuver];
            let targetManeuverString = game.i18n.localize(targetManeuver.name);
            //FIX LATER: If player chooses No Maneuver as their first maneuver of the session we will read an incorrect value

            let start_message = `
                                <h2>${targetName} attempts:<br><b>${targetManeuverString}!</b></h2>
                                <p><b>Difficulty: </b>${targetManeuver.diff}</body>
                                <p><b>Maneuver Rating: </b>1d10+${this.actor.system.abilities.maneuvers.total}
                                <button class="roll-maneuver" type="button" data-passeffect = "${targetManeuver.passEffect.movementHTML}" 
                                data-faileffect = "${targetManeuver.failEffect.movementHTML}" 
                                data-diff="${targetManeuver.diff}" 
                                data-maneuvers="${this.actor.system.abilities.maneuvers.total}">Execute Maneuver</button>
                                `
              ChatMessage.create({content: start_message})

              Hooks.once("renderChatMessage", (chatMessage, html) => {
                html.find(".roll-maneuver").click(async event => {

                  let diff = Number(event.currentTarget.dataset.diff);
                  let maneuversValue = Number(event.currentTarget.dataset.maneuvers);
                  let maneuverPass = event.currentTarget.dataset.passeffect;
                  let maneuverFail = event.currentTarget.dataset.faileffect;

                  let roll = await new Roll('1d10').evaluate({ async: true });
                  let rollResult = roll.total;
                  let total = rollResult + maneuversValue;
                  let success = total >= diff ? "success" : "failure";
                  
                  let outcomeInstruction = (success == "success" ? maneuverPass : maneuverFail)

                  let resultMessage = `
                                      <h2>Maneuver Result: <span style="text-transform:uppercase;"><b>${success}</b></span></h2>
                                      <b>Roll: </b> ${rollResult}
                                      <br><b>Total: ${total}</b>
                                      <p>${outcomeInstruction}</p>
                                      `
                  ChatMessage.create({content: resultMessage});
                  this.actor.attemptedManeuver = targetManeuver
                  this.actor.attemptedManeuverOutcome = success
                });
              });
            }
          },
        no: {
          label: "No-Go",
          callback: () => { }
        }
      },
      default: "no" // Sets the default button to "no"
        }).render(true);
    
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;

    // Chained operation
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();

    if (!dragData) return;
    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) { }

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;
    // Handle different data types
    switch (data.type) {
      case 'ActiveEffect':
        return this._onDropActiveEffect(event, data);
      case 'Actor':
        return this._onDropActor(event, data);
      case 'Item':
        return this._onDropItem(event, data);
      case 'Folder':
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass('ActiveEffect');
    const effect = await aeCls.fromDropData(data);
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments('ActiveEffect', updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments('ActiveEffect', directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;

    let sourceActor = null;
    sourceActor = await fromUuid(data.uuid);
    console.log(sourceActor)

    if (!sourceActor) {
      return;
    }

    if (sourceActor.type != 'character') {
      return
    }

    let activePilot = this.actor.system.curPilot
    if (activePilot == 'actorUUID') {activePilot = null} //This is due to bad handling on my part, will fix when test Actors are reimported
    if (activePilot) {return ui.notifications.warn('This Aircraft already has a pilot.')}

    this.actor.update({system: {curPilot: sourceActor}});
    
    console.log(`current pilot: ${this.actor.system.curPilot}`)
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    // Handle item sorting within the same Actor
    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    // Create the owned item
    return this._onDropItemCreate(item, event);
  }

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== 'Item') return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
   * @param {Event} event
   * @param {Item} item
   * @private
   */
  _onSortItem(event, item) {
    // Get the drag source and drop target
    const items = this.actor.items;
    const dropTarget = event.target.closest('[data-item-id]');
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if (item.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments('Item', updateData);
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _processSubmitData(event, form, submitData) {
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.document.update(submitData);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }
}
