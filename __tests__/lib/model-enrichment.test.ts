import { inferModelMetadata, checkCompleteness } from '@/lib/model-enrichment'

describe('inferModelMetadata', () => {
  test('infers llama model metadata', () => {
    const m = inferModelMetadata('llama3.2:3b')
    expect(m.family).toBe('llama')
    expect(m.parameter_size).toBe('3B')
    expect(m.max_tokens).toBe(2048)
    expect(m.cost_estimate).toBe('cheap')
    expect(m.description).toContain('Meta Llama')
  })

  test('infers mistral model metadata', () => {
    const m = inferModelMetadata('mistral:7b')
    expect(m.family).toBe('mistral')
    expect(m.parameter_size).toBe('7B')
    expect(m.max_tokens).toBe(4096)
    expect(m.cost_estimate).toBe('medium')
  })

  test('infers phi model metadata from mini form', () => {
    const m = inferModelMetadata('phi4-mini')
    expect(m.family).toBe('phi')
    expect(m.description).toContain('Microsoft Phi')
  })

  test('returns unknown for unrecognized model', () => {
    const m = inferModelMetadata('some-random-model')
    expect(m.family).toBe('unknown')
  })
})

describe('checkCompleteness', () => {
  test('flags missing fields', () => {
    const preset = {
      description: 'Has description',
      context_window: null,
      max_tokens: 1024,
      parameter_size: '7B',
      cost_estimate: null,
    }
    const missing = checkCompleteness(preset)
    expect(missing).toContain('context_window')
    expect(missing).toContain('cost_estimate')
    expect(missing).not.toContain('description')
  })
})
