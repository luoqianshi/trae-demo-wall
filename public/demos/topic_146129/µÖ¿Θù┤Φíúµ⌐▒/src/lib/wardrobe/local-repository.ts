import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type {
  BehaviorEvent,
  DailyRecommendation,
  OutfitRecommendation,
  RecognitionRun,
  WardrobeItem,
  WardrobeItemAttributes,
  WardrobeFieldConfidence,
  WardrobeItemUsageStat
} from "@/types/wardrobe";

type SqliteDatabase = ReturnType<typeof Database>;

type CreateWardrobeItemInput = {
  imagePath: string;
  originalFilename?: string;
  sourceType?: WardrobeItem["sourceType"];
  productUrl?: string;
  productDetailText?: string;
  recognitionSource?: string;
  fieldConfidence?: WardrobeFieldConfidence;
};

type CreateOutfitRecommendationInput = {
  title: string;
  scenario?: OutfitRecommendation["scenario"];
  reason: string;
  itemIds: string[];
  weatherSnapshot?: Record<string, unknown>;
  inputSnapshot?: Record<string, unknown>;
  dailyRecommendationId?: string;
};

type BehaviorInput = {
  recommendationId: string;
  eventDate: string;
  weatherSnapshot?: Record<string, unknown>;
  inputSnapshot?: Record<string, unknown>;
  aiReason?: string;
};

type LikeInput = BehaviorInput & {
  liked: boolean;
};

type SaveRecognitionDraftInput = {
  itemId: string;
  provider: string;
  model?: string;
  rawResult?: Record<string, unknown>;
  attributes: WardrobeItemAttributes;
};

type SaveRecognitionFailureInput = {
  itemId: string;
  provider: string;
  model?: string;
  rawResult?: Record<string, unknown>;
  errorMessage: string;
};

export type WardrobeRepository = {
  createWardrobeItem(input: CreateWardrobeItemInput): WardrobeItem;
  confirmWardrobeItem(id: string, attributes: WardrobeItemAttributes): WardrobeItem;
  saveRecognitionDraft(input: SaveRecognitionDraftInput): RecognitionRun;
  saveRecognitionFailure(input: SaveRecognitionFailureInput): RecognitionRun;
  listRecognitionRuns(itemId: string): RecognitionRun[];
  listDraftWardrobeItems(): WardrobeItem[];
  listConfirmedWardrobeItems(): WardrobeItem[];
  createOutfitRecommendation(input: CreateOutfitRecommendationInput): OutfitRecommendation;
  getOutfitRecommendation(id: string): OutfitRecommendation | undefined;
  listOutfitRecommendations(): OutfitRecommendation[];
  ensureDailyRecommendationForDate(recommendationDate: string): DailyRecommendation;
  getDailyRecommendationForDate(recommendationDate: string): DailyRecommendation | undefined;
  attachRecommendationToDaily(dailyRecommendationId: string, recommendationId: string): DailyRecommendation;
  getWardrobeItemUsageStats(): WardrobeItemUsageStat[];
  recordLike(input: LikeInput): BehaviorEvent;
  recordWearToday(input: BehaviorInput): BehaviorEvent;
  recordChangeOutfit(input: BehaviorInput): BehaviorEvent;
  recordAutoReplaceItem(input: BehaviorInput): BehaviorEvent;
  recordManualReplaceItem(input: BehaviorInput): BehaviorEvent;
  listBehaviorEvents(): BehaviorEvent[];
};

type WardrobeItemRow = {
  id: string;
  image_path: string;
  original_filename: string | null;
  source_type: WardrobeItem["sourceType"] | null;
  product_url: string | null;
  product_detail_text: string | null;
  recognition_source: string | null;
  field_confidence_json: string | null;
  status: WardrobeItem["status"];
  recognition_status: WardrobeItem["recognitionStatus"];
  category: WardrobeItem["category"] | null;
  primary_color: string | null;
  secondary_color: string | null;
  material: string | null;
  seasons_json: string;
  scenarios_json: string;
  formality: WardrobeItem["formality"] | null;
  styles_json: string;
  warmth: WardrobeItem["warmth"] | null;
  created_at: string;
  updated_at: string;
};

