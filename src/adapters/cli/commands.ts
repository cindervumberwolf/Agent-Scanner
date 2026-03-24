import { Command } from 'commander';
import { loadEnv } from '../../config/env.js';
import { createProvider } from '../../llm/factory.js';
import { runDailyRadar, runExpandEvent } from '../../core/pipeline.js';

const program = new Command();

program
  .name('agent-scanner')
  .description('AI Agent Industry Radar — research-grade daily intelligence')
  .version('0.1.0');

program
  .command('run')
  .description('Run the daily radar pipeline')
  .option('--mock', 'Use mock data instead of live sources', false)
  .option('--llm <mode>', 'LLM analyser: mock | real (default: env LLM_MODE or mock)')
  .action(async (opts: { mock: boolean; llm?: string }) => {
    try {
      const env = loadEnv(opts.llm);
      const provider = createProvider(env);
      const result = await runDailyRadar(provider, opts.mock);

      console.log('═'.repeat(60));
      console.log(result.markdown);
      console.log('═'.repeat(60));
      console.log(`\n✓ ${result.events.length} events saved to data/events.json`);
      console.log(`✓ Radar markdown saved to ${result.runFilePath}`);
      console.log(`✓ Run ID: ${result.runId}\n`);
    } catch (err) {
      console.error('✗ Radar run failed:', err);
      process.exit(1);
    }
  });

program
  .command('expand')
  .description('Expand analysis on a specific event')
  .argument('<query>', 'Event index (1-based) or event ID')
  .option('--llm <mode>', 'LLM analyser: mock | real (default: env LLM_MODE or mock)')
  .action(async (query: string, opts: { llm?: string }) => {
    try {
      const env = loadEnv(opts.llm);
      const provider = createProvider(env);
      const result = await runExpandEvent(query, provider);

      console.log('═'.repeat(60));
      console.log(result.markdown);
      console.log('═'.repeat(60));
      console.log(`\n✓ Expanded analysis saved to ${result.filePath}\n`);
    } catch (err) {
      console.error('✗ Expand failed:', err);
      process.exit(1);
    }
  });

program.parse(process.argv);
