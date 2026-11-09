import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function localGeographyApi(): Plugin {
  return {
    name: 'taiseel-local-geography-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url || '/', 'http://localhost');
        const routeModules: Record<string, string> = {
          '/api/geography/areas': '/api/geography/areas.ts',
          '/api/geography/places': '/api/geography/places.ts',
          '/api/geography/zoning': '/api/geography/zoning.ts'
        };
        const modulePath = routeModules[requestUrl.pathname];
        if (!modulePath) {
          next();
          return;
        }

        try {
          const apiModule = await server.ssrLoadModule(modulePath) as {
            GET: (request: Request) => Promise<Response>;
          };
          const headers = new Headers();
          for (const [name, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') headers.set(name, value);
            else if (Array.isArray(value)) headers.set(name, value.join(', '));
          }

          const apiResponse = await apiModule.GET(new Request(requestUrl, {
            method: request.method || 'GET',
            headers
          }));
          response.statusCode = apiResponse.status;
          apiResponse.headers.forEach((value, name) => {
            if (name.toLowerCase() !== 'content-length' && name.toLowerCase() !== 'transfer-encoding') {
              response.setHeader(name, value);
            }
          });
          response.end(Buffer.from(await apiResponse.arrayBuffer()));
        } catch (error) {
          server.config.logger.error('Local geography API handler failed: ' + String(error));
          response.statusCode = 500;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({
            error: 'The local geography API handler failed.',
            detail: error instanceof Error ? error.message : String(error)
          }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localGeographyApi()],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        map: resolve(process.cwd(), 'map.html')
      }
    }
  },
  server: { host: '0.0.0.0' }
});
