export interface HighlightToken {
  type: string
  content: string
}

const KEYWORDS: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import',
    'export', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof',
    'instanceof', 'in', 'of', 'yield', 'delete', 'void', 'with', 'debugger',
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'implements',
    'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw',
    'typeof', 'instanceof', 'in', 'of', 'yield', 'delete', 'void', 'with', 'debugger',
    'interface', 'type', 'enum', 'as', 'readonly', 'public', 'private', 'protected',
    'abstract', 'static', 'declare', 'module', 'namespace', 'keyof', 'infer',
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'string', 'number', 'boolean', 'any', 'void', 'never', 'unknown', 'object',
    'bigint', 'symbol', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit',
    'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Promise',
  ],
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
    'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield',
    'lambda', 'pass', 'global', 'nonlocal', 'del', 'assert', 'print',
    'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'self', 'cls',
    'async', 'await', 'match', 'case', 'range', 'len', 'int', 'str', 'list', 'dict',
    'set', 'tuple', 'bool', 'float', 'super',
  ],
  shell: [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'in',
    'esac', 'function', 'return', 'export', 'local', 'echo', 'exit', 'source', 'shift',
    'select', 'until', 'continue', 'break', 'trap', 'exec', 'read', 'set', 'unset',
    'declare', 'typeset',
  ],
  css: [
    'import', 'media', 'keyframes', 'font-face', 'supports', 'charset', 'namespace',
    'include', 'mixin', 'extend', 'function', 'return', 'if', 'else', 'for', 'while',
    'each',
  ],
}

const BUILTINS: Record<string, string[]> = {
  javascript: [
    'console', 'Math', 'JSON', 'RegExp', 'Date', 'Array', 'Object', 'String',
    'Number', 'Boolean', 'Map', 'Set', 'Promise', 'Symbol', 'Error', 'TypeError',
    'RangeError', 'ReferenceError', 'SyntaxError', 'setTimeout', 'setInterval',
    'clearTimeout', 'clearInterval', 'fetch', 'parseInt', 'parseFloat', 'isNaN',
    'isFinite', 'decodeURI', 'encodeURI', 'decodeURIComponent', 'encodeURIComponent',
    'document', 'window', 'global', 'process', 'Buffer',
  ],
  python: [
    'print', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple',
    'bool', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr', 'open', 'super',
    'map', 'filter', 'zip', 'enumerate', 'sorted', 'reversed', 'abs', 'max', 'min',
    'sum', 'round', 'any', 'all', 'ord', 'chr', 'repr', 'input',
  ],
}

function getBuiltins(lang: string): string[] {
  const normalized = lang.toLowerCase()
  if (normalized === 'typescript') return [...(BUILTINS.javascript || []), ...(BUILTINS.typescript || [])]
  return BUILTINS[normalized] || BUILTINS.javascript || []
}

