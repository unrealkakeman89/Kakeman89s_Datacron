import { FLAG_SCOPE, JOURNAL_PAGE_FORMAT_HTML, PRESENCE, PRESENCE_LABEL } from "./constants.js";
import { pageDocumentId } from "./document-id.js";
import { escapeHtml } from "./html.js";
import { journalNameFor } from "./validate-source.js";

function presenceDisplay(field) {
  if (!field) return PRESENCE_LABEL.missing;
  if (field.presence !== PRESENCE.PRESENT) return PRESENCE_LABEL[field.presence] ?? PRESENCE_LABEL.missing;
  return null;
}

function definitionItem(label, value) {
  return `<div class="astrocom-field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function groupSection(title, field, extraRows = []) {
  const fallback = presenceDisplay(field);
  let body;
  if (fallback) {
    body = `<p>${escapeHtml(fallback)}</p>`;
  } else {
    const rows = extraRows
      .filter((row) => row.value != null && row.value !== "")
      .map((row) => definitionItem(row.label, row.value));
    body = rows.length ? `<dl>${rows.join("")}</dl>` : `<p>${escapeHtml(PRESENCE_LABEL.missing)}</p>`;
  }
  return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function astrographySection(record, routeNames) {
  const astro = record.astrography;
  const gridFallback = presenceDisplay(astro.grid);
  const rows = [
    definitionItem("Region", presenceDisplay(astro.region) ?? astro.region.value),
    definitionItem("Sector", presenceDisplay(astro.sector) ?? astro.sector.value),
    definitionItem("System", presenceDisplay(astro.system) ?? astro.system.value),
    definitionItem("Grid", gridFallback ?? astro.grid.value),
    definitionItem("Hyperspace routes", routeNames.length ? routeNames.join(", ") : PRESENCE_LABEL.missing)
  ];
  return `<section><h2>Astrographical Information</h2><dl>${rows.join("")}</dl></section>`;
}

function descriptionSection(record) {
  const notes = (record.eraNotes ?? [])
    .map((note) => `<li><strong>${escapeHtml(note.era)}:</strong> ${escapeHtml(note.note)}</li>`)
    .join("");
  const eraBlock = notes ? `<h3>Era notes</h3><ul>${notes}</ul>` : "";
  return `<section><h2>Description</h2><p>${escapeHtml(record.description)}</p>${eraBlock}</section>`;
}

function sourcesSection(record) {
  const links = (record.externalLinks ?? [])
    .map((link) => {
      const href = escapeHtml(link.url);
      const label = escapeHtml(link.label);
      return `<li><a href="${href}" rel="noopener noreferrer">${label}</a></li>`;
    })
    .join("");
  const metaParts = [
    record.sourceMetadata?.fixtureId,
    record.sourceMetadata?.datasetId,
    record.sourceMetadata?.reviewedBy
  ].filter(Boolean);
  const meta = metaParts.length
    ? `<p>${escapeHtml(metaParts.join(" · "))}</p>`
    : "";
  const list = links ? `<ul>${links}</ul>` : `<p>${escapeHtml(PRESENCE_LABEL.missing)}</p>`;
  return `<section><h2>Sources</h2>${meta}${list}</section>`;
}

export function renderJournalHtml(record, routeNames) {
  return [
    descriptionSection(record),
    astrographySection(record, routeNames),
    groupSection("Physical Information", record.physical, [
      { label: "Atmosphere", value: record.physical?.atmosphere },
      { label: "Climate", value: record.physical?.climate },
      { label: "Gravity", value: record.physical?.gravity }
    ]),
    groupSection("Societal Information", record.societal, [
      { label: "Population", value: record.societal?.population },
      { label: "Government", value: record.societal?.government }
    ]),
    groupSection("Planetary Economics", record.economics, [
      { label: "Exports", value: record.economics?.exports },
      { label: "Imports", value: record.economics?.imports }
    ]),
    sourcesSection(record)
  ].join("");
}

function presentOrNull(field) {
  return field?.presence === PRESENCE.PRESENT ? field.value : null;
}

export function buildFlags(record, routeIds, { fixture = true } = {}) {
  const grid = record.astrography.grid;
  return {
    [FLAG_SCOPE]: {
      schemaVersion: record.schemaVersion,
      domain: "astrocom",
      kind: "planet",
      stableId: record.stableId,
      continuity: record.continuity,
      aliases: [...(record.aliases ?? [])],
      region: presentOrNull(record.astrography.region),
      sector: presentOrNull(record.astrography.sector),
      system: presentOrNull(record.astrography.system),
      grid: grid.presence === PRESENCE.PRESENT ? grid.value : null,
      gridPresence: grid.presence,
      routes: [...routeIds],
      relatedContinuityStableId: record.relatedContinuityStableId ?? null,
      conceptualId: record.conceptualId ?? null,
      classification: record.classification,
      fixture
    }
  };
}

export function buildJournalSource(record, { _id, folder, packKey, routeNames, routeIds, uuid, fixture = true }) {
  const name = journalNameFor(record.name, record.continuity);
  const html = renderJournalHtml(record, routeNames);
  return {
    _id,
    name,
    folder,
    packKey,
    uuid,
    pages: [
      {
        _id: pageDocumentId(record.stableId),
        name,
        type: "text",
        title: { show: true, level: 1 },
        text: {
          format: JOURNAL_PAGE_FORMAT_HTML,
          content: html
        }
      }
    ],
    flags: buildFlags(record, routeIds, { fixture })
  };
}
