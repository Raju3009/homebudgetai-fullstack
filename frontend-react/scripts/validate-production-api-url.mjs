const value = process.env.VITE_API_BASE_URL?.trim();
const expectedApiUrl = 'https://homebudgetai-fullstack-2.onrender.com/api';

if (!value) {
  console.error(`Set VITE_API_BASE_URL=${expectedApiUrl} before building.`);
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
  console.error(`VITE_API_BASE_URL must be ${expectedApiUrl} and must not contain credentials or query parameters.`);
  process.exit(1);
}

if (apiUrl.origin !== 'https://homebudgetai-fullstack-2.onrender.com' || apiPath !== '/api') {
  console.error(`VITE_API_BASE_URL must point to the production API: ${expectedApiUrl}.`);
  process.exit(1);
}

console.log('Production API URL is valid.');
