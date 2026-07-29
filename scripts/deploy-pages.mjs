// Publishes dist/ to the gh-pages branch, which GitHub Pages serves.
//
// This exists because the repo's OAuth token lacks the `workflow` scope, so
// .github/workflows/deploy.yml cannot be pushed. Once that scope is granted
// (`gh auth refresh -s workflow`), commit the workflow, switch the Pages
// source to "GitHub Actions", and this script becomes unnecessary.
//
// Usage: bun run deploy

import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const BRANCH = "gh-pages";

function git(args, opts = {}) {
  return execFileSync("git", args, { stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`No ${DIST}/index.html — run the build first (bun run build).`);
  process.exit(1);
}

const remote = git(["remote", "get-url", "origin"]);
const sourceCommit = git(["rev-parse", "--short", "HEAD"]);

// The throwaway repo below inherits nothing, so carry the identity across.
const authorName = git(["config", "user.name"]);
const authorEmail = git(["config", "user.email"]);

// Tell Pages not to run Jekyll, which would strip files beginning with "_".
writeFileSync(join(DIST, ".nojekyll"), "");

// A throwaway repo inside dist/ keeps the branch history detached from the
// source history, so built assets never land on main.
rmSync(join(DIST, ".git"), { recursive: true, force: true });

const inDist = { cwd: DIST };
git(["init", "-q", "-b", BRANCH], inDist);
git(["config", "user.name", authorName], inDist);
git(["config", "user.email", authorEmail], inDist);
git(["add", "-A"], inDist);
git(["commit", "-q", "-m", `Deploy ${sourceCommit} to GitHub Pages`], inDist);
git(["push", "--force", "-q", remote, `${BRANCH}:${BRANCH}`], inDist);

rmSync(join(DIST, ".git"), { recursive: true, force: true });

console.log(`Deployed ${sourceCommit} to ${BRANCH}.`);
