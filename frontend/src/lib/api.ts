const getApiBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && (url.includes('localhost') || url.startsWith('http://'))) {
      console.warn(
        `[API] WARNING: NEXT_PUBLIC_BACKEND_URL="${url}" does not match production host "${host}".`
      );
    }
  }
  return url;
};

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError {
  status: number;
  message: string;
  data?: any;
}

class ApiRequestError extends Error {
  status: number;
  data?: any;

  constructor({ status, message, data }: ApiError) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

const apiFetch = async (endpoint: string, options: ApiFetchOptions = {}): Promise<any> => {
  const { skipAuth = false, ...fetchOptions } = options;
  const baseUrl = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      throw new ApiRequestError({
        status: response.status,
        message: errorData.error || errorData.message || `Request failed with status ${response.status}`,
        data: errorData,
      });
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    const networkError = error as TypeError;
    console.error(`[API] Network error fetching ${url}:`, networkError.message);
    throw new ApiRequestError({
      status: 0,
      message: `Failed to connect to server. Please check your internet connection and ensure the server is running. (${networkError.message})`,
      data: null,
    });
  }
};

export { getApiBase, apiFetch, ApiRequestError };
export type { ApiFetchOptions };
