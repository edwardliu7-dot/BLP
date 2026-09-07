export class ApiError extends Error {
  readonly status: number;
  readonly stage?: string;

  constructor(message: string, status: number, stage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.stage = stage;
  }
}

export async function ensureApiSuccess(
  response: Response,
  fallbackMessage: string,
  stage?: string,
): Promise<void> {
  if (response.ok) return;

  let message = fallbackMessage;
  try {
    const body = await response.json();
    if (typeof body?.error === 'string' && body.error.trim()) {
      message = body.error;
    }
  } catch {
    // Keep the safe fallback when the server did not return JSON.
  }

  throw new ApiError(message, response.status, stage);
}