type RecommendationRow = {
  id: string;
  title: string;
  scenario: OutfitRecommendation["scenario"] | null;
  reason: string;
  weather_snapshot_json: string | null;
  input_snapshot_json: string | null;
  daily_recommendation_id: string | null;
  is_liked: 0 | 1;
  created_at: string;
};

type BehaviorEventRow = {
  id: string;
  event_type: BehaviorEvent["eventType"];
  recommendation_id: string;
  item_ids_json: string;
  weather_snapshot_json: string | null;
  input_snapshot_json: string | null;
  ai_reason: string | null;
  is_liked: 0 | 1;
  is_worn: 0 | 1;
  is_skipped: 0 | 1;
  event_date: string;
  created_at: string;
};

type UsageStatRow = {
  item_id: string;
  referenced_outfit_count: number;
  liked_outfit_count: number;
  worn_count: number;
  last_referenced_at: string | null;
};

type DailyRecommendationRow = {
  id: string;
  recommendation_date: string;
  recommendation_id: string | null;
  created_at: string;
};

type RecognitionRunRow = {
  id: string;
  item_id: string;
  provider: string;
  model: string | null;
  raw_result_json: string | null;
  confirmed_fields_json: string | null;
  recognition_status: RecognitionRun["recognitionStatus"];
  error_message: string | null;
  created_at: string;
};

const nowIso = () => new Date().toISOString();

const stringifyJson = (value: Record<string, unknown> | undefined) =>
  value ? JSON.stringify(value) : null;

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value) as T;
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const hasColumn = (db: SqliteDatabase, tableName: string, columnName: string) =>
  (db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>).some((column) => column.name === columnName);

