export const IMPORT_USER_AGENT =
  "dutch.beer-catalog/0.1 (https://github.com/kunalpanchal/dutchbeer; hello@dutch.beer)";

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  retries = 4,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": IMPORT_USER_AGENT,
        ...init.headers,
      },
    });
    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`);
      await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** attempt));
      continue;
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
    return (await response.json()) as T;
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

export async function fetchText(url: string, init: RequestInit = {}): Promise<string> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": IMPORT_USER_AGENT,
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}
