import { spawn } from "node:child_process";
import { mkdirSync, openSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = "/tmp/verify-expendiru";
const evidenceRoot = join(root, "artifacts/verify-expendiru");
const port = 4173;
const url = `http://127.0.0.1:${port}/`;
const serverFile = join(runtimeDir, "server.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readServer = () => {
  if (!existsSync(serverFile)) {
    return undefined;
  }

  return JSON.parse(readFileSync(serverFile, "utf8"));
};

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForHttp = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      const body = await response.text();

      if (response.ok && body.includes("Expendiru")) {
        return;
      }
    } catch {
      // Vite is still binding the port.
    }

    await sleep(250);
  }

  throw new Error(`Vite did not become ready at ${url}`);
};

const launch = async () => {
  const existing = readServer();

  if (existing !== undefined && alive(existing.pid)) {
    throw new Error(`verify server already running as pid ${existing.pid}`);
  }

  mkdirSync(runtimeDir, { recursive: true });
  const logPath = join(runtimeDir, "vite.log");
  const logFd = openSync(logPath, "w");
  const child = spawn(
    process.execPath,
    [join(root, "packages/frontend/node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: join(root, "packages/frontend"),
      detached: true,
      stdio: ["ignore", logFd, logFd],
    },
  );

  child.unref();
  writeFileSync(
    serverFile,
    JSON.stringify({ pid: child.pid, port, url, log: logPath }, null, 2),
  );
  await waitForHttp();
  console.log(`ready ${url} pid ${child.pid}`);
};

const doctor = async () => {
  const server = readServer();

  if (server === undefined) {
    throw new Error("no verify server. run launch first");
  }

  if (!alive(server.pid)) {
    throw new Error(`verify pid ${server.pid} is not running`);
  }

  if (server.port !== port || server.url !== url) {
    throw new Error(`verify server file does not own ${url}`);
  }

  const response = await fetch(url);
  const body = await response.text();

  if (!response.ok || !body.includes("<title>Expendiru</title>")) {
    throw new Error(`GET ${url} did not serve the fixture shell`);
  }

  console.log(`doctor ok ${url} pid ${server.pid} fixture shell`);
};

const connectChrome = async (chrome) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9223/json/list");

      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === "page");

        if (page !== undefined) {
          return page;
        }
      }
    } catch {
      // Chrome is still starting.
    }

    if (chrome.exitCode !== null) {
      throw new Error("Chrome exited before the debug port opened");
    }

    await sleep(150);
  }

  throw new Error("Chrome debug port did not open");
};

