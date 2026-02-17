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
  const now = new Date();
  const date = now.toISOString().replace('T', ' ').slice(0, 16);
  const truncAddr = firstAddress
    ? `${firstAddress.slice(0, 10)}...${firstAddress.slice(-8)}`
    : '';

  const pinInfo = share.hasPIN ? 'PIN: ENABLED' : 'PIN: NONE';
  const ppInfo = share.hasPassphrase ? 'PASSPHRASE: ENABLED' : 'PASSPHRASE: NONE';

  return `
    <div class="card">
      <!-- HEADER -->
      <div class="header" style="background:${highlightColor};">
        <span class="header-title">${share.shareIndex}/${share.totalShares} SHAMIR</span>
        <span class="header-meta">T:${share.threshold} &middot; ${share.wordCount}W &middot; V2</span>
      </div>

      <!-- INSTRUCTIONS -->
      <div class="section">
        <div class="section-label">INSTRUCTIONS</div>
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

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-warning">
          &#9888; DO NOT LOSE THIS CARD &mdash; SHARE ${share.shareIndex}
          OF ${share.totalShares}. NEED ${share.threshold}+ TO RECOVER.
        </div>
        <div class="footer-info">${pinInfo} &middot; ${ppInfo}</div>
        <div class="footer-guid">${share.id}</div>
      </div>
    </div>
  `;
}

