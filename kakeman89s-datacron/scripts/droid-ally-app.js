import { MODULE_ID } from "./logger.js";
import {
  DROID_CLASS_PRESETS,
  calculateDroidAllyPrice,
  defaultDroidAllyInput,
  formatCredits,
  normalizeDroidAllyInput
} from "./droid-ally-pricing.js";
import {
  canCalculateDroidAllyPricing,
  canQuoteDroidAllyPricing,
  droidAllyPermissionDenied
} from "./droid-ally/permissions.js";
import { buildDroidAllyQuoteHtml } from "./droid-ally/quote.js";
import { isDroidAllyPricingEnabled } from "./settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function accessOptions() {
  return { featureEnabled: isDroidAllyPricingEnabled() };
}

function localizeKey(key) {
  return game.i18n.localize(key);
}

function buildDroidClassOptions(selectedClass) {
  return DROID_CLASS_PRESETS.map((preset) => ({
    id: preset.id,
    label: localizeKey(preset.labelKey),
    selected: preset.id === selectedClass
  }));
}

function localizeDroidPricingResult(result) {
  if (!result) return null;
  const unnamed = localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.DefaultDroidName");
  return {
    droidName: result.normalizedInput.droidName || unnamed,
    droidClass: localizeKey(result.preset.labelKey),
    companionLevel: result.normalizedInput.companionLevel,
    status: result.status,
    subtotalFormatted: formatCredits(result.subtotal),
    finalCostFormatted: formatCredits(result.finalCost),
    rounding: result.rounding,
    warnings: [...(result.warnings ?? [])],
    errors: [...(result.errors ?? [])],
    explanationLines: [...(result.explanation?.lines ?? [])],
    breakdown: (result.lineItems ?? result.breakdown ?? []).map((row) => ({
      label: localizeKey(row.labelKey),
      formula: row.formula,
      amountFormatted: formatCredits(row.amount)
    }))
  };
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

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      id: `${MODULE_ID}-droid-ally`,
      tag: "section",
      classes: [MODULE_ID, "kakeman89s-datacron-app", "kakeman89s-droid-ally-app"],
      position: {
        width: 680,
        height: 560
      },
      window: {
        icon: "fa-solid fa-robot",
        title: "KAKEMAN89SDATACRON.DroidAllyPricing.Title",
        resizable: true
      }
    },
    { inplace: false }
  );

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/droid-ally-pricing.hbs`
    }
  };

  get title() {
    return localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Title");
  }

  _initializeApplicationOptions(options) {
    const opts = super._initializeApplicationOptions(options);
    opts.id = `${MODULE_ID}-droid-ally`;
    const classes = new Set(
      (opts.classes ?? []).filter((cls) => !/shipyard|astrocom/.test(String(cls)))
    );
    classes.add(MODULE_ID);
    classes.add("kakeman89s-datacron-app");
    classes.add("kakeman89s-droid-ally-app");
    opts.classes = [...classes];
    return opts;
  }

  async _prepareContext(_options) {
    const input = normalizeDroidAllyInput(this._input);

    return {
      appId: `${MODULE_ID}-droid-ally`,
      title: this.title,
      subtitle: localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Subtitle"),
      input,
      classes: buildDroidClassOptions(input.droidClass),
      result: localizeDroidPricingResult(this._result),
      error: this._error,
      calculateLabel: localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Calculate"),
      resetLabel: localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Reset"),
      quoteLabel: localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Quote")
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
  }

  _denyIfUnauthorized(predicate) {
    if (predicate(game.user, accessOptions())) return null;
    this._error = localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.PermissionDenied");
    this._result = null;
    ui.notifications?.error?.(this._error);
    return droidAllyPermissionDenied();
  }

  async _onCalculatePrice() {
    const denied = this._denyIfUnauthorized(canCalculateDroidAllyPricing);
    if (denied) {
      await this.render(true);
      return denied;
    }
    this._input = normalizeDroidAllyInput(this._input);
    this._result = calculateDroidAllyPrice(this._input);
    this._error = this._result.errors?.[0] ?? null;
    await this.render(true);
    return this._result;
  }

  async _onResetForm() {
    const denied = this._denyIfUnauthorized(canCalculateDroidAllyPricing);
    if (denied) {
      await this.render(true);
      return denied;
    }
    this._input = defaultDroidAllyInput();
    this._result = null;
    this._error = null;
    await this.render(true);
    return { ok: true, status: "reset" };
  }

  async _onQuotePrice() {
    const denied = this._denyIfUnauthorized(canQuoteDroidAllyPricing);
    if (denied) {
      await this.render(true);
      return denied;
    }
    if (!this._result) {
      ui.notifications?.warn?.(localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.QuoteNoResult"));
      return { ok: false, status: "quote-failed" };
    }

    try {
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({
          alias: localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.Title")
        }),
        content: buildDroidAllyQuoteHtml(this._result, localizeKey)
      });
      ui.notifications?.info?.(localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.QuoteSent"));
      return { ok: true, status: "quoted" };
    } catch (error) {
      ui.notifications?.error?.(localizeKey("KAKEMAN89SDATACRON.DroidAllyPricing.QuoteFailed"));
      return { ok: false, status: "quote-failed", error };
    }
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

    element.querySelector("[data-droid-ally-reset]")?.addEventListener(
      "click",
      () => {
        void this._onResetForm();
      },
      { signal }
    );

    element.querySelector("[data-droid-ally-quote]")?.addEventListener(
      "click",
      () => {
        void this._onQuotePrice();
      },
      { signal }
    );
  }
}
