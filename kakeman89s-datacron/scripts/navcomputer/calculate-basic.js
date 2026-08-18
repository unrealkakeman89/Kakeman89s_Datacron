import { calculateRouteBasic } from "../route-calculator.js";
import { formatTravelTime } from "../time-display.js";
import { readStarshipTravelAdapter } from "../actor-helpers.js";
import {
  RESOURCE_PROFILE_EXISTING_UNVERIFIED,
  applyResourceProfile
} from "./resource-profile.js";
import { getCachedRegionMatrix } from "./region-matrix.js";

function buildExplanation(route, adapter, resources) {
  const lines = [];
  const originName = route.originPlanet?.name ?? "(missing)";
  const destName = route.destinationPlanet?.name ?? "(missing)";
  lines.push(`Origin: ${originName}`);
  lines.push(`Destination: ${destName}`);
  lines.push(`Raw origin region: ${route.rawOriginRegion ?? "(none)"}`);
  lines.push(`Raw destination region: ${route.rawDestinationRegion ?? "(none)"}`);
  lines.push(`Lookup origin region: ${route.originLookupRegion ?? "(none)"}`);
  lines.push(`Lookup destination region: ${route.destinationLookupRegion ?? "(none)"}`);
  if (route.normalizationApplied) {
    if (route.rawOriginRegion !== route.originLookupRegion) {
      lines.push(`Region correction: ${route.rawOriginRegion} → ${route.originLookupRegion}`);
    }
    if (route.rawDestinationRegion !== route.destinationLookupRegion) {
      lines.push(
        `Region correction: ${route.rawDestinationRegion} → ${route.destinationLookupRegion}`
      );
    }
  }
  lines.push(`Matrix profile: ${route.matrixProfileId}`);
  lines.push(`Matrix authority: ${route.matrixAuthority} (not a verified rules source)`);
  if (route.status === "ok") {
    lines.push(`Matrix row: ${route.originLookupRegion}`);
    lines.push(`Matrix column: ${route.destinationLookupRegion}`);
    lines.push(`Matrix cell: ${route.matrixHours} hours`);
    lines.push(`Direction: ${route.originLookupRegion} → ${route.destinationLookupRegion}`);
  } else if (route.status === "same-world") {
    lines.push("Same-world result: 0 hours; no hyperspace travel required.");
  } else if (route.status === "unsupported") {
    lines.push("Unsupported result: no matrix route is available for these regions.");
    lines.push("Hours sentinel: 0. This is not a completed journey.");
  } else {
    lines.push("Invalid result: origin or destination is missing.");
  }
  lines.push(
    `Hyperdrive: ${adapter.hyperdrive == null ? "unresolved" : adapter.hyperdrive} (${adapter.hyperdriveSource})`
  );
  lines.push("Basic ignored hyperdrive; hours were not multiplied.");
  lines.push(`Resource profile: ${RESOURCE_PROFILE_EXISTING_UNVERIFIED.id}`);
  lines.push(`Crew: ${adapter.crew} (${adapter.crewSource})`);
  if (adapter.crewSource === "profile-default") {
    lines.push("Crew fallback warning: ship crew could not be resolved; profile default 4 was used.");
  }
  if (resources.resourcesApplied) {
    lines.push(
      `Fuel: ceil(${route.travelTimeHours} × ${resources.fuelRate}) = ${resources.fuelRequired} ${resources.fuelUnit}`
    );
    lines.push(
      `Food: ceil((${route.travelTimeHours} / 24) × ${adapter.crew} × ${resources.foodRate}) = ${resources.foodRequired} ${resources.foodUnit}`
    );
    lines.push(
      `Supplies: ceil(${resources.foodRequired} × 0.5) = ${resources.suppliesRequired} ${resources.suppliesUnit}`
    );
    lines.push("Rounding: ceil on fuel, food, and supplies.");
    lines.push(`Travel-days display rounding: ${resources.travelDaysDisplay} days.`);
    if (resources.fuelRateCustomized || resources.foodRateCustomized) {
      lines.push("Configured world rates differ from profile defaults (customized house-rule rates).");
    }
  } else {
    lines.push("Resources were not applied because no valid matrix route was produced.");
  }
  lines.push(`Final status: ${route.status}`);
  return {
    profileId: RESOURCE_PROFILE_EXISTING_UNVERIFIED.id,
    matrixProfileId: route.matrixProfileId,
    lines
  };
}

