# dsh-model-requests

A **Requests** tab for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that lists every model call in a conversation — model, throughput, TTFT, duration, token usage — with full details one click away.

It registers a `conversation.view` entry right after **Trajectory**, so the tab row becomes `Chat / Trajectory / Requests / ⋯`.

> 中文说明见 [README.zh.md](README.zh.md)。

## Features

- **Request ledger** — one row per model call: index, start time, model (with provider), decode throughput, TTFT, wall time, input/output tokens, status.
- **Click for details** — timing (start, duration, TTFT, decode time, throughput), token usage (input, output, cache read/write, reasoning, total) and request controls (provider, model, reasoning effort, temperature, max output, turn/step, event seq). Failed requests show the error code and message; retried requests are called out.
- **Pinned table header** — column names stay visible while the conversation scrolls.
- **Live** — running requests carry a pulsing status dot and their elapsed time ticks once per second.
- **Native look** — only `--dsw-alias-*` theme tokens, light/dark aware, localized in English and Chinese, responsive via container queries (secondary columns fold away in narrow panes).
- **No extra requests** — the view projects the Trajectory snapshot the Conversation shell already assembles.

## Requirements

- DeepSeek Harness with the shipped Trajectory view (the standard Web profile).
- Node.js >= 20 for tooling; the Client module itself needs no build step and only `require("react")`.

## Install

Clone the repository, then install the package directory as a DSH bundle:

```bash
git clone https://github.com/ZHI00/dsh-model-requests.git
```

In a DSH session (Agent side):

```
plugin_manager install_bundle  →  target: /absolute/path/to/dsh-model-requests
```

`install_bundle` links the directory into the current profile; the bundle's `cordis.patch.yml` mounts the (empty) Host half and the `dsh.client` section serves `client.js` to the Web UI. Open any conversation and the **Requests** tab appears after **Trajectory**.

## How the numbers are computed

The view reads the same snapshot Trajectory publishes through the `useTrajectory` standard hook, so it neither subscribes to nor re-folds session events.

| Field | Definition |
| --- | --- |
| Time | Step start time in the local timezone; today shows `HH:MM:SS`, other days `MM-DD HH:MM` (full timestamp on hover) |
| Throughput | `outputTokens ÷ (assistant/message time − first non-empty token time)` |
| TTFT | `first non-empty token time − step/start time` |
| Duration | `assistant/message time − step/start time` |
| Tokens | Provider-reported `usage` (input, output, cache read/write, reasoning) |

### Accuracy notes

- The throughput formula is **identical to the built-in `sessionStats` output speed** (the reading under the composer). Its end point is the message commit time, which includes the provider's final `usage`/`finish` chunks and commit overhead, so it is slightly **lower** than a token-to-token generation rate.
- Verified against a real session log (124 responses, 101,606 output tokens): this window reports **146.6 tok/s** vs **156.8 tok/s** for the token-to-token window, about 6–7% conservative overall. Per response, long replies (decode >= 1 s) read ~10% lower and short replies (< 1 s) ~29% lower, because the fixed finalization tail weighs more there.
- Provider chunk batching can compress token timestamps into a few milliseconds; a few very short tool-call responses would otherwise show 1,000–25,000 tok/s. The view therefore **omits throughput** when the decode window is < 200 ms or the output is < 8 tokens, and the average only uses measurable samples. The built-in statistics do not apply this filter.
- TTFT follows the same definition as the built-in statistics and Trajectory: it starts at `step/start`, so it includes request preparation and is not a pure network first-byte latency.
- A request that retried keeps the first token of an earlier attempt while usage comes from the final attempt; its throughput includes the retry wait and reads low. The detail panel says so.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.js` | Host half — intentionally empty; all behavior lives in the browser half |
| `client.js` | Client module: registers the `conversation.view` tab and renders the ledger |
| `cordis.patch.yml` | Bundle patch that inserts the Host row |
| `locale/*.json` | Title and description shown by the plugin manager |
| `icon.svg` | Plugin icon |
| `README.zh.md` | Chinese documentation |

## Development

No build, bundler, or npm dependency is involved. `client.js` is a plain `window.__ModuleLoader__` module:

```bash
node --check client.js
node --check index.js
```

After editing `client.js` in a linked install, restart the bundle (disable/enable it from the plugin manager) so the Client module graph picks up the new bytes.

## License

MIT © 2026 ZHI00
