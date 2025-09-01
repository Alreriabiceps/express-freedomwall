// Helper functions to extract browser and OS info from User-Agent

export function extractBrowserFromUserAgent(userAgent) {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

export function extractBrowserVersionFromUserAgent(userAgent) {
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  if (chromeMatch) return chromeMatch[1];

  const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
  if (firefoxMatch) return firefoxMatch[1];

  const safariMatch = userAgent.match(/Version\/(\d+)/);
  if (safariMatch) return safariMatch[1];

  const edgeMatch = userAgent.match(/Edge\/(\d+)/);
  if (edgeMatch) return edgeMatch[1];

  return "Unknown";
}

export function extractOSFromUserAgent(userAgent) {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  if (userAgent.includes("Ubuntu")) return "Ubuntu";
  if (userAgent.includes("Debian")) return "Debian";
  if (userAgent.includes("CentOS")) return "CentOS";
  if (userAgent.includes("Fedora")) return "Fedora";
  return "Unknown";
}

