const value = process.env.VITE_API_BASE_URL?.trim();

if (!value) {
  console.error('Set VITE_API_BASE_URL to the production API base URL ending in /api.');
  process.exit(1);
}

let apiUrl;
try {
  apiUrl = new URL(value);
} catch {
  console.error('VITE_API_BASE_URL must be a valid HTTPS URL ending in /api.');
  process.exit(1);
}

const apiPath = apiUrl.pathname.replace(/\/+$/, '');
if (apiUrl.protocol !== 'https:' || !apiPath.endsWith('/api') || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
  console.error('VITE_API_BASE_URL must be an HTTPS URL ending in /api and must not contain credentials or query parameters.');
  process.exit(1);
}

console.log('Production API URL is valid.');
