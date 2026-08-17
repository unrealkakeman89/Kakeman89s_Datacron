/** Authored Phase 8 tables embedded for Node + Foundry ESM (no fs). */

export const sizesTable = {
  "tableId": "shipyard-sizes.v1",
  "workbookSha256": "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED",
  "sheet": "Starship Sheet",
  "validationSource": "B5 list validation",
  "privateAnalysisSource": true,
  "authoredBy": "Kakeman89",
  "options": [
    {
      "key": "tiny",
      "display": "Tiny"
    },
    {
      "key": "small",
      "display": "Small"
    },
    {
      "key": "medium",
      "display": "Medium"
    },
    {
      "key": "large",
      "display": "Large"
    },
    {
      "key": "huge",
      "display": "Huge"
    },
    {
      "key": "gargantuan",
      "display": "Gargantuan"
    }
  ]
};

export const rolesTable = {
  "tableId": "shipyard-roles.v1",
  "workbookSha256": "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED",
  "sheet": "Starship Sheet",
  "validationSource": "F9 list validation (Phase 8 subset)",
  "privateAnalysisSource": true,
  "authoredBy": "Kakeman89",
  "notes": "Phase 8 supports only roles exercised by captured vectors.",
  "options": [
    {
      "key": "superiority_fighter",
      "display": "Superiority Fighter",
      "sizeFamily": "small"
    },
    {
      "key": "freighter",
      "display": "Freighter",
      "sizeFamily": "medium"
    },
    {
      "key": "corvette",
      "display": "Corvette",
      "sizeFamily": "large"
    }
  ]
};

export const weaponsTable = {
  "tableId": "shipyard-weapons.v1",
  "workbookSha256": "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED",
  "sheet": "Starship Sheet",
  "validationSource": "H27 list validation (Phase 8 subset)",
  "privateAnalysisSource": true,
  "authoredBy": "Kakeman89",
  "options": [
    {
      "key": "none",
      "display": "Weapon Selection:",
      "grandTotalContribution": 0
    },
    {
      "key": "twin_laser_cannon",
      "display": "Twin laser cannon",
      "grandTotalContribution": 0,
      "notes": "At tier 0 Small with Installed/Unlocked, Grand Total unchanged vs bare in Phase 8 vectors."
    }
  ]
};

export const abilityAdjustmentsTable = {
  "tableId": "shipyard-ability-adjustments.v1",
  "workbookSha256": "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED",
  "sheet": "Starship Sheet",
  "workbookEvidence": "Size Adjustment / Tier 0 Role rows feeding H10:L10 totals; ROUNDDOWN mods in H11:L11",
  "privateAnalysisSource": true,
  "authoredBy": "Kakeman89",
  "adjustments": [
    {
      "size": "Small",
      "role": "Superiority Fighter",
      "deltas": {
        "str": 0,
        "dex": 3,
        "con": -2,
        "int": 0,
        "wis": 0
      }
    },
    {
      "size": "Medium",
      "role": "Freighter",
      "deltas": {
        "str": 0,
        "dex": 0,
        "con": 1,
        "int": 0,
        "wis": 0
      }
    },
    {
      "size": "Large",
      "role": "Corvette",
      "deltas": {
        "str": 1,
        "dex": -1,
        "con": 2,
        "int": 0,
        "wis": 0
      }
    }
  ]
};

