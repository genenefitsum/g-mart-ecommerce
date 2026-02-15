export function toErrorMessage(value, fallback = "Something went wrong") {
  if (value == null || value === "") return fallback;

  if (typeof value === "string") return value;

  // Standard Error
  if (value instanceof Error && typeof value.message === "string" && value.message) {
    return value.message;
  }

  // Common thrown / Axios-like shapes
  if (typeof value === "object") {
    const message = value?.message;
    if (typeof message === "string" && message) return message;

    const directError = value?.error;
    if (typeof directError === "string" && directError) return directError;

    const responseData = value?.response?.data;
    if (typeof responseData === "string" && responseData) return responseData;
    if (responseData && typeof responseData === "object") {
      const dataError = responseData?.error;
      if (typeof dataError === "string" && dataError) return dataError;
      const dataMessage = responseData?.message;
      if (typeof dataMessage === "string" && dataMessage) return dataMessage;
    }

    const code = value?.code;
    if (typeof code === "string" && code) return code;

    try {
      const json = JSON.stringify(value);
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }
  }

  try {
    return String(value);
  } catch {
    return fallback;
  }
}
