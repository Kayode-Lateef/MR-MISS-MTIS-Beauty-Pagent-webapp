// Renders a contestant campaign flyer onto an HTML canvas, given an admin-
// configured template (background image + positions) and a contestant's
// photo/name/stage name/number. Pure client-side (uses the DOM Canvas API),
// so it must only be imported from "use client" components.

export interface FlyerTextField {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface FlyerButtonField {
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
  label: string;
  fontSize: number;
  borderRadius: number;
}

export interface FlyerPhotoField {
  x: number; // circle center x
  y: number; // circle center y
  radius: number;
}

export interface FlyerConfig {
  photo: FlyerPhotoField;
  contestantNumber: FlyerTextField;
  name: FlyerTextField;
  stageName: FlyerTextField;
  voteButton: FlyerButtonField;
}

export const DEFAULT_FLYER_CONFIG: FlyerConfig = {
  photo: { x: 300, y: 320, radius: 150 },
  contestantNumber: { x: 300, y: 520, fontSize: 26, color: '#f5c542', align: 'center', fontWeight: 'bold' },
  name: { x: 300, y: 560, fontSize: 32, color: '#ffffff', align: 'center', fontWeight: 'bold' },
  stageName: { x: 300, y: 600, fontSize: 22, color: '#f5c542', align: 'center', fontWeight: 'normal' },
  voteButton: { x: 175, y: 640, width: 250, height: 56, bgColor: '#7a1f3d', textColor: '#ffffff', label: 'VOTE NOW', fontSize: 22, borderRadius: 28 },
};

export interface FlyerContestant {
  name: string;
  stage_name?: string | null;
  contestant_number?: string | null;
  avatar_url?: string | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Renders the flyer and returns a PNG data URL, ready to show in an <img>
 * or trigger a download from.
 */
export async function renderFlyer(
  backgroundImageUrl: string,
  canvasWidth: number,
  canvasHeight: number,
  config: FlyerConfig,
  contestant: FlyerContestant
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const bgImg = await loadImage(backgroundImageUrl);
  ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);

  if (contestant.avatar_url) {
    try {
      const photoImg = await loadImage(contestant.avatar_url);
      const { x, y, radius } = config.photo;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // Cover-fit: scale so the image fully covers the circle's bounding box
      const size = radius * 2;
      const scale = Math.max(size / photoImg.width, size / photoImg.height);
      const drawWidth = photoImg.width * scale;
      const drawHeight = photoImg.height * scale;
      ctx.drawImage(photoImg, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    } catch {
      // Skip the photo rather than failing the whole flyer if it can't load.
    }
  }

  const drawText = (field: FlyerTextField, text: string) => {
    if (!text) return;
    ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = field.color;
    ctx.textAlign = field.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, field.x, field.y);
  };

  drawText(config.contestantNumber, contestant.contestant_number ? `#${contestant.contestant_number}` : '');
  drawText(config.name, contestant.name);
  drawText(config.stageName, contestant.stage_name || '');

  const btn = config.voteButton;
  if (btn) {
    ctx.fillStyle = btn.bgColor;
    drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, btn.borderRadius);
    ctx.fill();

    ctx.font = `bold ${btn.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = btn.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  return canvas.toDataURL('image/png');
}

/** Reads a File (e.g. from an <input type="file">) as a base64 data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/** Triggers a browser download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
