// Local dev with local API (see proxy.conf.json):
//   browser → http://localhost:4200/api/v1/... → proxied to https://localhost:7063
// Keep apiBaseUrl empty so requests stay same-origin (avoids CORS).
export const environment = {
  production: false,
  apiBaseUrl: '',
  apiVersionPath: '/api/v1',
};
