declare const process: { env: { API_BASE_URL: string } };

const API_BASE_URL = process.env.API_BASE_URL;
const INSIGHTS_TIMEOUT_MS = 30_000;
const TTS_TIMEOUT_MS = 60_000;

export interface AIInsightsResponse {
  summary: string;
  pros: string[];
  cons: string[];
  dealScore: number;
  dealVerdict: string;
  source: string;
}

export interface TTSResponse {
  audio_base64: string;
  content_type: string;
}

export function isAIAvailable(): boolean {
  return typeof API_BASE_URL === "string" && API_BASE_URL.length > 0;
}

async function apiFetch<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  if (!isAIAvailable()) {
    throw new Error("Backend API URL not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${errorBody.substring(0, 200)}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callBackendForInsights(data: any): Promise<AIInsightsResponse> {
  const result = await apiFetch<AIInsightsResponse>("/api/insights", data, INSIGHTS_TIMEOUT_MS);

  if (!result.pros || !result.cons || typeof result.dealScore !== "number") {
    throw new Error("Malformed response from backend");
  }

  result.dealScore = Math.round(Math.min(Math.max(result.dealScore, 0), 10) * 10) / 10;
  return result;
}

export async function callBackendForTTS(text: string): Promise<TTSResponse> {
  return apiFetch<TTSResponse>("/api/tts", { text }, TTS_TIMEOUT_MS);
}