function getKeywords(lang: string): string[] {
  const normalized = lang.toLowerCase()
  if (normalized === 'typescript') return [...(KEYWORDS.javascript || []), ...(KEYWORDS.typescript || [])]
  if (normalized === 'html') return []
  if (normalized === 'json') return []
  return KEYWORDS[normalized] || KEYWORDS.javascript || []
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightCode(code: string, language?: string): HighlightToken[] {
  const lang = (language || '').toLowerCase()
  const tokens: HighlightToken[] = []
  const keywords = getKeywords(lang)
  const builtins = getBuiltins(lang)
  const keywordSet = new Set(keywords)
  const builtinSet = new Set(builtins)

  const keywordPattern = keywords.length > 0
    ? new RegExp('^(' + keywords.map(escapeRegex).sort((a, b) => b.length - a.length).join('|') + ')\\b')
    : null

  let pos = 0
  const len = code.length

  while (pos < len) {
    const remaining = code.slice(pos)

    const singleComment = remaining.match(/^\/\/[^\n]*/)
    if (singleComment) {
      tokens.push({ type: 'comment', content: singleComment[0] })
      pos += singleComment[0].length
      continue
    }

    const multiComment = remaining.match(/^\/\*[\s\S]*?\*\//)
    if (multiComment) {
      tokens.push({ type: 'comment', content: multiComment[0] })
      pos += multiComment[0].length
      continue
    }

    const pythonComment = remaining.match(/^#[^\n]*/)
    if (pythonComment && (lang === 'python' || lang === 'shell')) {
      tokens.push({ type: 'comment', content: pythonComment[0] })
      pos += pythonComment[0].length
      continue
    }

    const backtickStr = remaining.match(/^`[^`]*`/)
    if (backtickStr) {
      tokens.push({ type: 'string', content: backtickStr[0] })
      pos += backtickStr[0].length
      continue
    }

    const templateLiteral = remaining.match(/^`[\s\S]*?`/)
    if (templateLiteral) {
      tokens.push({ type: 'string', content: templateLiteral[0] })
      pos += templateLiteral[0].length
      continue
    }

    const dblStr = remaining.match(/^"(?:[^"\\]|\\.)*"/)
    if (dblStr) {
      tokens.push({ type: 'string', content: dblStr[0] })
      pos += dblStr[0].length
      continue
    }

    const sglStr = remaining.match(/^'(?:[^'\\]|\\.)*'/)
    if (sglStr) {
      tokens.push({ type: 'string', content: sglStr[0] })
      pos += sglStr[0].length
      continue
    }

    const regexLit = remaining.match(/^\/(?:[^\/\\\n]|\\.)+\/[gimsuyd]*/)
    if (regexLit && (lang === 'javascript' || lang === 'typescript')) {
      tokens.push({ type: 'string', content: regexLit[0] })
      pos += regexLit[0].length
      continue
    }

    const number = remaining.match(/^\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d*\.?\d+(?:[eE][+-]?\d+)?)\b/)
    if (number) {
      tokens.push({ type: 'number', content: number[0] })
      pos += number[0].length
      continue
    }

    const functionMatch = remaining.match(/^([a-zA-Z_$][\w$]*)\s*\(/)
    if (functionMatch) {
      const name = functionMatch[1]
      if (keywordSet.has(name)) {
        tokens.push({ type: 'keyword', content: name })
      } else if (builtinSet.has(name)) {
        tokens.push({ type: 'builtin', content: name })
      } else {
        tokens.push({ type: 'function', content: name })
      }
      pos += name.length
      continue
    }

    const identMatch = remaining.match(/^[a-zA-Z_$][\w$]*/)
    if (identMatch) {
      const name = identMatch[0]
      if (keywordSet.has(name)) {
        tokens.push({ type: 'keyword', content: name })
      } else if (builtinSet.has(name)) {
        tokens.push({ type: 'builtin', content: name })
      } else if (name.length >= 2 && name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()) {
        tokens.push({ type: 'type', content: name })
      } else {
        tokens.push({ type: 'plain', content: name })
      }
      pos += name.length
      continue
    }

    if (lang === 'html' || lang === 'xml') {
      const tag = remaining.match(/^<\/?[a-zA-Z][a-zA-Z0-9]*\b/)
      if (tag) {
        tokens.push({ type: 'keyword', content: tag[0] })
        pos += tag[0].length
        continue
      }
      const attr = remaining.match(/^[a-zA-Z-]+(?=\s*=)/)
      if (attr) {
        tokens.push({ type: 'type', content: attr[0] })
        pos += attr[0].length
        continue
      }
    }

    if (lang === 'css') {
      const prop = remaining.match(/^[a-z-]+(?=\s*:)/i)
      if (prop) {
        tokens.push({ type: 'type', content: prop[0] })
        pos += prop[0].length
        continue
      }
      const pseudo = remaining.match(/^::?[a-zA-Z-]+/)
      if (pseudo) {
        tokens.push({ type: 'keyword', content: pseudo[0] })
        pos += pseudo[0].length
        continue
      }
      const unit = remaining.match(/^[.#][a-zA-Z-]+/)
      if (unit) {
        tokens.push({ type: 'constant', content: unit[0] })
        pos += unit[0].length
        continue
      }
      const atRule = remaining.match(/^@[a-zA-Z-]+/)
      if (atRule) {
        tokens.push({ type: 'keyword', content: atRule[0] })
        pos += atRule[0].length
        continue
      }
      const cssValue = remaining.match(/^(#[0-9a-fA-F]{3,8}|rgba?\s*\(|hsla?\s*\()/)
      if (cssValue) {
        tokens.push({ type: 'constant', content: cssValue[0] })
        pos += cssValue[0].length
        continue
      }
    }

    const operator = remaining.match(/^[+\-*/%&|^~!<>=]=?|=>|\+\+|--|&&|\|\||\?\?|\.{3}|::|->/)
    if (operator) {
      tokens.push({ type: 'operator', content: operator[0] })
      pos += operator[0].length
      continue
    }

    const punct = remaining.match(/^[{}()\[\];:.,?@\\]/)
    if (punct) {
      tokens.push({ type: 'punctuation', content: punct[0] })
      pos += punct[0].length
      continue
    }

    tokens.push({ type: 'plain', content: remaining[0] })
    pos += 1
  }

  return tokens
}