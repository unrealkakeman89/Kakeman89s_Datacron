/**
 * Metadata-only performance fixture. Does not create Journal packs.
 */
export function buildMetadataIndexFixture(count = 2000) {
  const regions = ["Deep Core", "Core", "Colonies", "Inner Rim", "Expansion Region", "Mid Rim", "Outer Rim", "Wild Space", "Unknown Regions"];
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const region = regions[index % regions.length];
    entries.push({
      _id: `id${String(index).padStart(8, "0")}`,
      name: `Synthetic World ${index}`,
      uuid: `Compendium.kakeman89s-datacron.astrocom-canon.JournalEntry.id${String(index).padStart(8, "0")}`,
      flags: {
        schemaVersion: 1,
        stableId: `ac:canon:world-${index}`,
        continuity: index % 2 === 0 ? "canon" : "legends",
        aliases: [`world-${index}`, `alias-${index}`],
        region,
        regionClassifications: index % 17 === 0
          ? [{ value: region, relation: "primary" }, { value: "The Interior", relation: "subregion" }]
          : [{ value: region, relation: "primary" }],
        sector: `Sector ${index % 40}`,
        system: index % 11 === 0 ? `System ${index}` : null,
        grid: `${String.fromCharCode(65 + (index % 26))}-${(index % 16) + 1}`,
        routes: index % 5 === 0 ? [`rt:route-${index % 20}`] : [],
        classification: index % 3 === 0 ? "planet" : "moon"
      }
    });
  }
  return entries;
}
