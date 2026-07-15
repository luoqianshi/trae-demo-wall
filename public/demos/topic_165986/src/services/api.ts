import type { Entry, State, EntryKind } from "@/types";

const API_BASE = "/api";

export interface CreateEntryRequest {
  mode: "write" | "chat";
  kind: EntryKind;
  title: string;
  content: string;
  contentHtml: string;
}

export interface CreateEntryResponse {
  success: boolean;
  entry: Entry;
  state: State;
}

export interface GetStateResponse {
  success: boolean;
  data: State;
}

export interface DeleteEntryResponse {
  success: boolean;
  state: State;
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  aiPowered: boolean;
}

export interface PsychResult {
  dimension: string;
  label: string;
  description: string;
  score: number;
  count: number;
}

export interface PsychResponse {
  success: boolean;
  data: PsychResult[];
}

export interface AIStatusResponse {
  success: boolean;
  enabled: boolean;
  model: string | null;
}

export async function createEntry(request: CreateEntryRequest): Promise<CreateEntryResponse> {
  const response = await fetch(`${API_BASE}/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return response.json();
}

export async function getState(): Promise<GetStateResponse> {
  const response = await fetch(`${API_BASE}/state`);
  return response.json();
}

export async function deleteEntry(id: string): Promise<DeleteEntryResponse> {
  const response = await fetch(`${API_BASE}/entries/${id}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return response.json();
}

export async function getPsychAnalysis(model: string): Promise<PsychResponse> {
  const response = await fetch(`${API_BASE}/psych/${model}`);
  return response.json();
}

export async function getAIStatus(): Promise<AIStatusResponse> {
  const response = await fetch(`${API_BASE}/ai-status`);
  return response.json();
}
