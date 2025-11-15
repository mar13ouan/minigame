export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const renderLog = (lines: string[]): string =>
  lines.map(line => `<div>${escapeHtml(line)}</div>`).join('');

export const wrapPanel = (className: string, content: string): string =>
  `<div class="panel ${className}">${content}</div>`;
