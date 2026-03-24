#!/usr/bin/env node

/**
 * Agent Scanner — OpenClaw wrapper
 *
 * Allowlist-only entry point. Only three actions are permitted:
 *   run       — execute the daily radar pipeline (live RSS + real LLM)
 *   expand N  — expand event #N from the latest run
 *   latest    — print a chat-friendly summary of the most recent radar
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EVENTS_PATH = resolve(ROOT, 'data', 'events.json');

const CAT_LABEL = {
  products_launches: '产品发布',
  infra_models: '基础设施',
  commercial_signals: '商业信号',
  open_source_momentum: '开源生态',
  risks_frictions: '风险摩擦',
};

const ALLOWED_ACTIONS = ['run', 'expand', 'latest'];
const [action, ...rest] = process.argv.slice(2);

if (!action || !ALLOWED_ACTIONS.includes(action)) {
  printUsage();
  process.exit(action ? 1 : 0);
}

try {
  switch (action) {
    case 'run':     doRun(); break;
    case 'expand':  doExpand(rest[0]); break;
    case 'latest':  doLatest(); break;
  }
} catch (err) {
  console.error(`✗ 内部错误: ${err.message ?? err}`);
  process.exit(1);
}

/* ── Actions ────────────────────────────────── */

function doRun() {
  console.log('⏳ 正在运行 AI Agent Daily Radar（约 30-60 秒）…\n');
  tsx('run', '--llm', 'real');
}

function doExpand(arg) {
  const n = parseInt(arg, 10);
  if (!arg || isNaN(n) || n < 1 || n > 99 || String(n) !== arg.trim()) {
    console.error('✗ 请提供有效的事件编号（正整数 1–99），例如: expand 2');
    process.exit(1);
  }
  console.log(`⏳ 正在展开第 ${n} 条…\n`);
  tsx('expand', String(n), '--llm', 'real');
}

function doLatest() {
  if (!existsSync(EVENTS_PATH)) {
    console.log('⚠ 尚无 radar 数据。请先运行:\n  node scripts/agent-scanner-openclaw.mjs run');
    return;
  }

  let events;
  try {
    events = JSON.parse(readFileSync(EVENTS_PATH, 'utf-8'));
  } catch {
    console.error('✗ 无法解析 data/events.json');
    process.exit(1);
  }

  if (!Array.isArray(events) || events.length === 0) {
    console.log('⚠ events.json 为空。请先运行:\n  node scripts/agent-scanner-openclaw.mjs run');
    return;
  }

  const latestRunId = events[events.length - 1].runId;
  const latestEvents = events.filter(e => e.runId === latestRunId);
  const date = latestEvents[0]?.createdAt?.slice(0, 10) ?? 'unknown';

  const lines = [`📡 AI Agent Daily Radar | ${date}`, ''];
  lines.push(`共 ${latestEvents.length} 条精选动态：`, '');

  for (let i = 0; i < latestEvents.length; i++) {
    const e = latestEvents[i];
    const fact = e.fact.length > 100 ? e.fact.slice(0, 100) + '…' : e.fact;
    lines.push(`**${i + 1}. ${e.title}**`);
    lines.push(`   ${CAT_LABEL[e.category] ?? e.category} | ${e.scores.total}/20 | ${e.sourceName}`);
    lines.push(`   ${fact}`);
    const meta = [e.economicMechanism, e.signalVerdict].filter(Boolean);
    if (meta.length > 0) lines.push(`   📌 ${meta.join(' ｜ ')}`);
    lines.push('');
  }

  lines.push('💡 输入 "展开第 N 条" 查看深度分析');
  console.log(lines.join('\n'));
}

/* ── Helpers ─────────────────────────────────── */

function tsx(...args) {
  const tsxBin = resolve(ROOT, 'node_modules', '.bin', 'tsx');
  const cliEntry = resolve(ROOT, 'src', 'adapters', 'cli', 'commands.ts');

  const result = spawnSync(tsxBin, [cliEntry, ...args], {
    cwd: ROOT,
    env: { ...process.env, DEBUG_LLM: '0' },
    timeout: 600_000,
    stdio: 'inherit',
  });

  if (result.error) {
    const msg = result.error.code === 'ETIMEDOUT'
      ? '命令超时（>10 分钟）。请检查网络连接和 API 可用性。'
      : result.error.message;
    console.error(`\n✗ ${msg}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('\n✗ 命令异常退出');
    process.exit(1);
  }
}

function printUsage() {
  console.log(`Agent Scanner — OpenClaw Wrapper

用法:
  node scripts/agent-scanner-openclaw.mjs run          运行今日 radar
  node scripts/agent-scanner-openclaw.mjs expand <N>   展开第 N 条事件
  node scripts/agent-scanner-openclaw.mjs latest       查看最近一次 radar 摘要`);
}
