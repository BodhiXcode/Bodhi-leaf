import * as esbuild from "esbuild";
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync } from "fs";

const isWatch = process.argv.includes("--watch");

function loadEnv() {
  const envVars = {};
  try {
    const envFile = readFileSync(".env", "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      envVars[key] = value;
    }
  } catch {
    console.warn("[bodhi-leaf] .env file not found — AI features will use local fallback");
  }
  return envVars;
}

const env = loadEnv();

function clean() {
  if (existsSync("dist")) {
    rmSync("dist", { recursive: true });
  }
  mkdirSync("dist", { recursive: true });
}

function copyAssets() {
  cpSync("public", "dist", { recursive: true });

  mkdirSync("dist/sidepanel", { recursive: true });
  cpSync("src/sidepanel/sidepanel.css", "dist/sidepanel/sidepanel.css");
}

const buildOptions = {
  entryPoints: [
    "src/background/service-worker.ts",
    "src/content/content-script.ts",
    "src/sidepanel/sidepanel.ts",
  ],
  bundle: true,
  outdir: "dist",
  platform: "browser",
  sourcemap: true,
  logLevel: "info",
  define: {
    "process.env.API_BASE_URL": JSON.stringify(env.API_BASE_URL || ""),
  },
};

clean();
copyAssets();

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[bodhi-leaf] watching for changes...");
} else {
  await esbuild.build(buildOptions);
  console.log("[bodhi-leaf] build complete");
}
