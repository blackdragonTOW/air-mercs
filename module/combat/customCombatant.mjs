export class CustomCombatant extends Combatant {
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return false;
        this.updateSource({ name: this.actor.name });
        return allowed;
    }
}