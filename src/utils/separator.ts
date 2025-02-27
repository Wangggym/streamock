export function unescapeSeparator(str: string): string {
  return str.replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\v/g, '\v')
            .replace(/\\f/g, '\f')
            .replace(/\\u000B/g, '\v')
            .replace(/\\u000C/g, '\f')
            .replace(/\\u2028/g, '\u2028')
            .replace(/\\u2029/g, '\u2029')
            .replace(/\\u200B/g, '\u200B')
            .replace(/\\uFEFF/g, '\uFEFF')
            .replace(/\\u200D/g, '\u200D')
            .replace(/\\u00AD/g, '\u00AD');
} 