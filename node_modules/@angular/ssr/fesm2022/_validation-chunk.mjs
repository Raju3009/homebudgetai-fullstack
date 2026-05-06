const X_FORWARDED_HEADERS = new Set(['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-port', 'x-forwarded-proto', 'x-forwarded-prefix']);
const HOST_HEADERS_TO_VALIDATE = ['host', 'x-forwarded-host'];
const VALID_PORT_REGEX = /^\d+$/;
const VALID_PROTO_REGEX = /^https?$/i;
const VALID_PREFIX_REGEX = /^\/([a-z0-9_-]+\/)*[a-z0-9_-]*$/i;
function getFirstHeaderValue(value) {
  return value?.toString().split(',', 1)[0]?.trim();
}
function validateRequest(request, allowedHosts, disableHostCheck) {
  validateHeaders(request, allowedHosts, disableHostCheck);
  if (!disableHostCheck) {
    validateUrl(new URL(request.url), allowedHosts);
  }
}
function validateUrl(url, allowedHosts) {
  const {
    hostname
  } = url;
  if (!isHostAllowed(hostname, allowedHosts)) {
    throw new Error(`URL with hostname "${hostname}" is not allowed.`);
  }
}
function sanitizeRequestHeaders(request, trustProxyHeaders) {
  const keysToDelete = [];
  let deoptToCSR = false;
  for (const [key] of request.headers) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('x-forwarded-') && !isProxyHeaderAllowed(lowerKey, trustProxyHeaders)) {
      console.warn(`Received "${key}" header but "trustProxyHeaders" was not set up to allow it.\n` + `For more information, see https://angular.dev/best-practices/security#configuring-trusted-proxy-headers`);
      deoptToCSR = true;
      keysToDelete.push(key);
    }
  }
  if (keysToDelete.length === 0) {
    return {
      request,
      deoptToCSR
    };
  }
  const clonedReq = new Request(request.clone(), {
    signal: request.signal
  });
  const headers = clonedReq.headers;
  for (const key of keysToDelete) {
    headers.delete(key);
  }
  return {
    request: clonedReq,
    deoptToCSR
  };
}
function verifyHostAllowed(headerName, headerValue, allowedHosts) {
  const url = `http://${headerValue}`;
  if (!URL.canParse(url)) {
    throw new Error(`Header "${headerName}" contains an invalid value and cannot be parsed.`);
  }
  const {
    hostname,
    pathname,
    search,
    hash,
    username,
    password
  } = new URL(url);
  if (pathname !== '/' || search || hash || username || password) {
    throw new Error(`Header "${headerName}" with value "${headerValue}" contains characters that are not allowed.`);
  }
  if (!isHostAllowed(hostname, allowedHosts)) {
    throw new Error(`Header "${headerName}" with value "${headerValue}" is not allowed.`);
  }
}
function isHostAllowed(hostname, allowedHosts) {
  if (allowedHosts.has('*') || allowedHosts.has(hostname)) {
    return true;
  }
  for (const allowedHost of allowedHosts) {
    if (!allowedHost.startsWith('*.')) {
      continue;
    }
    const domain = allowedHost.slice(1);
    if (hostname.endsWith(domain)) {
      return true;
    }
  }
  return false;
}
function validateHeaders(request, allowedHosts, disableHostCheck) {
  const headers = request.headers;
  for (const headerName of HOST_HEADERS_TO_VALIDATE) {
    const headerValue = getFirstHeaderValue(headers.get(headerName));
    if (headerValue && !disableHostCheck) {
      verifyHostAllowed(headerName, headerValue, allowedHosts);
    }
  }
  const xForwardedPort = getFirstHeaderValue(headers.get('x-forwarded-port'));
  if (xForwardedPort && !VALID_PORT_REGEX.test(xForwardedPort)) {
    throw new Error('Header "x-forwarded-port" must be a numeric value.');
  }
  const xForwardedProto = getFirstHeaderValue(headers.get('x-forwarded-proto'));
  if (xForwardedProto && !VALID_PROTO_REGEX.test(xForwardedProto)) {
    throw new Error('Header "x-forwarded-proto" must be either "http" or "https".');
  }
  const xForwardedPrefix = getFirstHeaderValue(headers.get('x-forwarded-prefix'));
  if (xForwardedPrefix && !VALID_PREFIX_REGEX.test(xForwardedPrefix)) {
    throw new Error('Header "x-forwarded-prefix" is invalid. It must start with a "/" and contain ' + 'only alphanumeric characters, hyphens, and underscores, separated by single slashes.');
  }
}
function isProxyHeaderAllowed(headerName, trustProxyHeaders) {
  return trustProxyHeaders.has(headerName.toLowerCase());
}
function normalizeTrustProxyHeaders(trustProxyHeaders) {
  if (trustProxyHeaders === undefined) {
    return new Set(['x-forwarded-host', 'x-forwarded-proto']);
  }
  if (trustProxyHeaders === false) {
    return new Set();
  }
  if (trustProxyHeaders === true) {
    return X_FORWARDED_HEADERS;
  }
  return new Set(trustProxyHeaders.map(h => h.toLowerCase()));
}

export { getFirstHeaderValue, isProxyHeaderAllowed, normalizeTrustProxyHeaders, sanitizeRequestHeaders, validateRequest, validateUrl };
//# sourceMappingURL=_validation-chunk.mjs.map
