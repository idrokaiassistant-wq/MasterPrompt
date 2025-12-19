import { renderHook, act } from '@testing-library/react';
import { usePromptStore } from '@/store/promptStore';

describe('PromptStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.setInput('');
      result.current.setOutput('');
      result.current.clearHistory();
    });
  });

  it('sets input correctly', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.setInput('Test input');
    });
    expect(result.current.input).toBe('Test input');
  });

  it('sets output correctly', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.setOutput('Test output');
    });
    expect(result.current.output).toBe('Test output');
  });

  it('sets language correctly', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.setLanguage('en');
    });
    expect(result.current.language).toBe('en');
  });

  it('sets model correctly', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.setModel('openai/gpt-4o');
    });
    expect(result.current.model).toBe('openai/gpt-4o');
  });

  it('adds item to history', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.addToHistory({
        input: 'Test input',
        output: 'Test output',
        model: 'google/gemini-2.5-flash',
        language: 'uz',
      });
    });
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].input).toBe('Test input');
  });

  it('clears history', () => {
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      result.current.addToHistory({
        input: 'Test',
        output: 'Test',
        model: 'google/gemini-2.5-flash',
        language: 'uz',
      });
      result.current.clearHistory();
    });
    expect(result.current.history.length).toBe(0);
  });
});




