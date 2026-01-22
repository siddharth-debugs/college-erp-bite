import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,      // 👈 important
    port: 5173,      // optional
  },
});

// | Line / Section                                                        | What It Does                             | Why It’s Used                                                                         |
// | --------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
// | `import { defineConfig } from "vite";`                                | Imports Vite’s helper to define a config | Provides **TypeScript-friendly config** with type checking                            |
// | `import react from "@vitejs/plugin-react";`                           | Imports the React plugin for Vite        | Enables **React Fast Refresh**, JSX/TSX support, and other React optimizations        |
// | `import tailwindcss from "@tailwindcss/vite";`                        | Imports Tailwind CSS plugin              | Integrates Tailwind CSS with Vite so you can use utility classes and JIT compilation  |
// | `export default defineConfig({ plugins: [react(), tailwindcss()] });` | Exports Vite config                      | Registers the **React** and **Tailwind** plugins for Vite to use during dev and build |


// Purpose of vite.config.ts

// vite.config.ts is the configuration file for Vite, which is your build tool / dev server.

// Vite is responsible for:

// Running the development server (npm run dev)

// Bundling your React + TypeScript app for production

// Applying plugins like React fast refresh and Tailwind CSS