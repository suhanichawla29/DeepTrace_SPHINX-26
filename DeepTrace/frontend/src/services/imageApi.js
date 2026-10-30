/**
 * DeepTrace Image Detection API Client
 * 
 * Manages communication with the DeepTrace backend API.
 * Designed to connect to the FastAPI inference service when deployed,
 * with strict validation, network failure handling, and zero fabricated data.
 */

// Configurable API base URL and detection endpoint
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const DETECT_ENDPOINT = '/api/detect/image';
const HEALTH_ENDPOINT = '/api/health';

/**
 * Custom error class for API interaction failures
 */
export class ApiError extends Error {
  constructor(message, status = null, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Checks if the backend API server is reachable and online.
 * 
 * @returns {Promise<{ online: boolean, message: string, url: string }>}
 */
export async function checkBackendHealth() {
  const targetUrl = `${API_BASE_URL}${HEALTH_ENDPOINT}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        online: true,
        message: 'Backend API is connected and responding.',
        url: API_BASE_URL,
        data,
      };
    }

    return {
      online: false,
      message: `Backend returned status ${response.status}: ${response.statusText}`,
      url: API_BASE_URL,
    };
  } catch (err) {
    let reason = 'Backend connection pending. Server is not reachable.';
    if (err.name === 'AbortError') {
      reason = 'Backend connection timed out (server unreachable).';
    } else if (err.message && err.message.includes('Failed to fetch')) {
      reason = 'Connection refused. The backend service is not running on port 8000.';
    }

    return {
      online: false,
      message: reason,
      url: API_BASE_URL,
      error: err.message,
    };
  }
}

/**
 * Validates the raw backend response structure against expected schema.
 * Expected structure matches DeepTrace ImageDetector service:
 * {
 *   predicted_label: "REAL" | "FAKE",
 *   confidence: number,
 *   scores: { REAL: number, FAKE: number },
 *   model_id?: string,
 *   device?: string,
 *   processing_time_ms?: number
 * }
 */
function validateDetectionResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid response: response body is not an object', 500, 'INVALID_SCHEMA');
  }

  if (typeof data.predicted_label !== 'string') {
    throw new ApiError('Invalid response: missing or invalid "predicted_label"', 500, 'INVALID_SCHEMA');
  }

  if (typeof data.confidence !== 'number' || isNaN(data.confidence)) {
    throw new ApiError('Invalid response: missing or invalid "confidence"', 500, 'INVALID_SCHEMA');
  }

  if (!data.scores || typeof data.scores !== 'object') {
    throw new ApiError('Invalid response: missing or invalid "scores" mapping', 500, 'INVALID_SCHEMA');
  }

  // Ensure labels in scores match expected classes
  const labels = Object.keys(data.scores);
  if (labels.length === 0) {
    throw new ApiError('Invalid response: "scores" object is empty', 500, 'INVALID_SCHEMA');
  }

  return {
    model_id: data.model_id || 'aaronkantrowitz/ai-image-detection',
    predicted_label: data.predicted_label.toUpperCase(),
    confidence: Number(data.confidence),
    scores: Object.fromEntries(
      Object.entries(data.scores).map(([k, v]) => [k.toUpperCase(), Number(v)])
    ),
    device: data.device || 'cpu',
    processing_time_ms: data.processing_time_ms || null,
  };
}

/**
 * Submits an image file to the backend for real AI classification.
 * Strictly uses FormData and never generates or returns mock/fake data.
 * 
 * @param {File} file - The image file to analyze
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<Object>} The validated prediction result
 */
export async function analyzeImage(file, signal) {
  if (!file || !(file instanceof File)) {
    throw new ApiError('No valid image file provided.', 400, 'INVALID_INPUT');
  }

  const endpointUrl = `${API_BASE_URL}${DETECT_ENDPOINT}`;
  const formData = new FormData();
  formData.append('file', file, file.name);

  const startTime = performance.now();

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      body: formData,
      signal: signal,
    });

    const roundtripTime = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        // Fall back to status text
      }

      throw new ApiError(
        `Backend inference request failed: ${errorDetail}`,
        response.status,
        'SERVER_ERROR',
        errorDetail
      );
    }

    const json = await response.json();
    const validated = validateDetectionResponse(json);

    // If backend didn't provide processing_time_ms, use client measured roundtrip
    if (!validated.processing_time_ms) {
      validated.processing_time_ms = roundtripTime;
    }

    return validated;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Analysis request was cancelled.', null, 'ABORTED');
    }

    // Network level error (server down, CORS failure, connection refused)
    throw new ApiError(
      'Unable to connect to the DeepTrace backend API. The service may be offline or not yet running.',
      null,
      'NETWORK_ERROR',
      err.message
    );
  }
}

export { API_BASE_URL, DETECT_ENDPOINT, HEALTH_ENDPOINT };
