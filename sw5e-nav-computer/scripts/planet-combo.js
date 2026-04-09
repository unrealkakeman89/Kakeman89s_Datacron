/**
 * Searchable planet combobox: input filter + dropdown list.
 * Uses AbortSignal so listeners are removed on each app rerender.
 */

const ROLES = ["origin", "destination"];

function normalizeQuery(value) {
  return String(value ?? "").trim().toLowerCase();
}

function closePanel(panel, input) {
  panel.classList.remove("is-open");
  panel.setAttribute("hidden", "");
  if (input) input.setAttribute("aria-expanded", "false");
}

function openPanel(panel, input) {
  panel.classList.add("is-open");
  panel.removeAttribute("hidden");
  if (input) input.setAttribute("aria-expanded", "true");
}

function applyFilter(listRoot, query) {
  const items = listRoot.querySelectorAll("[data-nav-combo-item]");
  const emptyRow = listRoot.querySelector("[data-nav-combo-empty]");
  const q = normalizeQuery(query);
  let visibleCount = 0;

  for (const li of items) {
    const name = li.dataset.value ?? "";
    const show = !q || name.toLowerCase().includes(q);
    li.hidden = !show;
    if (show) visibleCount += 1;
  }

  if (emptyRow) emptyRow.hidden = visibleCount > 0;
}

/**
 * @param {HTMLElement} root
 * @param {object} options
 * @param {object[]} options.planets
 * @param {(role: 'origin'|'destination') => string} options.getSelected
 * @param {(role: 'origin'|'destination', value: string) => void} options.onChange
 * @param {string} options.searchPlaceholder
 * @param {boolean} options.disabled
 * @param {AbortSignal} options.signal
 */
export function attachPlanetCombos(root, options) {
  const { planets, getSelected, onChange, searchPlaceholder, disabled, signal } = options;

  const closeAll = () => {
    for (const role of ROLES) {
      const combo = root.querySelector(`[data-nav-combo="${role}"]`);
      if (!combo) continue;
      const input = combo.querySelector("[data-nav-combo-input]");
      const panel = combo.querySelector("[data-nav-combo-panel]");
      closePanel(panel, input);
    }
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!root.contains(event.target)) closeAll();
    },
    { capture: true, signal }
  );

  for (const role of ROLES) {
    const combo = root.querySelector(`[data-nav-combo="${role}"]`);
    if (!combo) continue;

    const input = combo.querySelector("[data-nav-combo-input]");
    const panel = combo.querySelector("[data-nav-combo-panel]");
    const list = combo.querySelector("[data-nav-combo-list]");
    if (!input || !panel || !list) continue;

    if (disabled || !planets?.length) {
      input.disabled = true;
      closePanel(panel, input);
      continue;
    }

    input.disabled = false;
    input.placeholder = searchPlaceholder;
    input.value = getSelected(role);
    input.setAttribute("aria-expanded", "false");

    let blurTimer = null;

    const scheduleClose = () => {
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (!combo.contains(document.activeElement)) {
          input.value = getSelected(role) ?? "";
          applyFilter(list, input.value);
          closePanel(panel, input);
        }
      }, 200);
    };

    const selectValue = (name) => {
      input.value = name;
      onChange(role, name);
      closePanel(panel, input);
    };

    applyFilter(list, input.value);

    input.addEventListener(
      "focus",
      () => {
        window.clearTimeout(blurTimer);
        openPanel(panel, input);
        applyFilter(list, input.value);
      },
      { signal }
    );

    input.addEventListener(
      "pointerdown",
      () => {
        window.clearTimeout(blurTimer);
        openPanel(panel, input);
        applyFilter(list, input.value);
      },
      { signal }
    );

    input.addEventListener(
      "input",
      () => {
        openPanel(panel, input);
        applyFilter(list, input.value);
      },
      { signal }
    );

    input.addEventListener("blur", scheduleClose, { signal });

    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          input.value = getSelected(role) ?? "";
          applyFilter(list, input.value);
          closePanel(panel, input);
        }
      },
      { signal }
    );

    list.addEventListener(
      "pointerdown",
      (event) => {
        event.preventDefault();
      },
      { signal }
    );

    list.addEventListener(
      "click",
      (event) => {
        const item = event.target.closest("[data-nav-combo-item]");
        if (!item || item.hidden) return;
        const name = item.dataset.value ?? "";
        selectValue(name);
      },
      { signal }
    );
  }
}
