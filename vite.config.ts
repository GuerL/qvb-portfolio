import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { randomUUID } from 'node:crypto';

export default defineConfig(({ isSsrBuild }) => {
  const version = randomUUID();
  return {
    define: { __DEPLOYMENT_VERSION__: JSON.stringify(version) },
    plugins: [react(), {
      name: 'deployment-version',
      apply: 'build',
      generateBundle(options) {
        if (!isSsrBuild && options.format === 'es') {
          this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version }) });
        }
      },
    }],
    build: { sourcemap: false },
  };
});
