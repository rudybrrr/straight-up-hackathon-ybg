import { getMysqlPool } from "@/lib/mysql";
import { ensureBeeperSchema } from "@/lib/beeper-schema";

export type BeeperTriagePreferences = {
  familyRedEnabled: boolean;
  businessRedEnabled: boolean;
};

const preferenceKeys = {
  familyRedEnabled: "family_red_enabled",
  businessRedEnabled: "business_red_enabled"
} as const;

const defaultPreferences: BeeperTriagePreferences = {
  familyRedEnabled: false,
  businessRedEnabled: false
};

function rowsToPreferences(rows: Array<{ preference_key: string; enabled: number | boolean }>) {
  const preferences = { ...defaultPreferences };

  for (const row of rows) {
    if (row.preference_key === preferenceKeys.familyRedEnabled) {
      preferences.familyRedEnabled = Boolean(row.enabled);
    }

    if (row.preference_key === preferenceKeys.businessRedEnabled) {
      preferences.businessRedEnabled = Boolean(row.enabled);
    }
  }

  return preferences;
}

export async function getBeeperTriagePreferences(): Promise<BeeperTriagePreferences> {
  await ensureBeeperSchema();

  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    `
      SELECT preference_key, enabled
      FROM beeper_preferences
      WHERE preference_key IN (?, ?)
    `,
    [preferenceKeys.familyRedEnabled, preferenceKeys.businessRedEnabled]
  );

  return rowsToPreferences(
    rows as Array<{ preference_key: string; enabled: number | boolean }>
  );
}

export async function updateBeeperTriagePreferences(
  preferences: Partial<BeeperTriagePreferences>
): Promise<BeeperTriagePreferences> {
  await ensureBeeperSchema();

  const current = await getBeeperTriagePreferences();
  const next: BeeperTriagePreferences = {
    familyRedEnabled: preferences.familyRedEnabled ?? current.familyRedEnabled,
    businessRedEnabled: preferences.businessRedEnabled ?? current.businessRedEnabled
  };

  const pool = getMysqlPool();
  await pool.execute(
    `
      INSERT INTO beeper_preferences (preference_key, enabled)
      VALUES (?, ?), (?, ?)
      ON DUPLICATE KEY UPDATE
        enabled = VALUES(enabled),
        updated_at = CURRENT_TIMESTAMP(3)
    `,
    [
      preferenceKeys.familyRedEnabled,
      next.familyRedEnabled,
      preferenceKeys.businessRedEnabled,
      next.businessRedEnabled
    ]
  );

  return next;
}
