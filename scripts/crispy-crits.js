class CrispyCrits {
  static ID = "crispy-crits";

  static FLAGS = {};

  static SETTINGS = {
    USE_CRISPY_CRITS: "use-crispy-crits",
  };

  static CONSTANTS = {};

  static log(...args) {
    console.log(this.ID, "|", ...args);
  }

  static initialize() {
    game.settings.register(this.ID, this.SETTINGS.USE_CRISPY_CRITS, {
      name: `CRISPY-CRITS.settings.${this.SETTINGS.USE_CRISPY_CRITS}.Name`,
      default: false,
      type: Boolean,
      scope: 'world',
      config: true,
      hint: `CRISPY-CRITS.settings.${this.SETTINGS.USE_CRISPY_CRITS}.Hint`
    });
  }

  static isEnabled() {
    return game.settings.get(CrispyCrits.ID, CrispyCrits.SETTINGS.USE_CRISPY_CRITS);
  }
}

Hooks.once('init', () => {
  CrispyCrits.initialize();
});

Hooks.on('dnd5e.preRollDamageV2', (attack) => {
  if (!CrispyCrits.isEnabled()) return;

  // override dnd5e's critical options
  attack.critical.multiplyNumeric = false;
  attack.critical.powerfulCritical = false;
})

Hooks.on("dnd5e.postDamageRollConfiguration", async (damageRolls) => {
  if (!CrispyCrits.isEnabled()) return;

  for (const roll of damageRolls) {
    if (!roll.options.isCritical) continue;

    const damageType = roll.options.type;
    const damagePart = roll.data.activity.damage.parts.find(part => part.types.has(damageType));

    const rollNumber = damagePart.number;
    const rollDenomination = damagePart.denomination;

    // override the default critical behavior by replacing the dice roll with a non-multiplied roll
    roll.terms[0] = await new Die({ faces: rollDenomination, number: rollNumber }).evaluate();

    // add the max of the single damage die
    const operatorTerm = new OperatorTerm();
    operatorTerm.operator = '+';
    roll.terms.push(operatorTerm);

    const numericTerm = new NumericTerm();
    numericTerm.number = rollDenomination;
    roll.terms.push(numericTerm);
  }
});