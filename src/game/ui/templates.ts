export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const renderLog = (lines: string[]): string =>
  lines.map(line => `<div>${escapeHtml(line)}</div>`).join('');

export const wrapPanel = (className: string, content: string): string =>
  `<div class="panel ${className}">${content}</div>`;

export const renderHungerBar = (current: number, max: number): string => {
  const percentage = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  return `
    <div class="stat-line">
      <span>Faim</span>
      <div class="bar"><div style="width:${percentage}%"></div></div>
      <span>${current}/${max}</span>
    </div>
  `;
};

export const renderInventory = (entries: { label: string; quantity: number; description: string }[]): string =>
  entries
    .map(
      entry => `
        <div class="inventory-row">
          <div>
            <strong>${escapeHtml(entry.label)}</strong>
            <div class="muted">${escapeHtml(entry.description)}</div>
          </div>
          <span>x${entry.quantity}</span>
        </div>
      `
    )
    .join('');

export const renderQuestList = (entries: { title: string; status: string; description: string }[]): string =>
  entries
    .map(
      entry => `
        <div class="quest-row quest-${escapeHtml(entry.status)}">
          <strong>${escapeHtml(entry.title)}</strong>
          <div class="muted">${escapeHtml(entry.description)}</div>
        </div>
      `
    )
    .join('');
