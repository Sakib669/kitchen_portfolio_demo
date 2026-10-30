import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextConfig = require("eslint-config-next/core-web-vitals");

export default [
  ...nextConfig,
  { ignores: [".next/**", "node_modules/**", "node_modules.shared-link/**", "sites/**", "functional/**", "tools/**", "next-env.d.ts"] },
];
