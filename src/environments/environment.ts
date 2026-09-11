// Production build for Nginx + same-origin reverse proxy on EC2:
//   browser → http://<public-ip>/           → Angular (static)
//   browser → http://<public-ip>/api/v1/... → Nginx → Kestrel :5000
// Keep `apiBaseUrl` empty so requests stay on the public site origin.
// Do NOT put localhost or a developer machine URL here.
export const environment = {
  production: true,
  apiBaseUrl: '',
  apiVersionPath: '/api/v1',
};
