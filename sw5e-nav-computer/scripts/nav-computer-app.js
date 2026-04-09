import { MODULE_ID } from "./logger.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NavComputerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: MODULE_ID,
    tag: "section",
    classes: [MODULE_ID, "sw5e-nav-computer-app"],
    position: {
      width: 720,
      height: 540
    },
    window: {
      icon: "fa-solid fa-route",
      title: "SW5ENAVCOMPUTER.App.Title",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/nav-computer.hbs`
    }
  };

  get title() {
    return game.i18n.localize("SW5ENAVCOMPUTER.App.Title");
  }

  async _prepareContext(_options) {
    return {
      appId: MODULE_ID,
      title: this.title,
      subtitle: game.i18n.localize("SW5ENAVCOMPUTER.App.Subtitle"),
      placeholderText: game.i18n.localize("SW5ENAVCOMPUTER.App.Placeholder"),
      statusText: game.i18n.localize("SW5ENAVCOMPUTER.App.StatusPlaceholder")
    };
  }
}
