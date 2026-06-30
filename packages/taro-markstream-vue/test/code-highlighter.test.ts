import { describe, expect, it } from 'vitest'
import { highlightCode } from '../src/utils/code-highlighter'

describe('highlightCode', () => {
  it('returns plain tokens for empty code', () => {
    expect(highlightCode('')).toEqual([])
  })

  it('highlights JavaScript keywords', () => {
    const tokens = highlightCode('const x = 1', 'javascript')
    expect(tokens.some(t => t.type === 'keyword' && t.content === 'const')).toBe(true)
  })

  it('highlights PascalCase as types', () => {
    const tokens = highlightCode('type User = string', 'typescript')
    expect(tokens.some(t => t.type === 'type' && t.content === 'User')).toBe(true)
  })

  it('highlights Python keywords', () => {
    const tokens = highlightCode('def foo(): return 1', 'python')
    expect(tokens.some(t => t.type === 'keyword' && t.content === 'def')).toBe(true)
    expect(tokens.some(t => t.type === 'keyword' && t.content === 'return')).toBe(true)
  })

  it('highlights function calls', () => {
    const tokens = highlightCode('foo()', 'javascript')
    expect(tokens.some(t => t.type === 'function' && t.content === 'foo')).toBe(true)
  })

  it('highlights built-in objects', () => {
    const tokens = highlightCode('console.log("hi")', 'javascript')
    expect(tokens.some(t => t.type === 'builtin' && t.content === 'console')).toBe(true)
  })

  it('highlights strings with double quotes', () => {
    const tokens = highlightCode('"hello world"', 'javascript')
    expect(tokens.some(t => t.type === 'string' && t.content === '"hello world"')).toBe(true)
  })

  it('highlights strings with single quotes', () => {
    const tokens = highlightCode("'hello'", 'javascript')
    expect(tokens.some(t => t.type === 'string' && t.content === "'hello'")).toBe(true)
  })

  it('highlights numbers', () => {
    const tokens = highlightCode('42', 'javascript')
    expect(tokens.some(t => t.type === 'number' && t.content === '42')).toBe(true)
  })

  it('highlights single-line comments', () => {
    const tokens = highlightCode('// comment', 'javascript')
    expect(tokens.some(t => t.type === 'comment' && t.content === '// comment')).toBe(true)
  })

  it('highlights multi-line comments', () => {
    const tokens = highlightCode('/* multi\nline */', 'javascript')
    expect(tokens.some(t => t.type === 'comment')).toBe(true)
  })

  it('highlights operators', () => {
    const tokens = highlightCode('a + b', 'javascript')
    expect(tokens.some(t => t.type === 'operator' && t.content === '+')).toBe(true)
  })

  it('handles unknown language as plain text', () => {
    const tokens = highlightCode('foo bar', 'unknown')
    expect(tokens.every(t => t.type === 'plain')).toBe(true)
  })

  it('handles empty language string', () => {
    const tokens = highlightCode('const x = 1', '')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('highlights HTML tags', () => {
    const tokens = highlightCode('<div class="foo">', 'html')
    expect(tokens.some(t => t.type === 'keyword' && t.content === '<div')).toBe(true)
  })

  it('highlights CSS properties', () => {
    const tokens = highlightCode('.foo { color: red; }', 'css')
    expect(tokens.length).toBeGreaterThan(0)
  })
})
