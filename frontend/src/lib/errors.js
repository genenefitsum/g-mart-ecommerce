function formatTechnicalMessage(raw, fallback) {
  const message = String(raw ?? "").trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();

  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("econn") ||
    lower.includes("cors") ||
    lower.includes("not allowed by cors")
  ) {
    return "Unable to connect right now. Please check your internet and try again.";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request took too long. Please try again.";
  }

  if (/^request failed with status code\s+401$/i.test(message)) {
    return "Your session has expired. Please sign in again.";
  }

  if (/^request failed with status code\s+403$/i.test(message)) {
    return "You do not have permission to do that.";
  }

  if (/^request failed with status code\s+404$/i.test(message)) {
    return "The requested item could not be found.";
  }

  if (/^request failed with status code\s+409$/i.test(message)) {
    return "This action was already completed recently.";
  }

  if (/^request failed with status code\s+5\d\d$/i.test(message)) {
    return "Server error. Please try again in a moment.";
  }

  if (message.startsWith("{") || message.startsWith("[")) {
    return fallback;
  }

  return message;
}

export function toErrorMessage(value, fallback = "Something went wrong") {
  if (value == null || value === "") return fallback;

  if (typeof value === "string") return formatTechnicalMessage(value, fallback);

  if (value instanceof Error && typeof value.message === "string" && value.message) {
    return formatTechnicalMessage(value.message, fallback);
  }

  if (typeof value === "object") {
    const responseData = value?.response?.data;
    if (responseData && typeof responseData === "object") {
      const dataError = responseData?.error;
      if (typeof dataError === "string" && dataError) {
        return formatTechnicalMessage(dataError, fallback);
      }

      const dataMessage = responseData?.message;
      if (typeof dataMessage === "string" && dataMessage) {
        return formatTechnicalMessage(dataMessage, fallback);
      }
    }

    if (typeof responseData === "string" && responseData) {
      return formatTechnicalMessage(responseData, fallback);
    }

    const directError = value?.error;
    if (typeof directError === "string" && directError) {
      return formatTechnicalMessage(directError, fallback);
    }

    const message = value?.message;
    if (typeof message === "string" && message) {
      return formatTechnicalMessage(message, fallback);
    }

    const code = value?.code;
    if (typeof code === "string" && code) {
      return formatTechnicalMessage(code, fallback);
    }
  }

  try {
    return formatTechnicalMessage(String(value), fallback);
  } catch {
    return fallback;
  }
}