const ensureColumn = (db: SqliteDatabase, tableName: string, columnName: string, definition: string) => {
  if (!hasColumn(db, tableName, columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
};

const initializeSchema = (db: SqliteDatabase) => {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS wardrobe_items (
      id TEXT PRIMARY KEY,
      image_path TEXT NOT NULL,
      original_filename TEXT,
      source_type TEXT NOT NULL DEFAULT 'photo',
      product_url TEXT,
      product_detail_text TEXT,
      recognition_source TEXT,
      field_confidence_json TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      recognition_status TEXT NOT NULL DEFAULT 'pending',
      category TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      material TEXT,
      seasons_json TEXT NOT NULL DEFAULT '[]',
      scenarios_json TEXT NOT NULL DEFAULT '[]',
      formality TEXT,
      styles_json TEXT NOT NULL DEFAULT '[]',
      warmth TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outfit_recommendations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scenario TEXT,
      reason TEXT NOT NULL,
      weather_snapshot_json TEXT,
      input_snapshot_json TEXT,
      daily_recommendation_id TEXT,
      is_liked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outfit_recommendation_items (
      recommendation_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (recommendation_id, item_id),
      FOREIGN KEY (recommendation_id) REFERENCES outfit_recommendations(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS behavior_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      recommendation_id TEXT NOT NULL,
      item_ids_json TEXT NOT NULL,
      weather_snapshot_json TEXT,
      input_snapshot_json TEXT,
      ai_reason TEXT,
      is_liked INTEGER NOT NULL DEFAULT 0,
      is_worn INTEGER NOT NULL DEFAULT 0,
      is_skipped INTEGER NOT NULL DEFAULT 0,
      event_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (recommendation_id) REFERENCES outfit_recommendations(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS behavior_events_unique_daily_wear
      ON behavior_events(recommendation_id, event_date)
      WHERE event_type = 'wear_today';

    CREATE TABLE IF NOT EXISTS recognition_runs (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT,
      raw_result_json TEXT,
      confirmed_fields_json TEXT,
      recognition_status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_recommendations (
      id TEXT PRIMARY KEY,
      recommendation_date TEXT NOT NULL UNIQUE,
      recommendation_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (recommendation_id) REFERENCES outfit_recommendations(id) ON DELETE SET NULL
    );
  `);

  ensureColumn(db, "outfit_recommendations", "daily_recommendation_id", "TEXT");
  ensureColumn(db, "wardrobe_items", "source_type", "TEXT NOT NULL DEFAULT 'photo'");
  ensureColumn(db, "wardrobe_items", "product_url", "TEXT");
  ensureColumn(db, "wardrobe_items", "product_detail_text", "TEXT");
  ensureColumn(db, "wardrobe_items", "recognition_source", "TEXT");
  ensureColumn(db, "wardrobe_items", "field_confidence_json", "TEXT");
};

const mapWardrobeItem = (row: WardrobeItemRow): WardrobeItem => ({
  id: row.id,
  imagePath: row.image_path,
  originalFilename: row.original_filename ?? undefined,
  sourceType: row.source_type ?? "photo",
  productUrl: row.product_url ?? undefined,
  productDetailText: row.product_detail_text ?? undefined,
  recognitionSource: row.recognition_source ?? undefined,
  fieldConfidence: parseJson(row.field_confidence_json, undefined),
  status: row.status,
  recognitionStatus: row.recognition_status,
  category: row.category ?? undefined,
  primaryColor: row.primary_color ?? undefined,
  secondaryColor: row.secondary_color ?? undefined,
  material: row.material ?? undefined,
  seasons: parseJson(row.seasons_json, []),
  scenarios: parseJson(row.scenarios_json, []),
  formality: row.formality ?? undefined,
  styles: parseJson(row.styles_json, []),
  warmth: row.warmth ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const getRecommendationItemIds = (db: SqliteDatabase, recommendationId: string) =>
  db
    .prepare(
      `
      SELECT item_id
      FROM outfit_recommendation_items
      WHERE recommendation_id = ?
      ORDER BY position ASC
    `
    )
    .all(recommendationId)
    .map((row) => (row as { item_id: string }).item_id);

const mapRecommendation = (db: SqliteDatabase, row: RecommendationRow): OutfitRecommendation => ({
  id: row.id,
  title: row.title,
  scenario: row.scenario ?? undefined,
  reason: row.reason,
  weatherSnapshot: parseJson(row.weather_snapshot_json, undefined),
  inputSnapshot: parseJson(row.input_snapshot_json, undefined),
  dailyRecommendationId: row.daily_recommendation_id ?? undefined,
  isLiked: row.is_liked === 1,
  itemIds: getRecommendationItemIds(db, row.id),
  createdAt: row.created_at
});

const mapDailyRecommendation = (row: DailyRecommendationRow): DailyRecommendation => ({
  id: row.id,
  recommendationDate: row.recommendation_date,
  recommendationId: row.recommendation_id ?? undefined,
  createdAt: row.created_at
});

const mapBehaviorEvent = (row: BehaviorEventRow): BehaviorEvent => ({
  id: row.id,
  eventType: row.event_type,
  recommendationId: row.recommendation_id,
  itemIds: parseJson(row.item_ids_json, []),
  weatherSnapshot: parseJson(row.weather_snapshot_json, undefined),
  inputSnapshot: parseJson(row.input_snapshot_json, undefined),
  aiReason: row.ai_reason ?? undefined,
  isLiked: row.is_liked === 1,
  isWorn: row.is_worn === 1,
  isSkipped: row.is_skipped === 1,
  eventDate: row.event_date,
  createdAt: row.created_at
});

const mapRecognitionRun = (row: RecognitionRunRow): RecognitionRun => ({
  id: row.id,
  itemId: row.item_id,
  provider: row.provider,
  model: row.model ?? undefined,
  rawResult: parseJson(row.raw_result_json, undefined),
  confirmedFields: parseJson(row.confirmed_fields_json, undefined),
  recognitionStatus: row.recognition_status,
  errorMessage: row.error_message ?? undefined,
  createdAt: row.created_at
});

const getRecommendationRow = (db: SqliteDatabase, id: string) =>
  db
    .prepare("SELECT * FROM outfit_recommendations WHERE id = ?")
    .get(id) as RecommendationRow | undefined;

const getDailyRecommendationRowByDate = (db: SqliteDatabase, recommendationDate: string) =>
  db
    .prepare("SELECT * FROM daily_recommendations WHERE recommendation_date = ?")
    .get(recommendationDate) as DailyRecommendationRow | undefined;

const getDailyRecommendationRowById = (db: SqliteDatabase, id: string) =>
  db.prepare("SELECT * FROM daily_recommendations WHERE id = ?").get(id) as DailyRecommendationRow | undefined;

const requireRecommendation = (db: SqliteDatabase, id: string) => {
  const row = getRecommendationRow(db, id);

  if (!row) {
    throw new Error(`Outfit recommendation ${id} does not exist.`);
  }

  return mapRecommendation(db, row);
};

const createBehaviorEvent = (
  db: SqliteDatabase,
  eventType: BehaviorEvent["eventType"],
  input: BehaviorInput,
  flags: Pick<BehaviorEvent, "isLiked" | "isWorn" | "isSkipped">
) => {
  const recommendation = requireRecommendation(db, input.recommendationId);
  const id = randomUUID();
  const createdAt = nowIso();

  db.prepare(
    `
    INSERT INTO behavior_events (
      id, event_type, recommendation_id, item_ids_json, weather_snapshot_json,
      input_snapshot_json, ai_reason, is_liked, is_worn, is_skipped, event_date, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    eventType,
    input.recommendationId,
    JSON.stringify(recommendation.itemIds),
    stringifyJson(input.weatherSnapshot ?? recommendation.weatherSnapshot),
    stringifyJson(input.inputSnapshot ?? recommendation.inputSnapshot),
    input.aiReason ?? recommendation.reason,
    flags.isLiked ? 1 : 0,
    flags.isWorn ? 1 : 0,
    flags.isSkipped ? 1 : 0,
    input.eventDate,
    createdAt
  );

  const row = db.prepare("SELECT * FROM behavior_events WHERE id = ?").get(id) as BehaviorEventRow;

  return mapBehaviorEvent(row);
};

export const createWardrobeRepository = (db: SqliteDatabase): WardrobeRepository => {
  initializeSchema(db);

  return {
    createWardrobeItem(input) {
      const id = randomUUID();
      const createdAt = nowIso();

      db.prepare(
        `
        INSERT INTO wardrobe_items (
          id, image_path, original_filename, source_type, product_url, product_detail_text,
          recognition_source, field_confidence_json, status, recognition_status,
          seasons_json, scenarios_json, styles_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'pending', '[]', '[]', '[]', ?, ?)
      `
      ).run(
        id,
        input.imagePath,
        input.originalFilename ?? null,
        input.sourceType ?? "photo",
        input.productUrl ?? null,
        input.productDetailText ?? null,
        input.recognitionSource ?? null,
        input.fieldConfidence ? JSON.stringify(input.fieldConfidence) : null,
        createdAt,
        createdAt
      );

      const row = db.prepare("SELECT * FROM wardrobe_items WHERE id = ?").get(id) as WardrobeItemRow;

      return mapWardrobeItem(row);
    },

    confirmWardrobeItem(id, attributes) {
      const updatedAt = nowIso();

      const result = db
        .prepare(
          `
          UPDATE wardrobe_items
          SET
            status = 'confirmed',
            category = ?,
            primary_color = ?,
            secondary_color = ?,
            material = ?,
            seasons_json = ?,
            scenarios_json = ?,
            formality = ?,
            styles_json = ?,
            warmth = ?,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(
          attributes.category,
          attributes.primaryColor,
          attributes.secondaryColor ?? null,
          attributes.material,
          JSON.stringify(attributes.seasons),
          JSON.stringify(attributes.scenarios),
          attributes.formality,
          JSON.stringify(attributes.styles),
          attributes.warmth,
          updatedAt,
          id
        );

      if (result.changes === 0) {
        throw new Error(`Wardrobe item ${id} does not exist.`);
      }

      db.prepare(
        `
        UPDATE recognition_runs
        SET confirmed_fields_json = ?
        WHERE item_id = ?
          AND created_at = (
            SELECT MAX(created_at)
            FROM recognition_runs
            WHERE item_id = ?
          )
      `
      ).run(JSON.stringify(attributes), id, id);

      const row = db.prepare("SELECT * FROM wardrobe_items WHERE id = ?").get(id) as WardrobeItemRow;

      return mapWardrobeItem(row);
    },

    saveRecognitionDraft(input) {
      const runId = randomUUID();
      const createdAt = nowIso();
      const updatedAt = nowIso();
      const updateItem = db.prepare(
        `
        UPDATE wardrobe_items
        SET
          recognition_status = 'success',
          category = ?,
          primary_color = ?,
          secondary_color = ?,
          material = ?,
          seasons_json = ?,
          scenarios_json = ?,
          formality = ?,
          styles_json = ?,
          warmth = ?,
          updated_at = ?
        WHERE id = ?
      `
      );
      const insertRun = db.prepare(
        `
        INSERT INTO recognition_runs (
          id, item_id, provider, model, raw_result_json, confirmed_fields_json,
          recognition_status, error_message, created_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, 'success', NULL, ?)
      `
      );
      const save = db.transaction(() => {
        const result = updateItem.run(
          input.attributes.category,
          input.attributes.primaryColor,
          input.attributes.secondaryColor ?? null,
          input.attributes.material,
          JSON.stringify(input.attributes.seasons),
          JSON.stringify(input.attributes.scenarios),
          input.attributes.formality,
          JSON.stringify(input.attributes.styles),
          input.attributes.warmth,
          updatedAt,
          input.itemId
        );

        if (result.changes === 0) {
          throw new Error(`Wardrobe item ${input.itemId} does not exist.`);
        }

        insertRun.run(
          runId,
          input.itemId,
          input.provider,
          input.model ?? null,
          stringifyJson(input.rawResult),
          createdAt
        );
      });

      save();

      const row = db.prepare("SELECT * FROM recognition_runs WHERE id = ?").get(runId) as RecognitionRunRow;

      return mapRecognitionRun(row);
    },

    saveRecognitionFailure(input) {
      const runId = randomUUID();
      const createdAt = nowIso();
      const updatedAt = nowIso();
      const save = db.transaction(() => {
        const result = db
          .prepare(
            `
            UPDATE wardrobe_items
            SET recognition_status = 'failed', updated_at = ?
            WHERE id = ?
          `
          )
          .run(updatedAt, input.itemId);

        if (result.changes === 0) {
          throw new Error(`Wardrobe item ${input.itemId} does not exist.`);
        }

        db.prepare(
          `
          INSERT INTO recognition_runs (
            id, item_id, provider, model, raw_result_json, confirmed_fields_json,
            recognition_status, error_message, created_at
          )
          VALUES (?, ?, ?, ?, ?, NULL, 'failed', ?, ?)
        `
        ).run(
          runId,
          input.itemId,
          input.provider,
          input.model ?? null,
          stringifyJson(input.rawResult),
          input.errorMessage,
          createdAt
        );
      });

      save();

      const row = db.prepare("SELECT * FROM recognition_runs WHERE id = ?").get(runId) as RecognitionRunRow;

      return mapRecognitionRun(row);
    },

    listRecognitionRuns(itemId) {
      return db
        .prepare("SELECT * FROM recognition_runs WHERE item_id = ? ORDER BY created_at DESC")
        .all(itemId)
        .map((row) => mapRecognitionRun(row as RecognitionRunRow));
    },

    listDraftWardrobeItems() {
      return db
        .prepare("SELECT * FROM wardrobe_items WHERE status = 'draft' ORDER BY created_at ASC")
        .all()
        .map((row) => mapWardrobeItem(row as WardrobeItemRow));
    },

    listConfirmedWardrobeItems() {
      return db
        .prepare("SELECT * FROM wardrobe_items WHERE status = 'confirmed' ORDER BY created_at ASC")
        .all()
        .map((row) => mapWardrobeItem(row as WardrobeItemRow));
    },

    createOutfitRecommendation(input) {
      const id = randomUUID();
      const createdAt = nowIso();
      const itemIds = uniqueIds(input.itemIds);
      const insertRecommendation = db.prepare(
        `
        INSERT INTO outfit_recommendations (
          id, title, scenario, reason, weather_snapshot_json, input_snapshot_json,
          daily_recommendation_id, is_liked, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `
      );
      const insertItem = db.prepare(
        `
        INSERT INTO outfit_recommendation_items (recommendation_id, item_id, position)
        VALUES (?, ?, ?)
      `
      );
      const insert = db.transaction(() => {
        insertRecommendation.run(
          id,
          input.title,
          input.scenario ?? null,
          input.reason,
          stringifyJson(input.weatherSnapshot),
          stringifyJson(input.inputSnapshot),
          input.dailyRecommendationId ?? null,
          createdAt
        );

        itemIds.forEach((itemId, position) => insertItem.run(id, itemId, position));
      });

      insert();

      return requireRecommendation(db, id);
    },

    getOutfitRecommendation(id) {
      const row = getRecommendationRow(db, id);

      return row ? mapRecommendation(db, row) : undefined;
    },

    listOutfitRecommendations() {
      return db
        .prepare("SELECT * FROM outfit_recommendations ORDER BY created_at DESC")
        .all()
        .map((row) => mapRecommendation(db, row as RecommendationRow));
    },

    ensureDailyRecommendationForDate(recommendationDate) {
      const existing = getDailyRecommendationRowByDate(db, recommendationDate);

      if (existing) {
        return mapDailyRecommendation(existing);
      }

      const id = randomUUID();
      const createdAt = nowIso();

      db.prepare(
        `
        INSERT INTO daily_recommendations (id, recommendation_date, recommendation_id, created_at)
        VALUES (?, ?, NULL, ?)
      `
      ).run(id, recommendationDate, createdAt);

      const row = getDailyRecommendationRowById(db, id);

      if (!row) {
        throw new Error(`Daily recommendation ${id} was not created.`);
      }

      return mapDailyRecommendation(row);
    },

    getDailyRecommendationForDate(recommendationDate) {
      const row = getDailyRecommendationRowByDate(db, recommendationDate);

      return row ? mapDailyRecommendation(row) : undefined;
    },

    attachRecommendationToDaily(dailyRecommendationId, recommendationId) {
      requireRecommendation(db, recommendationId);

      const update = db.transaction(() => {
        const result = db
          .prepare("UPDATE daily_recommendations SET recommendation_id = ? WHERE id = ?")
          .run(recommendationId, dailyRecommendationId);

        if (result.changes === 0) {
          throw new Error(`Daily recommendation ${dailyRecommendationId} does not exist.`);
        }

        db.prepare("UPDATE outfit_recommendations SET daily_recommendation_id = ? WHERE id = ?").run(
          dailyRecommendationId,
          recommendationId
        );
      });

      update();

      const row = getDailyRecommendationRowById(db, dailyRecommendationId);

      if (!row) {
        throw new Error(`Daily recommendation ${dailyRecommendationId} does not exist.`);
      }

      return mapDailyRecommendation(row);
    },

    getWardrobeItemUsageStats() {
      return db
        .prepare(
          `
          SELECT
            links.item_id,
            COUNT(DISTINCT links.recommendation_id) AS referenced_outfit_count,
            COUNT(DISTINCT CASE WHEN recommendations.is_liked = 1 THEN links.recommendation_id END) AS liked_outfit_count,
            COUNT(DISTINCT CASE WHEN events.event_type = 'wear_today' THEN events.id END) AS worn_count,
            MAX(recommendations.created_at) AS last_referenced_at,
            MIN(links.position) AS first_position
          FROM outfit_recommendation_items links
          INNER JOIN outfit_recommendations recommendations
            ON recommendations.id = links.recommendation_id
          LEFT JOIN behavior_events events
            ON events.recommendation_id = links.recommendation_id
            AND events.event_type = 'wear_today'
          GROUP BY links.item_id
          ORDER BY first_position ASC, links.item_id ASC
        `
        )
        .all()
        .map((row) => {
          const stat = row as UsageStatRow;

          return {
            itemId: stat.item_id,
            referencedOutfitCount: stat.referenced_outfit_count,
            likedOutfitCount: stat.liked_outfit_count,
            wornCount: stat.worn_count,
            lastReferencedAt: stat.last_referenced_at ?? undefined
          };
        });
    },

    recordLike(input) {
      const record = db.transaction(() => {
        db.prepare("UPDATE outfit_recommendations SET is_liked = ? WHERE id = ?").run(
          input.liked ? 1 : 0,
          input.recommendationId
        );

        return createBehaviorEvent(db, "like", input, {
          isLiked: input.liked,
          isWorn: false,
          isSkipped: false
        });
      });

      return record();
    },

    recordWearToday(input) {
      const record = db.transaction(() => {
        const recommendation = requireRecommendation(db, input.recommendationId);
        const id = randomUUID();
        const createdAt = nowIso();

        db.prepare(
          `
          INSERT OR IGNORE INTO behavior_events (
            id, event_type, recommendation_id, item_ids_json, weather_snapshot_json,
            input_snapshot_json, ai_reason, is_liked, is_worn, is_skipped, event_date, created_at
          )
          VALUES (?, 'wear_today', ?, ?, ?, ?, ?, 0, 1, 0, ?, ?)
        `
        ).run(
          id,
          input.recommendationId,
          JSON.stringify(recommendation.itemIds),
          stringifyJson(input.weatherSnapshot ?? recommendation.weatherSnapshot),
          stringifyJson(input.inputSnapshot ?? recommendation.inputSnapshot),
          input.aiReason ?? recommendation.reason,
          input.eventDate,
          createdAt
        );

        const row = db
          .prepare(
            `
            SELECT *
            FROM behavior_events
            WHERE event_type = 'wear_today'
              AND recommendation_id = ?
              AND event_date = ?
          `
          )
          .get(input.recommendationId, input.eventDate) as BehaviorEventRow | undefined;

        if (!row) {
          throw new Error("今日穿着记录写入失败");
        }

        return mapBehaviorEvent(row);
      });

      return record();
    },

    recordChangeOutfit(input) {
      return createBehaviorEvent(db, "change_outfit", input, {
        isLiked: false,
        isWorn: false,
        isSkipped: true
      });
    },

    recordAutoReplaceItem(input) {
      return createBehaviorEvent(db, "auto_replace_item", input, {
        isLiked: false,
        isWorn: false,
        isSkipped: false
      });
    },

    recordManualReplaceItem(input) {
      return createBehaviorEvent(db, "manual_replace_item", input, {
        isLiked: false,
        isWorn: false,
        isSkipped: false
      });
    },

    listBehaviorEvents() {
      return db
        .prepare("SELECT * FROM behavior_events ORDER BY created_at ASC")
        .all()
        .map((row) => mapBehaviorEvent(row as BehaviorEventRow));
    }
  };
};

export const createInMemoryWardrobeRepository = () =>
  createWardrobeRepository(new Database(":memory:"));

export const createLocalWardrobeRepository = (databasePath = join(process.cwd(), "data", "wardrobe.db")) => {
  mkdirSync(dirname(databasePath), { recursive: true });

  return createWardrobeRepository(new Database(databasePath));
};
