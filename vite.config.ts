import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Actions sets GITHUB_REPOSITORY to "owner/repo-name". Project Pages
// are served from https://<owner>.github.io/<repo-name>/, so Vite must use
// that path as `base`. Local dev keeps the default "/".
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