export function renderSingleCardHTML(
  share: SharePayload,
  highlightColor: string,
  layout: LayoutConfig,
  firstAddress?: string
): string {
  const qrData = JSON.stringify(share);
  const cardId = 'single-0';
  const card = renderCardHTML(share, qrData, highlightColor, layout, cardId, firstAddress);

  const addrQrScript = firstAddress
    ? `new QRious({
      element: document.getElementById('addr-qr-${cardId}'),
      value: ${JSON.stringify(firstAddress)},
      size: 56,
      level: 'L'
    });`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; font-size: ${layout.fontSize}px; line-height: 1.4; padding: 4px; background: #fff; }
  .card { border: 3px solid #000; box-shadow: 4px 4px 0 #000; display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .header { padding: 6px 10px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #000; display: flex; justify-content: space-between; align-items: center; }
  .header-title { font-size: 12px; }
  .header-meta { font-size: 8px; letter-spacing: 0.5px; opacity: 0.7; }
  .section { padding: 8px 10px; border-bottom: 2px solid #000; }
  .section-label { font-weight: bold; font-size: 7px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px; }
  .instructions-text { font-size: 8px; line-height: 1.4; }
  .instructions-text p { margin-bottom: 4px; }
  .date-row { display: flex; flex-direction: row; align-items: center; gap: 8px; padding: 6px 10px; }
  .date-row .section-label { margin-bottom: 0; }
  .date-value { font-family: 'Courier New', monospace; font-size: 9px; font-weight: bold; }
  .notes-section { min-height: 50px; }
  .note-line { border-bottom: 1px solid #ccc; height: 14px; width: 100%; }
  .bottom-section { display: flex; flex-direction: row; gap: 10px; flex: 1; align-items: stretch; }
  .share-qr { border: 2px solid #000; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .share-qr canvas { display: block; width: 100%; height: auto; }
  .bottom-right { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .qr-info-top, .qr-info-bottom { font-size: 8px; line-height: 1.4; }
  .qr-info-top { margin-bottom: 4px; }
  .qr-info-bottom { margin-bottom: 4px; }
  .address-row { display: flex; flex-direction: row; align-items: center; gap: 6px; margin-top: auto; }
  .address-qr-box { border: 1px solid #000; padding: 2px; flex-shrink: 0; }
  .address-info { display: flex; flex-direction: column; gap: 1px; }
  .address-label { font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; }
  .address-value { font-family: 'Courier New', monospace; font-size: 8px; word-break: break-all; }
  .footer { padding: 6px 10px; border-top: 3px solid #000; background: #f5f5f5; }
  .footer-warning { font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4; margin-bottom: 2px; }
  .footer-info { font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 2px; }
  .footer-guid { font-size: 7px; font-family: 'Courier New', monospace; color: #666; text-align: right; letter-spacing: 0.5px; }
</style>
</head>
<body>
${card}
<script>
new QRious({
  element: document.getElementById('qr-${cardId}'),
  value: ${JSON.stringify(qrData)},
  size: ${layout.qrSize},
  level: 'M'
});
${addrQrScript}
<\/script>
</body>
</html>`;
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
  // Wallet-size: all cards on one continuous page
  // Compact: 2 cards per page
  // Full-page: 1 card per page
  let pages: string[];

  if (layout.cardsPerPage >= 999) {
    // Wallet-size: all on one page, no page breaks
    const cards = shares.map((share, i) =>
      renderCardHTML(share, qrDatas[i], highlightColor, layout, `card-${i}`, firstAddress)
    ).join('\n<div style="height:12px;"></div>\n');
    pages = [`<div class="page wallet-page">${cards}</div>`];
  } else if (layout.cardsPerPage === 2) {
    // Compact: 2 cards per page
    pages = [];
    for (let i = 0; i < shares.length; i += 2) {
      const card1 = renderCardHTML(shares[i], qrDatas[i], highlightColor, layout, `card-${i}`, firstAddress);
      const card2 = i + 1 < shares.length
        ? renderCardHTML(shares[i + 1], qrDatas[i + 1], highlightColor, layout, `card-${i + 1}`, firstAddress)
        : '';
      pages.push(`<div class="page compact-page">${card1}\n<div style="height:12px;"></div>\n${card2}</div>`);
    }
  } else {
    // Full-page: one card per page
    pages = shares.map((share, i) => {
      const card = renderCardHTML(share, qrDatas[i], highlightColor, layout, `card-${i}`, firstAddress);
      return `<div class="page">${card}</div>`;
    });
  }

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
  body { font-family: 'Courier New', monospace; color: #000; font-size: ${layout.fontSize}px; line-height: 1.4; }

  .page {
    page-break-after: always;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .page:last-child { page-break-after: auto; }

  .wallet-page {
    page-break-after: auto;
  }

  .compact-page .card {
    max-height: 48vh;
    overflow: hidden;
  }
  .compact-page .notes-section { display: none; }

  .wallet-page .card {
    overflow: hidden;
  }
  .wallet-page .notes-section { display: none; }
  .wallet-page .instructions-text p:nth-child(n+3) { display: none; }

  .card {
    border: 3px solid #000;
    box-shadow: 6px 6px 0 #000;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
  }

  /* -- HEADER -- */
  .header {
    padding: 8px 16px;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 3px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title { font-size: 13px; }
  .header-meta { font-size: 9px; letter-spacing: 0.5px; opacity: 0.7; }

  /* -- SECTIONS -- */
  .section {
    padding: 10px 16px;
    border-bottom: 2px solid #000;
  }
  .section-label {
    font-weight: bold;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #666;
    margin-bottom: 4px;
  }

  /* -- INSTRUCTIONS -- */
  .instructions-text {
    font-size: ${layout.fontSize - 0.5}px;
    line-height: 1.5;
  }
  .instructions-text p { margin-bottom: 5px; }
  .instructions-text b { font-weight: bold; }
  .instructions-text u { text-decoration: underline; }

  /* -- CREATED DATE -- */
  .date-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 6px 16px;
  }
  .date-row .section-label { margin-bottom: 0; }
  .date-value {
    font-family: 'Courier New', monospace;
    font-size: ${layout.fontSize + 1}px;
    font-weight: bold;
  }

  /* -- NOTES -- */
  .notes-section { min-height: 70px; }
  .note-line {
    border-bottom: 1px solid #ccc;
    height: 18px;
    width: 100%;
  }

  /* -- BOTTOM SECTION -- */
  .bottom-section {
    display: flex;
    flex-direction: row;
    gap: 16px;
    flex: 1;
    align-items: stretch;
  }
  .share-qr {
    border: 2px solid #000;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .share-qr canvas {
    display: block;
    width: 100%;
    height: auto;
  }
  .bottom-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .qr-info-top, .qr-info-bottom {
    font-size: ${layout.fontSize - 1}px;
    line-height: 1.5;
  }
  .qr-info-top { margin-bottom: 6px; }
  .qr-info-bottom { margin-bottom: 6px; }
  .qr-info-top b, .qr-info-bottom b { font-weight: bold; }

  /* -- ADDRESS ROW -- */
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
    font-size: 7px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
  }
  .address-value {
    font-family: 'Courier New', monospace;
    font-size: 8px;
    word-break: break-all;
  }

  /* -- FOOTER -- */
  .footer {
    padding: 8px 16px;
    border-top: 3px solid #000;
    background: #f5f5f5;
  }
  .footer-warning {
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.5;
    margin-bottom: 2px;
  }
  .footer-info {
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    margin-bottom: 2px;
  }
  .footer-guid {
    font-size: 7px;
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
