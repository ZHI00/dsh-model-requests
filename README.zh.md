# dsh-model-requests

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的会话页签行里，于**轨迹**之后新增一个**请求**页：把每一次模型调用列成一张表——模型、吞吐量、TTFT、耗时、Token 用量——点开任意一行即可查看完整详情。

页签行因此变成 `对话 / 轨迹 / 请求 / ⋯`。

> English documentation: [README.md](README.md)

## 功能

- **请求账本**：一次模型调用一行，包含序号、模型（含提供方）、解码吞吐量、首 token 延迟、总耗时、Token（入 / 出）与状态。
- **点击看详情**：展开后分为「用时」「用量」「请求」三组——开始时间、总耗时、TTFT、解码耗时、吞吐量；输入 / 输出 / 缓存读 / 缓存写 / 推理 / 合计 Token；提供方、模型、推理强度、温度、最大输出、轮次 / 步、事件序号。失败请求显示错误码与信息，含重试的请求会单独注明。
- **表头吸顶**：滚动会话时列名固定在顶部。
- **实时**：进行中的请求带脉冲状态点，耗时按秒刷新。
- **原生观感**：只使用 `--dsw-alias-*` 主题 token，适配深浅色；中英文案；窄栏下用容器查询自动收起次要列。
- **零额外请求**：直接投影 Conversation shell 已经组装好的轨迹快照。

## 环境要求

- 带内置“轨迹”视图的 DeepSeek Harness（标准 Web profile）。
- 仅开发校验需要 Node.js >= 20；Client 模块本身无需构建，只 `require("react")`。

## 安装

```bash
git clone https://github.com/ZHI00/dsh-model-requests.git
```

在 DSH 会话中（Agent 侧）：

```
plugin_manager install_bundle  →  target: /absolute/path/to/dsh-model-requests
```

`install_bundle` 会把该目录链接进当前 profile；bundle 的 `cordis.patch.yml` 负责挂载（空的）宿主半，`dsh.client` 段落把 `client.js` 作为浏览器模块提供。打开任意会话，页签行就会在「轨迹」之后出现「请求」。

## 数据与口径

视图通过 `useTrajectory` 标准属性读取 Trajectory 已经发布的快照，不自行订阅或重算会话事件。

| 字段 | 定义 |
| --- | --- |
| 吞吐量 | `输出 token ÷（assistant/message 时间 − 首个非空 token 时间）` |
| TTFT | `首个非空 token 时间 − step/start 时间` |
| 耗时 | `assistant/message 时间 − step/start 时间` |
| Token | provider 上报的 `usage`（输入、输出、缓存读、缓存写、推理） |

### 准确性说明

- 吞吐量公式与内置 `sessionStats`（编辑器下方的“输出速度”）**完全一致**。终点取消息落库时间，包含 provider 的 `usage`/`finish` 收尾与提交开销，因此比“首 token → 最后 token”的纯生成窗口略低。
- 用真实会话日志核实（124 次响应、101,606 个输出 token）：该窗口为 **146.6 tok/s**，纯 token 窗口为 **156.8 tok/s**，整段会话偏保守约 6–7%。单条响应上，长回答（解码 ≥ 1 s）平均低约 10%，短回答（< 1 s）平均低约 29%，因为固定收尾开销占比更高。
- provider 会把参数 chunk 成批投递，`dt` 可能被压成 0，极短的工具调用会算出 1,000–25,000 tok/s 的无效值。插件对「解码窗口 < 200 ms」或「输出 < 8 token」的行**不显示吞吐量**，汇总平均值也只统计有效样本；内置统计不做这个过滤。
- TTFT 与内置统计、轨迹同口径：从 `step/start` 起算，包含请求准备时间，不等同于 provider 侧的纯网络首字延迟。
- 含重试的请求，首 token 可能来自失败的尝试、usage 来自最终尝试，吞吐量分母包含重试等待，数值偏低；详情中会注明。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `index.js` | 宿主半，刻意留空；能力全在浏览器半 |
| `client.js` | 浏览器半：注册 `conversation.view` 页签并渲染请求列表 |
| `cordis.patch.yml` | Bundle patch，插入宿主插件行 |
| `locale/*.json` | 插件管理页显示的标题与描述 |
| `icon.svg` | 插件图标 |
| `README.md` | 英文文档 |

## 开发

无需构建或安装依赖。`client.js` 是纯 JavaScript 的 `window.__ModuleLoader__` 模块：

```bash
node --check client.js
node --check index.js
```

在 `link:` 安装下修改 `client.js` 后，需要重启该 bundle（在插件管理里禁用再启用）让 Client 模块图读取新的字节。

## 许可证

MIT © 2026 ZHI00
