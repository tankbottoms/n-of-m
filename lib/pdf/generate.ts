import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SharePayload } from '../../constants/types';
import { renderPageHTML } from './templates';
import { LAYOUTS, LayoutType } from './layouts';

export async function generatePDF(
  shares: SharePayload[],
  highlightColor: string,
  layoutType: LayoutType = 'full-page',
  firstAddress?: string
): Promise<string> {
  const layout = LAYOUTS[layoutType];
  const qrDatas = shares.map((s) => JSON.stringify(s));
  const html = renderPageHTML(shares, qrDatas, highlightColor, layout, firstAddress);

  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
  return uri;
}

export async function sharePDF(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Shamir Cards',
    });
  }
}
