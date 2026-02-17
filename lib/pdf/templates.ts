import { SharePayload } from '../../constants/types';
import { LayoutConfig } from './layouts';

export function renderCardHTML(
  share: SharePayload,
  qrData: string,
  highlightColor: string,
  layout: LayoutConfig,
  cardId: string,
  firstAddress?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const truncAddr = firstAddress
    ? `${firstAddress.slice(0, 10)}...${firstAddress.slice(-8)}`
    : '';

  return `
    <div class="card">
      <!-- HEADER -->
      <div class="header" style="background:${highlightColor};">
        <span class="header-title">${share.shareIndex} OF ${share.totalShares} SHAMIR SHARE</span>
        <span class="header-meta">TOTAL: ${share.totalShares} &middot; THRESHOLD: ${share.threshold} &middot; V2</span>
      </div>

      <!-- INSTRUCTIONS -->
      <div class="section">
        <div class="section-label">INSTRUCTIONS</div>
        <div class="instructions-row">
          <div class="instructions-text">
            <p>This card is one fragment of a secret divided using
            <b>Shamir&rsquo;s Secret Sharing</b>. By itself this card
            reveals <b>nothing</b> about the original secret.</p>
            <p>To reconstruct the secret, collect and scan
            <b>at least ${share.threshold} of the ${share.totalShares} total share cards</b>
            using the Shamir recovery app.</p>
            <p>During recovery you <u>may need to provide a PIN</u>.
            You <u>may also be asked additional questions</u> about
            your secret&rsquo;s configuration. Have this information
            available before starting recovery.</p>
            <p><b>Do not store all shares in the same location.</b>
            Each share should be kept <b>secure and separate</b>
            from the others.</p>
          </div>
          <div class="app-qr-placeholder">
            <div class="placeholder-box">
              <span>SCAN TO<br/>DOWNLOAD<br/>APP</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CREATED DATE -->
      <div class="section date-row">
        <div class="section-label">CREATED</div>
        <span class="date-value">${date}</span>
      </div>

      <!-- NOTES -->
      <div class="section notes-section">
        <div class="section-label">NOTES</div>
        <div class="note-line"></div>
        <div class="note-line"></div>
        <div class="note-line"></div>
        <div class="note-line"></div>
      </div>

      <!-- BOTTOM: Share QR + Right-side info -->
      <div class="section bottom-section">
        <div class="share-qr">
          <canvas id="qr-${cardId}" width="${layout.qrSize}" height="${layout.qrSize}"></canvas>
        </div>
        <div class="bottom-right">
          <div class="qr-info-top">
            <p>This QR code contains your encrypted share data.
            Scan it with the Shamir recovery app to begin the
            reconstruction process. You will need to scan at
            least <b>${share.threshold}&nbsp;cards</b> total.</p>
          </div>
          <div class="qr-info-bottom">
            <p><b>Handle with care.</b> If this card is lost or
            damaged you will need the remaining shares to recover
            your secret. <b>There are no backups.</b></p>
          </div>
          ${firstAddress ? `
          <div class="address-row">
            <div class="address-qr-box">
              <canvas id="addr-qr-${cardId}" width="56" height="56"></canvas>
            </div>
            <div class="address-info">
              <span class="address-label">PRIMARY ADDRESS</span>
              <span class="address-value">${escapeHTML(truncAddr)}</span>
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- FOOTER: Expanded DO NOT LOSE + GUID -->
      <div class="footer">
        <div class="footer-warning">
          &#9888; DO NOT LOSE THIS CARD &mdash; THIS IS SHARE ${share.shareIndex}
          OF ONLY ${share.totalShares}. YOU NEED AT LEAST ${share.threshold}
          SHARES TO RECOVER YOUR SECRET. LOSING TOO MANY SHARES MEANS
          PERMANENT LOSS OF ACCESS.
        </div>
        <div class="footer-guid">${share.id}</div>
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
  layout: LayoutConfig,
  firstAddress?: string
): string {
  // Each card gets its own page -- never combine cards on a single page
  const pages = shares.map((share, i) => {
    const card = renderCardHTML(
      share,
      qrDatas[i],
      highlightColor,
      layout,
      `card-${i}`,
      firstAddress
    );
    return `<div class="page">${card}</div>`;
  });

  // QR code rendering scripts for each share
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

  // Address QR scripts (same address on every card)
  const addrQrScripts = firstAddress
    ? shares
        .map(
          (_, i) => `
    new QRious({
      element: document.getElementById('addr-qr-card-${i}'),
      value: ${JSON.stringify(firstAddress)},
      size: 56,
      level: 'L'
    });
  `
        )
        .join('\n')
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
<style>
  @page { margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; font-size: 11px; line-height: 1.4; }

  .page {
    page-break-after: always;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
  }
  .page:last-child { page-break-after: auto; }

  .card {
    border: 3px solid #000;
    box-shadow: 6px 6px 0 #000;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
  }

  /* ── HEADER ── */
  .header {
    padding: 10px 16px;
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 3px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title { font-size: 16px; }
  .header-meta { font-size: 10px; letter-spacing: 1px; opacity: 0.7; }

  /* ── SECTIONS ── */
  .section {
    padding: 12px 16px;
    border-bottom: 2px solid #000;
  }
  .section-label {
    font-weight: bold;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #666;
    margin-bottom: 6px;
  }

  /* ── INSTRUCTIONS ── */
  .instructions-row {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
  .instructions-text {
    flex: 1;
    font-size: 10.5px;
    line-height: 1.5;
  }
  .instructions-text p { margin-bottom: 6px; }
  .instructions-text b { font-weight: bold; }
  .instructions-text u { text-decoration: underline; }
  .app-qr-placeholder {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .placeholder-box {
    width: 80px;
    height: 80px;
    border: 2px dashed #999;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #999;
    line-height: 1.4;
  }

  /* ── CREATED DATE ── */
  .date-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
  }
  .date-row .section-label { margin-bottom: 0; }
  .date-value {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
  }

  /* ── NOTES ── */
  .notes-section { min-height: 80px; }
  .note-line {
    border-bottom: 1px solid #ccc;
    height: 20px;
    width: 100%;
  }

  /* ── BOTTOM SECTION ── */
  .bottom-section {
    display: flex;
    flex-direction: row;
    gap: 16px;
    flex: 1;
    align-items: stretch;
  }
  .share-qr {
    border: 2px solid #000;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .bottom-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .qr-info-top, .qr-info-bottom {
    font-size: 10px;
    line-height: 1.5;
  }
  .qr-info-top { margin-bottom: 8px; }
  .qr-info-bottom { margin-bottom: 8px; }
  .qr-info-top b, .qr-info-bottom b { font-weight: bold; }

  /* ── ADDRESS ROW ── */
  .address-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-top: auto;
  }
  .address-qr-box {
    border: 1px solid #000;
    padding: 3px;
    flex-shrink: 0;
  }
  .address-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .address-label {
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
  }
  .address-value {
    font-family: 'Courier New', monospace;
    font-size: 9px;
    word-break: break-all;
  }

  /* ── FOOTER ── */
  .footer {
    padding: 10px 16px;
    border-top: 3px solid #000;
    background: #f5f5f5;
  }
  .footer-warning {
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.5;
    margin-bottom: 4px;
  }
  .footer-guid {
    font-size: 8px;
    font-family: 'Courier New', monospace;
    color: #666;
    text-align: right;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
${pages.join('\n')}
<script>
${qrScripts}
${addrQrScripts}
</script>
</body>
</html>`;
}
