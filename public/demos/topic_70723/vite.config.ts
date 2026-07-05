import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

function removeModulePlugin(): Plugin {
  return {
    name: 'remove-module-attr',
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        return html
          .replace(
            /<script\s+type="module"\s+([^>]*)>/g,
            '<script defer $1>'
          )
          .replace(
            /\scrossorigin(?=\s|>)/g,
            ''
          );
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    base: isBuild ? './' : '/',
    build: {
      sourcemap: 'hidden',
      rollupOptions: isBuild ? {
        output: {
          format: 'iife',
        },
      } : undefined,
    },
    plugins: [
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }), 
      tsconfigPaths(),
      ...(isBuild ? [removeModulePlugin()] : []),
    ],
  };
})
