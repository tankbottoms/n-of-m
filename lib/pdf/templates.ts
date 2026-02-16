import { SharePayload } from '../../constants/types';
import { LayoutConfig } from './layouts';

export function renderCardHTML(
  share: SharePayload,
  qrData: string,
  highlightColor: string,
  layout: LayoutConfig,
  cardId: string
): string {
  const date = new Date().toISOString().split('T')[0];

  return `
    <div class="card" style="width:${layout.cardWidth};height:${layout.cardHeight};">
      <div class="header" style="background:${highlightColor};">
        SHAMIR SHARE ${share.shareIndex}/${share.totalShares}
      </div>
      <div class="body">
        <div class="qr">
          <canvas id="qr-${cardId}" width="${layout.qrSize}" height="${layout.qrSize}"></canvas>
        </div>
        <div class="meta">
          <p><strong>Name:</strong> ${escapeHTML(share.name)}</p>
          <p><strong>Threshold:</strong> ${share.threshold} of ${share.totalShares}</p>
          <p><strong>Created:</strong> ${date}</p>
          <p><strong>Path:</strong> ${share.pathType}</p>
          <p><strong>Words:</strong> ${share.wordCount}</p>
          <p><strong>PIN:</strong> ${share.hasPIN ? 'Required' : 'None'}</p>
        </div>
      </div>
      <div class="footer">
        shamir v1 | share ${share.shareIndex} of ${share.totalShares} | DO NOT LOSE
      </div>
    </div>
  `;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderPageHTML(
  shares: SharePayload[],
  qrDatas: string[],
  highlightColor: string,
  layout: LayoutConfig
): string {
  const cards = shares.map((share, i) =>
    renderCardHTML(share, qrDatas[i], highlightColor, layout, `card-${i}`)
  );

  // Generate QR code rendering scripts for each card
  const qrScripts = shares
    .map(
      (_, i) => `
    new QRious({
      element: document.getElementById('qr-card-${i}'),
      value: ${JSON.stringify(qrDatas[i])},
      size: ${layout.qrSize},
      level: 'M'
    });
  `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
<style>
  @page { margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; }
  .page { page-break-after: always; display: flex; flex-wrap: wrap; gap: 8px; }
  .page:last-child { page-break-after: auto; }
  .card {
    border: 3px solid #000;
    box-shadow: 6px 6px 0 #000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }
  .header {
    padding: 10px 16px;
    font-weight: bold;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 3px solid #000;
  }
  .body {
    display: flex;
    flex-direction: row;
    padding: 16px;
    flex: 1;
    gap: 16px;
  }
  .qr {
    border: 2px solid #000;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }
  .meta p { line-height: 1.4; }
  .footer {
    padding: 8px 16px;
    border-top: 3px solid #000;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: #f5f5f5;
  }
</style>
</head>
<body>
<div class="page">
  ${cards.join('\n')}
</div>
<script>
${qrScripts}
</script>
</body>
</html>`;
}
