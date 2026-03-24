# Agent Scanner × OpenClaw 集成指南

本文档说明如何将 Agent Scanner 作为一个 skill 接入你的 OpenClaw 实例。

## 前置条件

| 项目 | 要求 |
|------|------|
| OpenClaw | 已安装并可运行 `openclaw status` |
| Agent Scanner | 已完成 `pnpm install`，`pnpm radar:run --mock` 可用 |
| `.env` | 已配置 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL` |

## 方式一：Copy（推荐）

```bash
# 假设 agent-scanner 运行时在 ~/agent-scanner（Linux 原生 FS）
mkdir -p ~/.openclaw/skills/agent_scanner
cp ~/agent-scanner/openclaw/skills/agent_scanner/SKILL.md \
   ~/.openclaw/skills/agent_scanner/SKILL.md
```

> 注意：SKILL.md 更新后需要重新复制。

## 方式二：Symlink

```bash
mkdir -p ~/.openclaw/skills
ln -s ~/agent-scanner/openclaw/skills/agent_scanner ~/.openclaw/skills/agent_scanner
```

> 注意：OpenClaw 会校验 symlink 目标路径，如果目标在 `~/.openclaw/` 外部可能被跳过。
> 出现 "Skipping skill path that resolves outside its configured root" 时请改用方式一。

## 验证 Skill 已加载

```bash
openclaw skills list
```

在输出中应能看到 `agent-scanner` 及其描述。

如果看不到，检查：
1. SKILL.md 文件路径是否正确
2. OpenClaw 是否需要重启 gateway：`openclaw gateway restart`
3. Skill 是否被 allowlist 阻止：`openclaw doctor` 查看 Skills 状态

## 测试

### 1. 直接测试 wrapper（不需要 OpenClaw）

```bash
cd ~/agent-scanner

# 查看帮助
node scripts/agent-scanner-openclaw.mjs

# 运行 radar（需要网络 + LLM API）
node scripts/agent-scanner-openclaw.mjs run

# 查看最新结果
node scripts/agent-scanner-openclaw.mjs latest

# 展开第 2 条
node scripts/agent-scanner-openclaw.mjs expand 2
```

### 2. 通过 OpenClaw 测试

```bash
# 启动 gateway（如果尚未运行）
cd ~/clawtest && npx openclaw gateway start

# 发送测试消息
npx openclaw agent --message "给我今天的 AI Agent radar"
npx openclaw agent --message "展开第 1 条"
npx openclaw agent --message "最近一次 radar 结果"
```

## Demo 流程

演示时按这个顺序操作，约 2 分钟可走完：

1. `node scripts/agent-scanner-openclaw.mjs run` — 展示完整 pipeline
2. `node scripts/agent-scanner-openclaw.mjs latest` — 展示摘要回顾
3. `node scripts/agent-scanner-openclaw.mjs expand 1` — 展示深度分析
4. 打开 `data/events.json` — 证明有状态沉淀
5. （可选）通过 OpenClaw 对话触发同一能力 — 证明可被 agent 调用

## 可选：独立 Agent 配置

如果希望 scanner 作为独立 agent 运行（隔离于主 agent），可以创建专用 agent：

```bash
# 创建一个名为 scanner 的独立 agent
openclaw agent create scanner

# 只为 scanner agent 挂载这个 skill
openclaw config set agents.scanner.skills '["agent-scanner"]'
```

这是可选的高级配置，MVP 阶段不需要。

## 文件结构

```
agent-scanner/
├── scripts/
│   └── agent-scanner-openclaw.mjs   ← 安全 wrapper（唯一执行入口）
└── openclaw/
    ├── README.md                     ← 本文档
    └── skills/
        └── agent_scanner/
            └── SKILL.md              ← OpenClaw skill 定义
```
