#!/usr/bin/env node
// A bridge between an MCP client that speaks stdio and AVOCADO, which speaks
// HTTP.
//
// This exists for one reason: some clients cannot open an HTTP transport, only
// launch a local program. Without it those clients cannot reach AVOCADO at all.
// It is deliberately thin. It adds no tools, hides no errors, and knows nothing
// about the protocol beyond "read a JSON-RPC message, pass it on, write the
// answer back". Every rule still lives on the server, where it can be enforced.
//
//   npx avocado-mcp
//   npx avocado-mcp --token <bearer>        (or AVOCADO_TOKEN in the environment)
//   npx avocado-mcp --url https://…/api/mcp (to point at staging)
//
// Reads need no token. Writes need one: get it with the two sign-in calls the
// quickstart describes, then pass it here.

import { createInterface } from "node:readline";

const DEFAULT_URL = "https://projects.avocadorh.xyz/api/mcp";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(`avocado-mcp: connects an stdio MCP client to AVOCADO.

  npx avocado-mcp [--url <endpoint>] [--token <bearer>]

  --url     AVOCADO's MCP endpoint. Default ${DEFAULT_URL}
  --token   A wallet session token. Only needed for writes.
            AVOCADO_TOKEN is read from the environment if this is not given.

Reads need nothing. To write, sign in with your wallet:
  POST /api/v1/auth/challenge {"address":"0x…"}      -> {nonce, message}
  sign the message, then
  POST /api/v1/auth/verify {"nonce","signature","delivery":"bearer"} -> {token}

Then call the quickstart tool for the rest.
`);
  process.exit(0);
}

const url = arg("url") || process.env.AVOCADO_MCP_URL || DEFAULT_URL;
const token = arg("token") || process.env.AVOCADO_TOKEN || null;

// A note on stderr: a client reads stdout for protocol messages only, so
// anything said to a human goes here or it corrupts the stream.
process.stderr.write(`avocado-mcp: ${url}${token ? " (authenticated)" : " (reads only, no token given)"}\n`);

// JSON-RPC errors carry an id when the request had one. A parse failure has no
// id, and null is the correct answer rather than a guess.
const errorFor = (id, code, message) => JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function forward(line) {
  let id = null;
  try {
    id = JSON.parse(line)?.id ?? null;
  } catch {
    return errorFor(null, -32700, "The client sent something that is not valid JSON.");
  }

  let res;
  try {
    const headers = { "content-type": "application/json", accept: "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    res = await fetch(url, { method: "POST", headers, body: line, signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    // The client is told what happened rather than being left waiting. A
    // network failure is not the same as AVOCADO refusing.
    return errorFor(id, -32000, timeout ? "AVOCADO did not answer within 30 seconds." : `Could not reach AVOCADO at ${url}.`);
  }

  // A notification gets no reply, and the server answers it with 202. This is
  // checked before the empty-body case, because a notification is *meant* to
  // have an empty body and reporting that as a fault breaks the protocol.
  if (res.status === 202) return null;
  const text = await res.text();
  if (!text) return errorFor(id, -32000, `AVOCADO answered ${res.status} with an empty body.`);
  try {
    JSON.parse(text);
  } catch {
    return errorFor(id, -32000, `AVOCADO answered ${res.status} with something that is not JSON-RPC.`);
  }
  return text;
}

// One JSON-RPC message per line, answered in the order received. Requests are
// not overlapped: an agent signing a message expects the nonce it just asked
// for, and reordering would be a confusing way to lose that.
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
let chain = Promise.resolve();

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  chain = chain.then(async () => {
    const answer = await forward(trimmed);
    if (answer !== null) process.stdout.write(answer + "\n");
  });
});

rl.on("close", () => {
  chain.finally(() => process.exit(0));
});