export const costProfilesTable = {
  "tableId": "shipyard-cost-profiles.v1",
  "workbookSha256": "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED",
  "sheet": "Starship Sheet / Example X-wing",
  "privateAnalysisSource": true,
  "authoredBy": "Kakeman89",
  "notes": "Phase 8 cost profiles are authored from evaluated Excel vectors. They are not a full workbook formula dump.",
  "profiles": [
    {
      "id": "v1-example-xwing",
      "match": {
        "size": "Small",
        "tier": 2,
        "role": "Superiority Fighter",
        "primaryWeapon": "Twin laser cannon",
        "installState": "Installed",
        "lockState": "Unlocked",
        "armor": "Deflection armor"
      },
      "result": {
        "grandTotal": 212600,
        "totalNoMisc": 209800,
        "miscTotal": 2800,
        "buildDays": 41.96,
        "buildDaysDisplay": "42d",
        "pointBuyTotal": 27,
        "hullPoints": 32,
        "shieldPoints": 37,
        "suiteSlots": 1,
        "openSuites": 1,
        "abilityTotals": {
          "str": 16,
          "dex": 16,
          "con": 14,
          "int": 10,
          "wis": 14
        },
        "abilityModifiers": {
          "str": 3,
          "dex": 3,
          "con": 2,
          "int": 0,
          "wis": 2
        }
      }
    },
    {
      "id": "v2-small-bare",
      "match": {
        "size": "Small",
        "tier": 0,
        "role": "Superiority Fighter",
        "primaryWeapon": "Weapon Selection:",
        "installState": "Not Installed",
        "lockState": "None"
      },
      "result": {
        "grandTotal": 32000,
        "totalNoMisc": 32000,
        "miscTotal": 0,
        "buildDays": 6.4,
        "buildDaysDisplay": "6d",
        "pointBuyTotal": 12,
        "hullPoints": 11,
        "shieldPoints": 21,
        "suiteSlots": 0,
        "openSuites": 0,
        "weaponContribution": 0,
        "abilityTotals": {
          "str": 10,
          "dex": 13,
          "con": 8,
          "int": 10,
          "wis": 10
        },
        "abilityModifiers": {
          "str": 0,
          "dex": 1,
          "con": -1,
          "int": 0,
          "wis": 0
        }
      }
    },
    {
      "id": "v3-small-armed",
      "match": {
        "size": "Small",
        "tier": 0,
        "role": "Superiority Fighter",
        "primaryWeapon": "Twin laser cannon",
        "installState": "Installed",
        "lockState": "Unlocked"
      },
      "result": {
        "grandTotal": 32000,
        "totalNoMisc": 32000,
        "miscTotal": 0,
        "buildDays": 6.4,
        "buildDaysDisplay": "6d",
        "pointBuyTotal": 12,
        "hullPoints": 11,
        "shieldPoints": 21,
        "suiteSlots": 0,
        "openSuites": 0,
        "weaponContribution": 0,
        "abilityTotals": {
          "str": 10,
          "dex": 13,
          "con": 8,
          "int": 10,
          "wis": 10
        },
        "abilityModifiers": {
          "str": 0,
          "dex": 1,
          "con": -1,
          "int": 0,
          "wis": 0
        }
      }
    },
    {
      "id": "v4-medium-suites",
      "match": {
        "size": "Medium",
        "tier": 0,
        "role": "Freighter",
        "quartersLiving": 1
      },
      "result": {
        "grandTotal": 89000,
        "totalNoMisc": 89000,
        "miscTotal": 0,
        "buildDays": 17.8,
        "buildDaysDisplay": "18d",
        "pointBuyTotal": 12,
        "hullPoints": 28,
        "shieldPoints": 42,
        "suiteSlots": 3,
        "openSuites": 3,
        "suiteContribution": 0,
        "abilityTotals": {
          "str": 10,
          "dex": 10,
          "con": 11,
          "int": 10,
          "wis": 10
        },
        "abilityModifiers": {
          "str": 0,
          "dex": 0,
          "con": 0,
          "int": 0,
          "wis": 0
        }
      }
    },
    {
      "id": "v5-large-tier",
      "match": {
        "size": "Large",
        "tier": 3,
        "role": "Corvette"
      },
      "result": {
        "grandTotal": 4319000,
        "totalNoMisc": 4319000,
        "miscTotal": 0,
        "buildDays": 863.8,
        "buildDaysDisplay": "864d",
        "pointBuyTotal": 19,
        "hullPoints": 74,
        "shieldPoints": 141,
        "suiteSlots": 5,
        "openSuites": 5,
        "abilityTotals": {
          "str": 16,
          "dex": 9,
          "con": 12,
          "int": 10,
          "wis": 10
        },
        "abilityModifiers": {
          "str": 3,
          "dex": -1,
          "con": 1,
          "int": 0,
          "wis": 0
        }
      }
    }
  ]
};