/**
 * Pure Basic NavComputer calculation. Pass rates from world settings at the app boundary.
 * @param {{ originPlanet: object, destinationPlanet: object, shipActor?: object | null, fuelRate?: number, foodRate?: number, matrixDoc?: object }} input
 */
export function calculateNavComputerBasic(input) {
  const matrixDoc = input?.matrixDoc ?? getCachedRegionMatrix();
  const adapter = readStarshipTravelAdapter(input?.shipActor);
  const route = calculateRouteBasic(input?.originPlanet, input?.destinationPlanet, matrixDoc);
  const resourcesApplied = route.status === "ok" || route.status === "same-world";
  const resourceResult = resourcesApplied
    ? applyResourceProfile({
        hours: route.travelTimeHours,
        crewSize: adapter.crew,
        fuelRate: input?.fuelRate,
        foodRate: input?.foodRate
      })
    : {
        fuelRequired: null,
        foodRequired: null,
        suppliesRequired: null,
        travelDays: null,
        travelDaysDisplay: null,
        fuelRate: input?.fuelRate,
        foodRate: input?.foodRate,
        fuelRateCustomized: false,
        foodRateCustomized: false,
        fuelUnit: RESOURCE_PROFILE_EXISTING_UNVERIFIED.fuelUnit,
        foodUnit: RESOURCE_PROFILE_EXISTING_UNVERIFIED.foodUnit,
        suppliesUnit: RESOURCE_PROFILE_EXISTING_UNVERIFIED.suppliesUnit,
        warnings: []
      };

  const travelResources = resourcesApplied
    ? {
        travelTimeHours: route.travelTimeHours,
        travelTimeFormatted: formatTravelTime(route.travelTimeHours),
        travelDays: resourceResult.travelDays,
        crewSize: adapter.crew,
        fuelRequired: resourceResult.fuelRequired,
        foodRequired: resourceResult.foodRequired,
        suppliesRequired: resourceResult.suppliesRequired,
        fuelUnit: resourceResult.fuelUnit,
        foodUnit: resourceResult.foodUnit,
        travelDaysDisplay: resourceResult.travelDaysDisplay,
        resourceProfileId: RESOURCE_PROFILE_EXISTING_UNVERIFIED.id,
        resourceProfileName: RESOURCE_PROFILE_EXISTING_UNVERIFIED.displayName
      }
    : null;

  const explanation = buildExplanation(route, adapter, {
    ...resourceResult,
    resourcesApplied
  });

  return {
    ...route,
    completedJourney: resourcesApplied,
    resourcesApplied,
    resourceProfileId: RESOURCE_PROFILE_EXISTING_UNVERIFIED.id,
    crewSize: adapter.crew,
    crewSource: adapter.crewSource,
    hyperdrive: adapter.hyperdrive,
    hyperdriveSource: adapter.hyperdriveSource,
    hyperdriveApplied: false,
    fuelRate: resourceResult.fuelRate,
    foodRate: resourceResult.foodRate,
    fuelRequired: resourceResult.fuelRequired,
    foodRequired: resourceResult.foodRequired,
    suppliesRequired: resourceResult.suppliesRequired,
    travelDays: resourceResult.travelDays,
    travelDaysDisplay: resourceResult.travelDaysDisplay,
    travelResources,
    explanation,
    warnings: [...(route.warnings ?? []), ...(adapter.warnings ?? []), ...(resourceResult.warnings ?? [])]
  };
}
