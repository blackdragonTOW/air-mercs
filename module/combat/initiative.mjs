export class Initiative extends Combat {
    /** @override */

    /**
   * Define how the array of Combatants is sorted in the displayed list of the tracker.
   * This method can be overridden by a system or module which needs to display combatants in an alternative order.
   * The default sorting rules sort in descending order of initiative using combatant IDs for tiebreakers.
   * @param {Combatant} a     Some combatant
   * @param {Combatant} b     Some other combatant
   * @protected
   */

    _sortCombatants(a, b) {
    // return positive or negative number for a > b vs. a < b
        const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
        const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
        return (ia - ib) || (a.id > b.id ? 1 : -1);
    }
    
    /* Tie Breaker decimalization
    0.x000000 pilot rating  (0.1000000 * (id.reactions + 3)                ) //stats run -3 to 3, lets convert to a 0-6 value
    0.0xx0000 current speed (0.0010000 * (id.curSpeed)                     )
    0.000xx00 turn rate     (0.0000100 * (id.turnRate)                     )
    0.00000xx random d100   (0.0000001 * (Math.floor(Math.random() * 100)) )
    */ 

    async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        const chatRollMode = game.settings.get("core", "rollMode");
    
        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        for ( let [i, id] of ids.entries() ) {
    
        // Get Combatant data (non-strictly)
        const combatant = this.combatants.get(id);
        if ( !combatant?.isOwner ) continue;
    
        // Produce an initiative roll for the Combatant
        const roll = combatant.getInitiativeRoll(formula);
        
        await roll.evaluate();

        const combatantReact = combatant.actor.system.abilities.reactions.value + 3;
        const combatantSpeed = combatant.actor.system.curSpeed.value;
        const combatantManv =  combatant.actor.system.manv.value;

        const tieBreakPR =    (0.1000000 * combatantReact);
        const tieBreakSpeed = (0.0010000 * combatantSpeed);
        const tieBreakTurn =  (0.0000100 * (combatantManv == 'H' ? 45 : 0)); //Temp fix until Maneuver values get converted to ints
        const tieBreakRand =  (0.0000001 * (Math.floor(Math.random() * 100)));

        const speedPenalty = combatantSpeed < 6 || combatantSpeed > 16 ? -1 : 0;

        const truevalue = (roll.total + tieBreakPR + tieBreakSpeed + tieBreakTurn + tieBreakRand + speedPenalty);

        updates.push({_id: id, initiative: truevalue});
    
        // Construct chat message data
        let messageData = foundry.utils.mergeObject({
            speaker: ChatMessage.getSpeaker({
            actor: combatant.actor,
            token: combatant.token,
            alias: combatant.name
            }),
            flavor: game.i18n.format("COMBAT.RollsInitiative", {name: combatant.name}),
            flags: {"core.initiativeRoll": true}
        }, messageOptions);
        const chatData = await roll.toMessage(messageData, {create: false});
    
        // If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
        chatData.rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
            : (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode );
    
        // Play 1 sound for the whole rolled set
        if ( i > 0 ) chatData.sound = null;
        messages.push(chatData);
        }
        if ( !updates.length ) return this;
    
        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);
    
        // Ensure the turn order remains with the same combatant
        if ( updateTurn && currentId ) {
        await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
        }
    
        // Create multiple chat messages
        await ChatMessage.implementation.create(messages);
        return this;
    }
}
