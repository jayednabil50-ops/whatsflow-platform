const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const path = require("node:path");

const root = path.join(__dirname, "..");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const appPort = String(process.env.PORT || process.env.NEXT_PORT || 3000);
const workerPort = String(process.env.WHATSFLOW_WORKER_PORT || 3101);

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.WHATSFLOW_WORKER_PORT = workerPort;
process.env.WHATSFLOW_WORKER_URL =
  process.env.WHATSFLOW_WORKER_URL || `http://127.0.0.1:${workerPort}`;
process.env.WHATSFLOW_WORKER_SECRET =
  process.env.WHATSFLOW_WORKER_SECRET || randomBytes(32).toString("hex");

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[start-production] ${name} exited`, { code, signal });
    shutdown(code || 1);
  });

  return child;
}

let shuttingDown = false;
const children = [
  start("whatsapp-worker", process.execPath, [tsxCli, "scripts/whatsapp-worker.ts"]),
  start("next", process.execPath, [nextCli, "start", "-H", "0.0.0.0", "-p", appPort])
];

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(code), 300).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
