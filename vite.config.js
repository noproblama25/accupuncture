import { defineConfig } from "vite";

// The existing .jsx files (App, Login, Booking, Admin, components, data,
// tweaks-panel) were authored as classic, non-module scripts: they reference
// `React`/`ReactDOM` and each other's exports (Icon, Avatar, PRACTITIONERS, …)
// as bare globals rather than via import/export, and each file finishes with
// `Object.assign(window, {...})` to publish its own globals for the next
// script in the chain. jsxInject reproduces the "React is just available"
// part for every file Vite transforms, without editing any of those files.
export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'; import ReactDOM from 'react-dom/client'`,
  },
});
