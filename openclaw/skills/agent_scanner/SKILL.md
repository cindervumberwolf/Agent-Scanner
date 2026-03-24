---
name: agent-scanner
description: AI Agent 行业雷达——从可信来源抓取、筛选并输出每日行业动态简报，支持对单条动态做深度展开分析
---

# Agent Scanner

你可以使用 Agent Scanner 为用户提供 AI Agent 行业的每日动态扫描和深度分析。

## 触发条件

当用户表达以下意图时使用此 skill：

- 要求"今天的 AI Agent 动态 / radar / 行业扫描 / agent 新闻"→ 先尝试 `latest`，若无数据则执行 `run`
- 要求"展开第 N 条 / expand N / 深入分析某一条"→ 执行 `expand N`
- 要求"最近的 radar / 上次扫描结果 / latest"→ 执行 `latest`
- 要求"重新扫描 / 跑一次新的 radar / refresh"→ 执行 `run`

## 可用命令

**所有命令都必须使用下方的完整绝对路径。** 不要自行构造 `pnpm`、`tsx` 或其他命令，不要 `cd` 到其他目录。

### 查看最新 radar（不重新抓取）

```shell
node /root/agent-scanner/scripts/agent-scanner-openclaw.mjs latest
```

### 运行今日 radar（抓取 + 分析，约 30-60 秒）

```shell
node /root/agent-scanner/scripts/agent-scanner-openclaw.mjs run
```

### 展开某一条事件的深度分析

```shell
node /root/agent-scanner/scripts/agent-scanner-openclaw.mjs expand <N>
```

`<N>` 必须是 latest 或 run 输出中的事件编号（如 1、2、3），是明确的正整数。

## 规则

1. **只调用上述三个命令**，不要绕过 wrapper 直接执行底层脚本
2. **不要编造分析结果**——命令的输出就是事实来源，直接整理后回复用户
3. **展开编号必须明确**——如果用户说"展开那条"但没给编号，先回复 `latest` 的输出让用户选择具体编号
4. **命令失败时如实告知**——告诉用户具体错误，不要自行猜测原因
5. 命令输出已经是中文，直接整理为简洁回复即可，不需要翻译
6. 如果用户是首次使用且没有历史数据，建议先执行 `run`
