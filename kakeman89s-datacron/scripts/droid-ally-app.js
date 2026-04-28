import { MODULE_ID } from "./logger.js";
import {
  DROID_CLASS_PRESETS,
  calculateDroidAllyPrice,
  defaultDroidAllyInput,
  formatCredits,
  getDroidClassPreset,
  normalizeDroidAllyInput
} from "./droid-ally-pricing.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function buildDroidClassOptions(selectedClass) {
  return DROID_CLASS_PRESETS.map((preset) => ({
    id: preset.id,
    label: game.i18n.localize(preset.labelKey),
    selected: preset.id === selectedClass
  }));
}

function localizeDroidPricingResult(result) {
  if (!result) return null;
  return {
    droidName: result.input.droidName || game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.DefaultDroidName"),
    droidClass: game.i18n.localize(result.classPreset.labelKey),
    companionLevel: result.input.companionLevel,
    subtotalFormatted: formatCredits(result.subtotal),
    finalCostFormatted: formatCredits(result.finalCost),
    breakdown: result.breakdown.map((row) => ({
      label: game.i18n.localize(row.labelKey),
      formula: row.formula,
      amountFormatted: formatCredits(row.amount)
    }))
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildDroidAllyChatCard(localizedResult) {
  const title = game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.ChatTitle");
  const disclaimer = game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.ResultDisclaimer");
  const breakdownItems = localizedResult.breakdown
    .map(
      (row) =>
        `<li><span>${escapeHtml(row.label)} (${escapeHtml(row.formula)})</span>: <strong>${escapeHtml(
          row.amountFormatted
        )}</strong></li>`
    )
    .join("");

  return `
    <div class="kakeman89s-datacron-droid-quote">
      <h2>${escapeHtml(title)}</h2>
      <p><strong>${escapeHtml(localizedResult.droidName)}</strong></p>
      <p>${escapeHtml(localizedResult.droidClass)}; ${escapeHtml(
        game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.LevelLabel")
      )}: ${escapeHtml(localizedResult.companionLevel)}</p>
      <p><strong>${escapeHtml(game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.FinalCostLabel"))}:</strong> ${escapeHtml(
        localizedResult.finalCostFormatted
      )}</p>
      <ul>${breakdownItems}</ul>
      <p><em>${escapeHtml(disclaimer)}</em></p>
    </div>
  `;
}

export class DroidAllyApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {AbortController | null} */
  _abort = null;

  /** @type {ReturnType<typeof defaultDroidAllyInput>} */
  _input = defaultDroidAllyInput();

  /** @type {ReturnType<typeof calculateDroidAllyPrice> | null} */
  _result = null;

  /** @type {string | null} */
  _error = null;

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: `${MODULE_ID}-droid-ally`,
    tag: "section",
    classes: [MODULE_ID, "kakeman89s-datacron-app", "kakeman89s-droid-ally-app"],
    position: {
      width: 680,
      height: 560
    },
    window: {
      icon: "fa-solid fa-robot",
      title: "KAKEMAN89SDATACRON.DroidAlly.Title",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/droid-ally-pricing.hbs`
    }
  };

  get title() {
    return game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.Title");
  }

  async _prepareContext(_options) {
    const input = normalizeDroidAllyInput(this._input);
    const preset = getDroidClassPreset(input.droidClass);

    return {
      appId: `${MODULE_ID}-droid-ally`,
      title: this.title,
      subtitle: game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.Subtitle"),
      input,
      classes: buildDroidClassOptions(input.droidClass),
      selectedClassHelp: game.i18n.localize(preset.helpKey),
      result: localizeDroidPricingResult(this._result),
      error: this._error,
      calculateLabel: game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.Calculate"),
      shareLabel: game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.ShareToChat")
    };
  }

  _onClose(options) {
    this._abort?.abort();
    this._abort = null;
    super._onClose(options);
  }

  _syncInputFromElement(element) {
    const field = element?.dataset?.droidAllyField;
    if (!field) return;

    this._input = normalizeDroidAllyInput({
      ...this._input,
      [field]: element.value
    });

    this._result = null;
    this._error = null;
  }

  async _onCalculatePrice() {
    if (!game.user?.isGM) return;
    this._input = normalizeDroidAllyInput(this._input);
    this._result = calculateDroidAllyPrice(this._input);
    this._error = null;
    await this.render(true);
  }

  async _onSharePrice() {
    if (!game.user?.isGM) return;
    if (!this._result) {
      ui.notifications?.warn?.(game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.ChatNoResult"));
      return;
    }

    const localized = localizeDroidPricingResult(this._result);
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.Title") }),
      content: buildDroidAllyChatCard(localized)
    });
    ui.notifications?.info?.(game.i18n.localize("KAKEMAN89SDATACRON.DroidAlly.ChatPosted"));
  }

  _applyWindowContentScroll() {
    const host = this.window?.content;
    if (!host) return;
    host.style.overflowX = "hidden";
    host.style.overflowY = "auto";
    host.style.minHeight = "0";
    host.style.flex = "1 1 auto";
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._applyWindowContentScroll();

    const element = this.element;
    if (!element) return;

    this._abort?.abort();
    this._abort = new AbortController();
    const { signal } = this._abort;

    for (const field of element.querySelectorAll("[data-droid-ally-field]")) {
      field.addEventListener(
        "input",
        () => {
          this._syncInputFromElement(field);
        },
        { signal }
      );
      field.addEventListener(
        "change",
        () => {
          this._syncInputFromElement(field);
          if (field.dataset.droidAllyField === "droidClass") void this.render(true);
        },
        { signal }
      );
    }

    element.querySelector("[data-droid-ally-calculate]")?.addEventListener(
      "click",
      () => {
        void this._onCalculatePrice();
      },
      { signal }
    );

    element.querySelector("[data-droid-ally-share]")?.addEventListener(
      "click",
      () => {
        void this._onSharePrice();
      },
      { signal }
    );
  }
}
