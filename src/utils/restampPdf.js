import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

export const PAGE_WIDTH_PT = 595;
export const PAGE_HEIGHT_PT = 842;

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function generateQrPngBytes(url) {
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 150,
    margin: 1,
  });
  return dataUrlToUint8Array(dataUrl);
}

export function getQRPosition(position, pageWidth, pageHeight, qrSize, customX, customY) {
  const margin = 25;
  const cx = (customX !== undefined && customX !== null && !Number.isNaN(Number(customX))) ? Number(customX) : null;
  const cy = (customY !== undefined && customY !== null && !Number.isNaN(Number(customY))) ? Number(customY) : null;
  switch (position) {
    case 'top-left':
      return { x: margin, y: pageHeight - qrSize - margin };
    case 'top-right':
      return { x: pageWidth - qrSize - margin, y: pageHeight - qrSize - margin };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'bottom-right':
      return { x: pageWidth - qrSize - margin, y: margin };
    case 'custom':
      return { x: (cx !== null) ? cx : (pageWidth - qrSize - margin), y: (cy !== null) ? cy : margin };
    default:
      return { x: pageWidth - qrSize - margin, y: margin };
  }
}

export async function restampPdf(pdfArrayBuffer, qrUrl, placement) {
  const {
    position = 'custom',
    customX = 464,
    customY = 175,
    qrSize = 65,
    pageSelection = 'first',
    applyTo,
  } = placement || {};

  const selection = applyTo || pageSelection || 'first';

  const qrBytes = await generateQrPngBytes(qrUrl);
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const pages = pdfDoc.getPages();
  let targetPages = pages;
  if (selection !== 'all') {
    if (selection === 'first' || selection === '1') targetPages = [pages[0]];
    else {
      const indices = selection.split(',').map((s) => parseInt(s.trim(), 10) - 1).filter((i) => i >= 0 && i < pages.length);
      targetPages = indices.map((i) => pages[i]).filter(Boolean);
    }
  }

  for (const page of targetPages) {
    const { width, height } = page.getSize();
    const { x, y } = getQRPosition(position, width, height, qrSize, customX, customY);
    page.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });
  }

  const bytes = await pdfDoc.save();
  return bytes;
}