/**
 * Automated Verification Script for AG AI Provider & Orchestrator (Phase 1)
 */

import { buildEnrichedSystemPrompt, handleAiChatRequest } from '../src/lib/ai/aiOrchestrator.js'
import { resolveApiKeys } from '../src/lib/ai/aiConfig.js'

async function runTests() {
  console.log('🧪 Starting Phase 1 AI Provider & Orchestrator Tests...\n')
  let passed = 0
  let failed = 0

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`)
      failed++
    }
  }

  // Test 1: Config and Persona Prompt
  console.log('--- Test 1: System Prompt Enrichment ---')
  const enrichedPrompt = buildEnrichedSystemPrompt({
    customPrompt: 'Focus on 48x24 PGVT tiles.',
    context: {
      currentRoute: '/leads',
      staff: { name: 'Ramesh Kumar', role: 'Sales Executive' },
      currentLead: { name: 'Karthik', location: 'Velur Road, Tiruchengode' }
    }
  })

  assert('Enriched prompt includes showroom persona', enrichedPrompt.includes('AG TRADERS') && enrichedPrompt.includes('Tiruchengode'))
  assert('Enriched prompt includes route context', enrichedPrompt.includes('/leads') && enrichedPrompt.includes('Page Guidance (Leads)'))
  assert('Enriched prompt includes staff details', enrichedPrompt.includes('Ramesh Kumar'))
  assert('Enriched prompt includes active lead data', enrichedPrompt.includes('Karthik') && enrichedPrompt.includes('Velur Road'))
  assert('Enriched prompt includes custom developer prompt', enrichedPrompt.includes('Focus on 48x24 PGVT tiles.'))

  // Test 2: Key Resolution
  console.log('\n--- Test 2: Key Resolution ---')
  const keysFromHeaders = resolveApiKeys({
    headers: { 'x-gemini-key': 'test_gemini_key', 'x-mistral-key': 'test_mistral_key' }
  })
  assert('Resolves Gemini key from headers', keysFromHeaders.geminiKey === 'test_gemini_key')
  assert('Resolves Mistral key from headers', keysFromHeaders.mistralKey === 'test_mistral_key')

  // Test 3: No keys provided error handling
  console.log('\n--- Test 3: Error Handling (No Keys) ---')
  const noKeyResult = await handleAiChatRequest({
    messages: [{ role: 'user', content: 'Hello' }],
    headers: {},
    body: {}
  })
  assert('Fails gracefully when no API keys are configured', noKeyResult.success === false)
  assert('Returns NO_KEYS_AVAILABLE error code', noKeyResult.code === 'NO_KEYS_AVAILABLE')

  // Test 4: Empty messages validation
  console.log('\n--- Test 4: Empty Messages Validation ---')
  const emptyResult = await handleAiChatRequest({
    messages: [],
    headers: { 'x-gemini-key': 'dummy' },
    body: {}
  })
  assert('Fails when messages array is empty', emptyResult.success === false)
  assert('Returns EMPTY_MESSAGES error code', emptyResult.code === 'EMPTY_MESSAGES')

  // Test 5: Fallback trigger when Gemini fails (invalid key) & Mistral is invoked
  console.log('\n--- Test 5: Multi-Provider Fallback Routing ---')
  const fallbackAttempt = await handleAiChatRequest({
    messages: [{ role: 'user', content: 'Test ping' }],
    headers: {
      'x-gemini-key': 'invalid_gemini_key_for_testing',
      'x-mistral-key': 'invalid_mistral_key_for_testing'
    }
  })
  assert('Recognizes invalid keys properly without crashing', fallbackAttempt.success === false)
  assert('Produces clean error message', typeof fallbackAttempt.error === 'string' && fallbackAttempt.error.length > 0)

  console.log(`\n========================================`)
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
