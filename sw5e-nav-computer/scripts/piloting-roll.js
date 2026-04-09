import { logError } from "./logger.js";

const ROLL_FLAVOR = "Hyperspace Navigation Piloting Check";

function getPrivateRollMode() {
  return CONST?.DICE_ROLL_MODES?.PRIVATE ?? "gmroll";
}

/**
 * @param {Actor} actor
 * @param {string} flavor
 * @param {string} rollMode
 */
function buildMessageOptions(actor, flavor, rollMode) {
  const speaker =
    typeof ChatMessage?.getSpeaker === "function"
      ? ChatMessage.getSpeaker({ actor })
      : { actor: actor.uuid };
  return {
    create: true,
    rollMode,
    data: { flavor, speaker }
  };
}

/**
 * Posts a normal dnd5e/SW5E skill check to chat as a private GM roll (players do not see the card).
 * Tries fast-forward / no-dialog roll shapes first so the Nav Computer window is not displaced by a roll prompt.
 * @param {Actor} actor
 * @param {string} skillKey
 * @returns {Promise<boolean>} true if rollSkill completed without throwing
 */
export async function performPilotingSkillRoll(actor, skillKey) {
  const flavor = ROLL_FLAVOR;
  const rollMode = getPrivateRollMode();

  if (typeof actor.rollSkill !== "function") {
    logError("Actor.rollSkill is not available; cannot roll piloting check.");
    return false;
  }

  const messageOpts = buildMessageOptions(actor, flavor, rollMode);

  /** @type {Array<() => Promise<unknown>>} */
  const attempts = [
    () => actor.rollSkill(skillKey, { flavor, rollMode, fastForward: true }),
    () => actor.rollSkill(skillKey, { flavor, rollMode }),
    () => actor.rollSkill({ skill: skillKey }, { configure: false }, messageOpts),
    () => actor.rollSkill({ skill: skillKey, flavor, rollMode, fastForward: true }),
    () => actor.rollSkill({ skill: skillKey, flavor, rollMode })
  ];

  let lastError = null;
  for (const run of attempts) {
    try {
      const result = await run();
      if (result === null || result === false) return false;
      return true;
    } catch (err) {
      lastError = err;
    }
  }

  logError("rollSkill failed for piloting check.", lastError);
  return false;
}
