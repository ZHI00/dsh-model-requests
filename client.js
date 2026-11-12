/**
 * dsh-model-requests — browser half.
 *
 * Registers a `conversation.view` tab right after Trajectory. The view is a pure
 * projection over the Trajectory snapshot the Conversation shell already
 * assembles for its View entries (`useTrajectory` standard prop): it lists every
 * model request with its provider/model, decode throughput, overall speed, TTFT,
 * wall time and token usage, and expands one row into full detail.
 *
 * Only React from the browser module table is required; the UI is written with
 * createElement and its own stylesheet so it stays a single plain-JS file.
 */
window.__ModuleLoader__.load({
  id: 'dsh-model-requests',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { Fragment, useCallback, useEffect, useMemo, useState } = React;

    const NS = 'model-requests';

    const DICTS = {
      zh: {
        'view.label': '请求',
        'title': '模型请求',
        'subtitle': '每次模型调用的模型、速度与用量',
        'col.model': '模型',
        'col.throughput': '吞吐量',
        'col.throughput.hint': '输出 token ÷（消息完成时间 − 首 token 时间），与 Harness 内置统计口径一致',
        'col.ttft': '首 token',
        'col.ttft.hint': '从 Step 开始到首个非空 token，包含请求准备时间；与内置统计口径一致',
        'throughput.short': '解码窗口或输出样本过短（< 200 ms 或 < 8 token），不计算吞吐量',
        'throughput.missing': '没有可用的 token 用量或时间',
        'col.duration': '耗时',
        'col.tokens': 'Tokens（入 / 出）',
        'col.status': '状态',
        'status.running': '进行中',
        'status.complete': '完成',
        'status.error': '失败',
        'status.unknown': '未知',
        'chip.requests': '请求',
        'chip.running': '进行中',
        'chip.avgThroughput': '平均吞吐',
        'chip.output': '输出',
        'chip.errors': '失败',
        'section.timing': '用时',
        'section.usage': '用量',
        'section.request': '请求',
        'detail.provider': '提供方',
        'detail.model': '模型',
        'detail.reasoning': '推理强度',
        'detail.temperature': '温度',
        'detail.maxTokens': '最大输出',
        'detail.started': '开始时间',
        'detail.duration': '总耗时',
        'detail.ttft': '首 token 延迟',
        'detail.decode': '解码耗时',
        'detail.throughput': '吞吐量',
        'detail.turnStep': '轮次 / 步',
        'detail.seq': '事件序号',
        'detail.purpose': '类型',
        'detail.purpose.assistant': '对话',
        'detail.purpose.compaction': '上下文压缩',
        'detail.input': '输入',
        'detail.output': '输出',
        'detail.cacheRead': '缓存读',
        'detail.cacheWrite': '缓存写',
        'detail.reasoningTokens': '推理',
        'detail.total': '合计',
        'detail.retry': '重试',
        'detail.retryValue': '{count} 次，间隔 {delay}',
        'detail.error': '错误',
        'detail.none': '—',
        'detail.note': '吞吐量 = 输出 token ÷（消息完成时间 − 首 token 时间），与内置输出速度口径一致。',
        'detail.note.retry': '该请求发生过重试，吞吐量分母包含重试等待，数值会偏低。',
        'unit.tps': '{value} tok/s',
        'unit.seconds': '{value} s',
        'unit.ms': '{value} ms',
        'empty.title': '还没有模型请求',
        'empty.hint': '本页读取会话的轨迹数据。发出第一条消息后，这里会列出每次调用的模型、吞吐量与用量。',
        'unavailable.title': '暂时读不到轨迹数据',
        'unavailable.hint': '本页依赖“轨迹”视图提供的数据源。启用“轨迹”后重新选择此页签即可。',
        'loadOlder': '加载更早的请求',
        'loadingOlder': '正在加载…',
        'tag.compaction': '压缩'
      },
      en: {
        'view.label': 'Requests',
        'title': 'Model requests',
        'subtitle': 'Model, speed, and usage for each model call',
        'col.model': 'Model',
        'col.throughput': 'Throughput',
        'col.throughput.hint': 'Output tokens ÷ (message commit time − first token time); the same definition as the built-in statistics',
        'col.ttft': 'TTFT',
        'col.ttft.hint': 'From Step start to the first non-empty token, including request preparation; matches the built-in statistics',
        'throughput.short': 'Decode window or output sample too short (< 200 ms or < 8 tokens) to measure throughput',
        'throughput.missing': 'No token usage or timing recorded',
        'col.duration': 'Duration',
        'col.tokens': 'Tokens (in / out)',
        'col.status': 'Status',
        'status.running': 'Running',
        'status.complete': 'Done',
        'status.error': 'Failed',
        'status.unknown': 'Unknown',
        'chip.requests': 'Requests',
        'chip.running': 'Running',
        'chip.avgThroughput': 'Avg throughput',
        'chip.output': 'Output',
        'chip.errors': 'Failed',
        'section.timing': 'Timing',
        'section.usage': 'Usage',
        'section.request': 'Request',
        'detail.provider': 'Provider',
        'detail.model': 'Model',
        'detail.reasoning': 'Reasoning',
        'detail.temperature': 'Temperature',
        'detail.maxTokens': 'Max output',
        'detail.started': 'Started',
        'detail.duration': 'Duration',
        'detail.ttft': 'First token',
        'detail.decode': 'Decode time',
        'detail.throughput': 'Throughput',
        'detail.turnStep': 'Turn / step',
        'detail.seq': 'Event seq',
        'detail.purpose': 'Kind',
        'detail.purpose.assistant': 'Conversation',
        'detail.purpose.compaction': 'Compaction',
        'detail.input': 'Input',
        'detail.output': 'Output',
        'detail.cacheRead': 'Cache read',
        'detail.cacheWrite': 'Cache write',
        'detail.reasoningTokens': 'Reasoning',
        'detail.total': 'Total',
        'detail.retry': 'Retry',
        'detail.retryValue': '{count} times, {delay} apart',
        'detail.error': 'Error',
        'detail.none': '—',
        'detail.note': '吞吐量 = 输出 token ÷（消息完成时间 − 首 token 时间），与内置输出速度口径一致。',
        'detail.note.retry': '该请求发生过重试，吞吐量分母包含重试等待，数值会偏低。',
        'unit.tps': '{value} tok/s',
        'unit.seconds': '{value} s',
        'unit.ms': '{value} ms',
        'empty.title': 'No model requests yet',
        'empty.hint': 'This tab reads the session trajectory data. Send the first message and every model call shows up here with its model, throughput, and usage.',
        'unavailable.title': 'Trajectory data is unavailable',
        'unavailable.hint': 'This tab relies on the data source provided by the Trajectory view. Enable Trajectory, then select this tab again.',
        'loadOlder': 'Load older requests',
        'loadingOlder': 'Loading…',
        'tag.compaction': 'Compact'
      }
    };

    /** A throughput reading needs a window long enough that provider chunk batching cannot dominate it. */
    const MEASURABLE_DECODE_MS = 200;
    const MEASURABLE_TOKENS = 8;

    const EMPTY_SNAPSHOT = { requests: [], eventNodes: [] };
    const SELECT_ALL = (value) => value;
    const useEmptySnapshot = (selector) => selector(EMPTY_SNAPSHOT);
    const fallbackT = (key) => key;

    const CSS = `
.mr-root{width:100%;min-height:100%;box-sizing:border-box;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45}
.mr-head{flex:none;display:flex;flex-direction:column;gap:9px;padding:14px 16px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);box-sizing:border-box}
.mr-title-row{display:flex;align-items:baseline;gap:9px;min-width:0}
.mr-title{font-size:13.5px;font-weight:600;letter-spacing:.01em;white-space:nowrap}
.mr-sub{min-width:0;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-stats{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
.mr-chip{display:inline-flex;align-items:baseline;gap:5px;height:24px;padding:0 8px;box-sizing:border-box;border-radius:7px;background:var(--dsw-alias-bg-layer-2);font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.mr-chip b{font-weight:600;font-size:12px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.mr-chip[data-tone="running"] b{color:var(--dsw-alias-brand-primary)}
.mr-chip[data-tone="error"] b{color:var(--dsw-alias-state-error-primary)}
.mr-scroll{flex:none;min-height:0;padding:0 16px 16px;box-sizing:border-box;container-type:inline-size}
.mr-thead,.mr-row{display:grid;grid-template-columns:44px minmax(0,1.5fr) 92px 84px 84px minmax(0,.9fr) 76px;gap:10px;align-items:center}
.mr-thead{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-1);padding:8px 10px 6px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));letter-spacing:.02em}
.mr-thead span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr-list{display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}
.mr-item{min-width:0;border:1px solid transparent;border-radius:10px;content-visibility:auto;contain-intrinsic-size:auto 44px}
.mr-item[data-open="1"]{border-color:var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.mr-row{width:100%;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;padding:8px 10px;cursor:pointer;appearance:none;box-sizing:border-box;transition:background .12s ease}
.mr-row:hover{background:var(--dsw-alias-bg-layer-2)}
.mr-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.mr-item[data-open="1"] .mr-row:hover{background:var(--dsw-alias-bg-layer-2)}
.mr-num{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-variant-numeric:tabular-nums;white-space:nowrap}
.mr-model{min-width:0;display:flex;flex-direction:column;gap:1px}
.mr-model b{min-width:0;font-weight:600;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-model span{min-width:0;font-size:10.5px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-metric{min-width:0;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-metric[data-empty="1"]{color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.mr-metric em{font-style:normal;font-size:10px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));margin-left:2px}
.mr-status{display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.mr-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
.mr-dot[data-state="running"]{background:var(--dsw-alias-brand-primary);animation:mr-pulse 1.2s ease-in-out infinite}
.mr-dot[data-state="error"]{background:var(--dsw-alias-state-error-primary)}
.mr-dot[data-state="unknown"]{background:var(--dsw-alias-state-idle-primary)}
@keyframes mr-pulse{0%,100%{opacity:.3}50%{opacity:1}}
.mr-detail{display:flex;flex-direction:column;gap:10px;padding:2px 10px 12px;border-top:1px solid var(--dsw-alias-border-l1);margin-top:2px}
.mr-section{display:flex;flex-direction:column;gap:6px;padding-top:8px;min-width:0}
.mr-section-title{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));margin:0}
.mr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:6px;min-width:0}
.mr-field{min-width:0;padding:7px 9px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.mr-field dt{font-size:10.5px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-field dd{margin:2px 0 0;font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mr-field dd[data-empty="1"]{color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.mr-error{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);font-size:11.5px;overflow-wrap:anywhere}
.mr-note{margin:0;font-size:11px;line-height:1.55;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.mr-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:64px 20px;text-align:center;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.mr-empty b{font-size:13px;color:var(--dsw-alias-label-primary);font-weight:600}
.mr-empty span{max-width:420px;font-size:12px;line-height:1.55}
.mr-more-row{display:flex;justify-content:center;padding:10px 0 2px}
.mr-more{height:26px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer}
.mr-more:hover:not([disabled]){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.mr-more:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.mr-more[disabled]{opacity:.6;cursor:default}
@container (max-width:700px){
.mr-thead,.mr-row{grid-template-columns:38px minmax(0,1.4fr) 82px 78px 76px 70px}
.mr-col-tokens{display:none}
}
@container (max-width:520px){
.mr-thead,.mr-row{grid-template-columns:32px minmax(0,1fr) 76px 72px 64px}
.mr-col-ttft{display:none}
}
`;

    function isRecord(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function toNumber(value) {
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }

    function toText(value) {
      return typeof value === 'string' && value !== '' ? value : null;
    }

    function compactNumber(value) {
      if (value === null) return null;
      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}k`;
      return String(Math.round(value));
    }

    function clockTime(timestamp) {
      if (timestamp === null) return null;
      const date = new Date(timestamp);
      const pad = (value) => String(value).padStart(2, '0');
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function formatDuration(t, milliseconds) {
      if (milliseconds === null) return null;
      if (milliseconds < 1000) return t('unit.ms', { value: Math.round(milliseconds) });
      return t('unit.seconds', { value: (milliseconds / 1000).toFixed(milliseconds < 10000 ? 2 : 1) });
    }

    function formatSpeed(t, tokensPerSecond) {
      if (tokensPerSecond === null) return null;
      return t('unit.tps', { value: tokensPerSecond.toFixed(1) });
    }

    function hasRunningRequest(snapshot) {
      const requests = isRecord(snapshot) && Array.isArray(snapshot.requests) ? snapshot.requests : [];
      return requests.some((request) => isRecord(request) && request.status === 'running');
    }

    /** Project one Trajectory request entry plus its Assistant node into a row. */
    function toRow(request, node, number, now) {
      const config = isRecord(request.requestConfig) ? request.requestConfig : null;
      const metadata = isRecord(request.providerMetadata) ? request.providerMetadata : null;
      const nodeMetadata = isRecord(node) && isRecord(node.providerMetadata) ? node.providerMetadata : null;
      const usage = isRecord(request.usage) ? request.usage : isRecord(node) && isRecord(node.usage) ? node.usage : null;
      const timing = isRecord(node) && isRecord(node.timing) ? node.timing : null;
      const startedAt = toNumber(request.startedAt);
      const completedAt = toNumber(request.completedAt) ?? (isRecord(node) ? toNumber(node.time) : null);
      const stepStart = toNumber(timing && timing.stepStartTime) ?? startedAt;
      const firstToken = toNumber(timing && timing.firstTokenTime);
      const inputTokens = toNumber(usage && usage.inputTokens);
      const outputTokens = toNumber(usage && usage.outputTokens);
      const totalTokens = toNumber(usage && usage.totalTokens)
        ?? (inputTokens !== null || outputTokens !== null ? (inputTokens ?? 0) + (outputTokens ?? 0) : null);
      const status = request.status === 'running' || request.status === 'complete' || request.status === 'error'
        ? request.status
        : 'unknown';
      const running = status === 'running';
      const durationMs = startedAt !== null && completedAt !== null
        ? Math.max(0, completedAt - startedAt)
        : running && startedAt !== null
          ? Math.max(0, now - startedAt)
          : null;
      const ttftMs = firstToken !== null && stepStart !== null ? Math.max(0, firstToken - stepStart) : null;
      const decodeMs = firstToken !== null && completedAt !== null ? Math.max(0, completedAt - firstToken) : null;
      let decodeTps = null;
      let throughputNote = 'throughput.missing';
      if (decodeMs !== null && outputTokens !== null) {
        if (decodeMs >= MEASURABLE_DECODE_MS && outputTokens >= MEASURABLE_TOKENS) {
          decodeTps = outputTokens / (decodeMs / 1000);
          throughputNote = 'col.throughput.hint';
        } else {
          throughputNote = 'throughput.short';
        }
      }
      return {
        key: String(request.startSeq ?? number),
        number,
        seq: toNumber(request.startSeq),
        turn: toNumber(request.turn),
        step: toNumber(request.step),
        purpose: request.purpose === 'compaction' ? 'compaction' : 'assistant',
        status,
        running,
        provider: toText(metadata && metadata.provider) ?? toText(config && config.provider) ?? toText(nodeMetadata && nodeMetadata.provider),
        model: toText(metadata && metadata.model) ?? toText(config && config.model) ?? toText(nodeMetadata && nodeMetadata.model),
        startedAt,
        completedAt,
        durationMs,
        ttftMs,
        decodeMs,
        decodeTps,
        throughputNote,
        inputTokens,
        outputTokens,
        totalTokens,
        cacheReadTokens: toNumber(usage && usage.cacheReadTokens),
        cacheWriteTokens: toNumber(usage && usage.cacheWriteTokens),
        reasoningTokens: toNumber(usage && usage.reasoningTokens),
        reasoningEffort: toText(config && config.reasoningEffort),
        temperature: toNumber(config && config.temperature),
        maxTokens: toNumber(config && config.maxTokens),
        retry: toNumber(request.retry),
        maxRetries: toNumber(request.maxRetries),
        retryDelayMs: toNumber(request.retryDelayMs),
        error: toText(request.error),
        errorCode: toText(request.errorCode)
      };
    }

    /** Rows newest-first, numbered in chronological order. */
    function buildRows(snapshot, now) {
      if (!isRecord(snapshot)) return [];
      const nodes = Array.isArray(snapshot.eventNodes) ? snapshot.eventNodes : [];
      const assistantByStep = new Map();
      for (const node of nodes) {
        if (!isRecord(node) || node.kind !== 'assistant') continue;
        if (typeof node.turn !== 'number' || typeof node.step !== 'number') continue;
        assistantByStep.set(`${node.turn}:${node.step}`, node);
      }
      const requests = Array.isArray(snapshot.requests) ? snapshot.requests : [];
      const ordered = requests
        .filter((request) => isRecord(request))
        .slice()
        .sort((left, right) => (toNumber(left.startSeq) ?? 0) - (toNumber(right.startSeq) ?? 0));
      const rows = ordered.map((request, index) => toRow(
        request,
        assistantByStep.get(`${request.turn}:${request.step}`),
        index + 1,
        now
      ));
      return rows.reverse();
    }

    function summarize(t, rows) {
      let running = 0;
      let errors = 0;
      let output = null;
      let decodeTokens = null;
      let decodeMs = null;
      for (const row of rows) {
        if (row.running) running += 1;
        if (row.status === 'error') errors += 1;
        if (row.outputTokens !== null) output = (output ?? 0) + row.outputTokens;
        if (row.decodeTps !== null && row.outputTokens !== null && row.decodeMs !== null) {
          decodeTokens = (decodeTokens ?? 0) + row.outputTokens;
          decodeMs = (decodeMs ?? 0) + row.decodeMs;
        }
      }
      const averageTps = decodeTokens !== null && decodeMs !== null && decodeMs > 0 ? decodeTokens / (decodeMs / 1000) : null;
      return { total: rows.length, running, errors, output, averageTps, averageLabel: formatSpeed(t, averageTps) };
    }

    function Chip({ label, value, tone }) {
      return h('span', { className: 'mr-chip', 'data-tone': tone }, h('span', null, label), h('b', null, value));
    }

    function Field({ label, value }) {
      const empty = value === null || value === undefined || value === '';
      return h('div', { className: 'mr-field' },
        h('dt', null, label),
        h('dd', { 'data-empty': empty ? '1' : '0', title: empty ? undefined : String(value) }, empty ? '—' : value)
      );
    }

    function Section({ title, children }) {
      return h('section', { className: 'mr-section' },
        h('h4', { className: 'mr-section-title' }, title),
        h('dl', { className: 'mr-grid' }, children)
      );
    }

    function Detail({ row, t }) {
      const tokens = (value) => (value === null ? null : compactNumber(value));
      const retryDelay = row.retryDelayMs === null ? null : formatDuration(t, row.retryDelayMs);
      return h('div', { className: 'mr-detail' },
        h(Section, { title: t('section.timing') },
          h(Field, { label: t('detail.started'), value: clockTime(row.startedAt) }),
          h(Field, { label: t('detail.duration'), value: formatDuration(t, row.durationMs) }),
          h(Field, { label: t('detail.ttft'), value: formatDuration(t, row.ttftMs) }),
          h(Field, { label: t('detail.decode'), value: formatDuration(t, row.decodeMs) }),
          h(Field, { label: t('detail.throughput'), value: formatSpeed(t, row.decodeTps) })
        ),
        h(Section, { title: t('section.usage') },
          h(Field, { label: t('detail.input'), value: tokens(row.inputTokens) }),
          h(Field, { label: t('detail.output'), value: tokens(row.outputTokens) }),
          h(Field, { label: t('detail.cacheRead'), value: tokens(row.cacheReadTokens) }),
          h(Field, { label: t('detail.cacheWrite'), value: tokens(row.cacheWriteTokens) }),
          h(Field, { label: t('detail.reasoningTokens'), value: tokens(row.reasoningTokens) }),
          h(Field, { label: t('detail.total'), value: tokens(row.totalTokens) })
        ),
        h(Section, { title: t('section.request') },
          h(Field, { label: t('detail.provider'), value: row.provider }),
          h(Field, { label: t('detail.model'), value: row.model }),
          h(Field, { label: t('detail.reasoning'), value: row.reasoningEffort }),
          h(Field, { label: t('detail.temperature'), value: row.temperature }),
          h(Field, { label: t('detail.maxTokens'), value: row.maxTokens }),
          h(Field, { label: t('detail.purpose'), value: t(row.purpose === 'compaction' ? 'detail.purpose.compaction' : 'detail.purpose.assistant') }),
          h(Field, { label: t('detail.turnStep'), value: row.turn === null || row.step === null ? null : `${row.turn} / ${row.step}` }),
          h(Field, { label: t('detail.seq'), value: row.seq })
        ),
        h('p', { className: 'mr-note' }, t('detail.note')),
        row.retry !== null
          ? h('p', { className: 'mr-note' }, t('detail.note.retry'))
          : null,
        row.retry !== null
          ? h(Field, {
              label: t('detail.retry'),
              value: t('detail.retryValue', {
                count: row.retry,
                delay: retryDelay ?? t('detail.none')
              })
            })
          : null,
        row.error !== null
          ? h('div', { className: 'mr-error' },
              h('b', null, t('detail.error')),
              h('span', null, row.errorCode === null ? row.error : `${row.errorCode}: ${row.error}`)
            )
          : null
      );
    }

    function RequestItem({ row, open, onToggle, t }) {
      const model = row.model ?? t('detail.none');
      const provider = row.provider ?? t('detail.none');
      const throughput = formatSpeed(t, row.decodeTps);
      const ttft = formatDuration(t, row.ttftMs);
      const duration = formatDuration(t, row.durationMs);
      const tokens = row.inputTokens === null && row.outputTokens === null
        ? null
        : `${compactNumber(row.inputTokens ?? 0)} / ${compactNumber(row.outputTokens ?? 0)}`;
      return h('li', { className: 'mr-item', 'data-open': open ? '1' : '0' },
        h('button', {
          type: 'button',
          className: 'mr-row',
          'aria-expanded': open ? 'true' : 'false',
          onClick: () => onToggle(row.key)
        },
          h('span', { className: 'mr-num' }, `#${row.number}`),
          h('span', { className: 'mr-model' },
            h('b', { title: row.model ?? '' }, model),
            h('span', { title: row.provider ?? '' },
              row.purpose === 'compaction' ? `${provider} · ${t('tag.compaction')}` : provider
            )
          ),
          h('span', { className: 'mr-metric mr-col-throughput', 'data-empty': throughput === null ? '1' : '0', title: t(row.throughputNote) }, throughput ?? '—'),
          h('span', { className: 'mr-metric mr-col-ttft', 'data-empty': ttft === null ? '1' : '0' }, ttft ?? '—'),
          h('span', { className: 'mr-metric mr-col-duration', 'data-empty': duration === null ? '1' : '0' }, duration ?? '—'),
          h('span', { className: 'mr-metric mr-col-tokens', 'data-empty': tokens === null ? '1' : '0' }, tokens ?? '—'),
          h('span', { className: 'mr-status' },
            h('i', { className: 'mr-dot', 'data-state': row.status }),
            h('span', null, t(`status.${row.status}`))
          )
        ),
        open ? h(Detail, { row, t }) : null
      );
    }

    function EmptyState({ t, unavailable }) {
      return h('div', { className: 'mr-empty' },
        h('b', null, t(unavailable ? 'unavailable.title' : 'empty.title')),
        h('span', null, t(unavailable ? 'unavailable.hint' : 'empty.hint'))
      );
    }

    function ModelRequestsView(props) {
      const t = typeof props.t === 'function'
        ? props.t
        : typeof props.fallbackT === 'function'
          ? props.fallbackT
          : fallbackT;
      const available = typeof props.useTrajectory === 'function';
      const useSnapshot = available ? props.useTrajectory : useEmptySnapshot;
      const snapshot = useSnapshot(SELECT_ALL);
      const useSession = props.useSession;
      const hasMore = typeof useSession === 'function' ? useSession((value) => value.hasMore === true) : false;
      const olderLoading = typeof useSession === 'function' ? useSession((value) => value.loadingOlder === true) : false;

      const [now, setNow] = useState(() => Date.now());
      const live = available && hasRunningRequest(snapshot);
      useEffect(() => {
        if (!live) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
      }, [live]);

      const rows = useMemo(() => (available ? buildRows(snapshot, now) : []), [available, snapshot, now]);
      const summary = useMemo(() => summarize(t, rows), [rows, t]);

      const [openKey, setOpenKey] = useState(null);
      const toggle = useCallback((key) => {
        setOpenKey((current) => (current === key ? null : key));
      }, []);

      if (!available) {
        return h('div', { className: 'mr-root' }, h('style', null, CSS), h(EmptyState, { t, unavailable: true }));
      }

      return h('div', { className: 'mr-root' },
        h('style', null, CSS),
        h('div', { className: 'mr-head' },
          h('div', { className: 'mr-title-row' },
            h('span', { className: 'mr-title' }, t('title')),
            h('span', { className: 'mr-sub' }, t('subtitle'))
          ),
          h('div', { className: 'mr-stats' },
            h(Chip, { label: t('chip.requests'), value: String(summary.total) }),
            summary.running > 0 ? h(Chip, { label: t('chip.running'), value: String(summary.running), tone: 'running' }) : null,
            summary.averageLabel !== null
              ? h(Chip, { label: t('chip.avgThroughput'), value: summary.averageLabel })
              : null,
            summary.output !== null
              ? h(Chip, { label: t('chip.output'), value: compactNumber(summary.output) })
              : null,
            summary.errors > 0 ? h(Chip, { label: t('chip.errors'), value: String(summary.errors), tone: 'error' }) : null
          )
        ),
        h('div', { className: 'mr-scroll' },
          rows.length === 0
            ? h(EmptyState, { t })
            : h(Fragment, null,
                h('div', { className: 'mr-thead' },
                  h('span', null, '#'),
                  h('span', null, t('col.model')),
                  h('span', { className: 'mr-col-throughput', title: t('col.throughput.hint') }, t('col.throughput')),
                  h('span', { className: 'mr-col-ttft', title: t('col.ttft.hint') }, t('col.ttft')),
                  h('span', { className: 'mr-col-duration' }, t('col.duration')),
                  h('span', { className: 'mr-col-tokens' }, t('col.tokens')),
                  h('span', { className: 'mr-col-status' }, t('col.status'))
                ),
                h('ul', { className: 'mr-list' },
                  rows.map((row) => h(RequestItem, {
                    key: row.key,
                    row,
                    open: openKey === row.key,
                    onToggle: toggle,
                    t
                  }))
                )
              ),
          rows.length > 0 && hasMore
            ? h('div', { className: 'mr-more-row' },
                h('button', {
                  type: 'button',
                  className: 'mr-more',
                  disabled: olderLoading,
                  onClick: () => {
                    void props.loadOlder?.();
                  }
                }, olderLoading ? t('loadingOlder') : t('loadOlder'))
              )
            : null
        )
      );
    }

    return {
      name: 'dsh-model-requests',
      inject: ['slots', 'locale', 'sessions'],
      apply(ctx) {
        const translate = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'model-requests: dictionaries');
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'model-requests',
          order: 20,
          locale: NS,
          label: () => translate('view.label'),
          inject: (sessionId) => ({
            fallbackT: translate,
            loadOlder: async () => {
              const session = ctx.sessions.binding(sessionId)?.session;
              if (session === undefined) return;
              await session.loadOlder();
            }
          })
        }, ModelRequestsView));
      }
    };
  }
});
