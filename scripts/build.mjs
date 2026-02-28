import * as esbuild from "esbuild";
import { cpSync, rmSync, mkdirSync, existsSync } from "fs";

const isWatch = process.argv.includes("--watch");

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
