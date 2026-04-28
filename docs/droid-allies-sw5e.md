# Droid Allies in SW5E

This is an optional table aid for pricing and running droid allies in **Star Wars 5e**. It adapts the spirit of the Saga Edition "Droid Allies" and protocol-format rules to SW5E companion language. It does not replace the SW5E Expanded Content companion rules.

## Baseline

Use the SW5E companion rules as the primary rules source when a droid is meant to function as a real companion:

- A character normally has no more than one active companion.
- A companion's level normally matches its owner's level.
- Companions are a meaningful power increase and should be considered roughly half a character for encounter and XP planning.
- A companion can act more fully when directed by its owner; otherwise its combat options are limited.
- Droid companions use SW5E droid assumptions: type Droid, droid resistances and ion vulnerability, maintenance mode instead of sleep, armor integration, and force insensitivity.

For a simple purchased helper, the GM can instead treat the droid as equipment-like support: it has a limited list of protocols and does not receive the full flexibility of a leveled companion unless the GM explicitly allows it.

## Droid Roles

Use Droid Class as the SW5E-facing chassis and role category:

- **Class I:** medical, biological, physical science, and mathematics droids.
- **Class II:** astromech, exploration, environmental, engineering, and maintenance droids.
- **Class III:** protocol, service, tutor, and social droids.
- **Class IV:** battle, assassin, gladiator, and security droids.
- **Class V:** labor, mining, construction, sanitation, and transport droids.
- **Tracker Droid:** use the SW5E tracker droid companion rules when the droid is a purpose-built scouting or pursuit companion.

## Protocol-Style Use

For a droid ally that is not being run as a full companion, give it up to five protocols. Each protocol should describe something the droid is expected to do often enough that it matters at the table.

Suggested protocols:

- **Move:** the droid moves up to its speed.
- **Help:** the droid takes the Help action for an attack, ability check, or tool check it can plausibly assist.
- **Skill or Tool Task:** the droid makes a relevant SW5E skill or tool check.
- **Attack:** the droid makes one attack if it has suitable integrated or carried equipment.
- **Special Protocol:** a named SW5E droid trait, installed system, or utility action such as translation, medical support, slicing support, repair work, scanning, or hauling.

As a default, a player should spend a **bonus action** to direct a simplified droid ally. The GM may require an action for complex work, repeated attacks, or anything that would overshadow a player character. If the droid is a full SW5E companion, use the normal companion action rules instead.

## Pricing Conversion

The Datacron calculator uses a transparent estimate inspired by the Saga Edition alternate pricing system, translated into SW5E-facing terms. The GM chooses a Droid Class, and the calculator uses that class internally as the base chassis value.

```text
baseChassisCost = class-based chassis value
systemsCost = GM-entered systems, equipment, and factory package value
abilityCost = max(0, totalAbilityModifier) * 1000
traitProtocolCost = droidTraitOrProtocolCount * 2000
proficiencyCost = trainedSkillOrToolCount * 500
featOrUpgradeCost = featOrUpgradeCount * 1000
levelCost = companionLevelOrCROverride * 1000
finalCost = floor(total / 2)
```

Estimator field guidance:

- **Droid name:** optional display name or model designation for the quote.
- **Droid class:** closest SW5E droid role or chassis category.
- **Companion Level / CR Override:** use companion level for a real companion; use a CR-style value only for helper NPC pricing.
- **Systems / factory cost:** installed systems, gear, weapons, tools, armor, or factory package value in credits.
- **Total ability modifiers:** sum the droid's final ability modifiers; negative totals are allowed but do not reduce price below the other components.
- **Droid traits / protocols:** count notable traits, protocols, special actions, or built-in features that matter in play.
- **Trained skills / tools:** count trained skill and tool proficiencies the droid can meaningfully use.
- **Feats / upgrades:** count feats, major upgrades, premium modifications, or equivalent enhancements.

Use **companion level** for normal SW5E companions because their level tracks their owner. Use a CR-style override only when pricing an NPC droid that is not being adopted as a companion.

The final price is always subject to GM approval, market availability, era, condition, legality, black-market risk, repairs, and whether the droid's memory or personality is valuable.

## Purchase Does Not Grant Permission

Buying a droid does not automatically grant a legal SW5E companion. The GM decides whether the droid is:

- background equipment,
- a limited protocol helper,
- a hireling-style NPC,
- or a full SW5E companion subject to prerequisites, one-companion limits, companion level, and encounter-balance guidance.