const drivePieSelect = async () => {
  await doctor();
  mkdirSync(join(evidenceRoot, "pie-select"), { recursive: true });
  const profile = join(runtimeDir, "chrome-profile");
  rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--user-data-dir=${profile}`,
      "--remote-debugging-port=9223",
      "--window-size=390,844",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  writeFileSync(join(runtimeDir, "chrome.pid"), String(chrome.pid));

  try {
    const page = await connectChrome(chrome);
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    let nextId = 0;
    const pending = new Map();

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const waiter = pending.get(message.id);

      if (waiter !== undefined) {
        pending.delete(message.id);
        waiter(message);
      }
    });
    await new Promise((resolve) => socket.addEventListener("open", resolve));

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = nextId;
        nextId += 1;
        pending.set(id, (message) => {
          if (message.error !== undefined) {
            reject(new Error(`${method}: ${JSON.stringify(message.error)}`));
            return;
          }

          resolve(message.result);
        });
        socket.send(JSON.stringify({ id, method, params }));
      });

    const evaluate = async (expression) => {
      const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });

      if (result.exceptionDetails !== undefined) {
        throw new Error(JSON.stringify(result.exceptionDetails));
      }

      return result.result.value;
    };

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    await send("Page.navigate", { url });
    await evaluate(`new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (document.body?.innerText.includes("6 transactions") || Date.now() - started > 8000) {
          resolve(true);
          return;
        }
        setTimeout(tick, 40);
      };
      tick();
    })`);

    const shot = async (name) => {
      const image = await send("Page.captureScreenshot", { format: "png" });
      const path = join(evidenceRoot, "pie-select", name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, Buffer.from(image.data, "base64"));
      return path;
    };

    await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Pie")?.click()`);
    await sleep(200);
    await evaluate(`document.querySelector("[data-chart-surface='pie']")?.scrollIntoView({ block: "center" })`);
    await sleep(100);
    const beforeScroll = await evaluate("window.scrollY");
    const beforeShot = await shot("before.png");
    const points = await evaluate(`(() => {
      const svg = document.querySelector('[aria-label="Spending by bucket"]');
      const rect = svg.getBoundingClientRect();
      const found = [];
      for (let y = rect.top + 8; y < rect.bottom - 8; y += 10) {
        for (let x = rect.left + 8; x < rect.right - 8; x += 10) {
          const hit = document.elementFromPoint(x, y);
          const label = hit instanceof Element ? hit.getAttribute("aria-label") : null;
          if (label !== null && label.startsWith("Show ") && !found.some((item) => item.label === label)) {
            found.push({ x, y, label });
          }
        }
      }
      return found;
    })()`);

    if (!Array.isArray(points) || points.length < 2) {
      throw new Error(`expected at least two pie slices, found ${JSON.stringify(points)}`);
    }

    const touch = async (point) => {
      await send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: point.x, y: point.y }],
      });
      await send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x + 2, y: point.y + 2 }],
      });
      await send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await sleep(200);
    };

    const first = points.find((point) => point.label === "Show Household") ?? points[0];
    const second = points.find((point) => point.label !== first.label) ?? points[1];
    await touch(first);
    const afterFirstScroll = await evaluate("window.scrollY");
    const afterFirstText = await evaluate("document.body.innerText");
    const afterFirstShot = await shot("after-first.png");
    await touch(second);
    const afterSecondScroll = await evaluate("window.scrollY");
    const afterSecondText = await evaluate("document.body.innerText");
    const afterSecondShot = await shot("after-second.png");
    const edges = await evaluate(`({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    })`);
    const result = {
      feature: "pie-select",
      url,
      viewport: { width: 390, height: 844 },
      beforeScroll,
      afterFirstScroll,
      afterSecondScroll,
      first: first.label,
      second: second.label,
      filtered: afterFirstText.includes("1 transaction"),
      changedAgain: afterSecondText !== afterFirstText,
      edges,
      shots: [beforeShot, afterFirstShot, afterSecondShot],
    };
    writeFileSync(join(evidenceRoot, "pie-select", "result.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));

    const scrollHeld =
      Math.abs(afterFirstScroll - beforeScroll) <= 1 &&
      Math.abs(afterSecondScroll - beforeScroll) <= 1;

    if (!scrollHeld || !result.filtered || !result.changedAgain || edges.scrollWidth > edges.clientWidth + 1) {
      throw new Error("pie-select failed");
    }

    await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Clear selection")?.click()`);
    await sleep(100);
    await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Line")?.click()`);
    await sleep(250);
    await evaluate(`document.querySelector('[aria-label="Spending by month"]')?.scrollIntoView({ block: "center" })`);
    await sleep(150);
    await shot("../stacked-area/line.png");
    await evaluate(`document.querySelector("table")?.scrollIntoView({ block: "start" })`);
    await sleep(150);
    await shot("../transaction-pages/table.png");

    socket.close();
  } finally {
    chrome.kill();
    rmSync(join(runtimeDir, "chrome.pid"), { force: true });
  }
};

const cleanup = () => {
  const chromePidPath = join(runtimeDir, "chrome.pid");

  if (existsSync(chromePidPath)) {
    const pid = Number(readFileSync(chromePidPath, "utf8"));

    if (Number.isInteger(pid) && alive(pid)) {
      process.kill(pid);
    }
  }

  const server = readServer();

  if (server !== undefined && alive(server.pid)) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      process.kill(server.pid, "SIGTERM");
    }
  }

  rmSync(runtimeDir, { recursive: true, force: true });
  console.log(`cleaned runtime state; evidence remains in ${evidenceRoot}`);
};

const command = process.argv[2];

try {
  if (command === "launch") {
    await launch();
  } else if (command === "doctor") {
    await doctor();
  } else if (command === "drive") {
    if (process.argv[3] !== "pie-select") {
      throw new Error("drive currently proves pie-select");
    }

    await drivePieSelect();
  } else if (command === "cleanup") {
    cleanup();
  } else {
    throw new Error("use launch, doctor, drive pie-select, or cleanup");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
