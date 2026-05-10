"use strict";

const { spawn } = require("child_process");
const net = require("net");

const workerPort = Number(process.env.WHATSFLOW_WORKER_PORT || 3101);
const nextPort = String(process.env.PORT || 3000);

let worker = null;
let next = null;
let shuttingDown = false;

function startProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...extraEnv
    }
  });

  child.on("error", (error) => {
    console.error(`[render-start] Failed to start ${name}:`, error.message);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[render-start] ${name} exited unexpectedly with ${detail}.`);
    shutdown(typeof code === "number" ? code : 1);
  });

  return child;
}

function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = new net.Socket();

      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("timeout", () => socket.destroy());
      socket.once("error", () => socket.destroy());
      socket.once("close", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(attempt, 500);
      });

      socket.connect(port, host);
    };

    attempt();
  });
}

function killChild(child, signal = "SIGTERM") {
  if (!child || child.killed) {
    return;
  }

  try {
    child.kill(signal);
  } catch {
    // Ignore shutdown errors.
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  killChild(next);
  killChild(worker);

  setTimeout(() => {
    killChild(next, "SIGKILL");
    killChild(worker, "SIGKILL");
    process.exit(exitCode);
  }, 5000).unref();
}

async function main() {
  console.log(`[render-start] Starting WhatsApp worker on port ${workerPort}...`);
  worker = startProcess("worker", "npx", ["tsx", "scripts/whatsapp-worker.ts"]);

  await waitForPort(workerPort);
  console.log(`[render-start] Worker is ready on port ${workerPort}.`);

  console.log(`[render-start] Starting Next.js on port ${nextPort}...`);
  next = startProcess(
    "next",
    "npx",
    ["next", "start", "-p", nextPort],
    { WHATSFLOW_DISABLE_AUTOSPAWN: "1" }
  );
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

main().catch((error) => {
  console.error("[render-start] Startup failed:", error.message);
  shutdown(1);
});
