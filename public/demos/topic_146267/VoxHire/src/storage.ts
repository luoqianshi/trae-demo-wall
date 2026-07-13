import type { InterviewReport, SetupData, TranscriptEntry } from "./types";

const DB_NAME = "voxhire";
const STORE = "reports";

export interface StoredInterview {
  id: string;
  createdAt: string;
  setup: Pick<SetupData, "role" | "experienceYears" | "skills">;
  transcript: TranscriptEntry[];
  report: InterviewReport;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveInterview(value: StoredInterview): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function recentInterviews(): Promise<StoredInterview[]> {
  const db = await openDb();
  const values = await new Promise<StoredInterview[]>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredInterview[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return values.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
