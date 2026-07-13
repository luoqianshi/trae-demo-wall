import type { InterviewReport, LlmConnectionResult, SessionCreated, SetupData, TranscriptEntry } from "../types";

const jsonHeaders = { "Content-Type": "application/json" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "服务暂时不可用");
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function createSession(data: SetupData): Promise<SessionCreated> {
  return request<SessionCreated>("/api/sessions", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      role: data.role,
      experience_years: data.experienceYears,
      skills: data.skills.split(/[，,]/).map((value) => value.trim()).filter(Boolean),
      resume_text: data.resumeText,
      job_description: data.jobDescription,
    }),
  });
}

export function mirrorTranscript(sessionId: string, entries: TranscriptEntry[]): Promise<void> {
  return request<void>(`/api/sessions/${sessionId}/transcript`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ entries }),
  });
}

export function generateReport(sessionId: string, entries: TranscriptEntry[]): Promise<InterviewReport> {
  return request<InterviewReport>(`/api/sessions/${sessionId}/report`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ entries }),
  });
}

export async function extractPdf(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const result = await request<{ text: string }>("/api/resume/extract", { method: "POST", body: form });
  return result.text;
}

export function testLlmConnection(): Promise<LlmConnectionResult> {
  return request<LlmConnectionResult>("/api/llm/test", { method: "POST" });
}
