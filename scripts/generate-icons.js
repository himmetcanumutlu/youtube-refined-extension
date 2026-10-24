// Generates the extension icons (ON / OFF states) as transparent PNGs without any dependencies.
// Usage: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [16, 32, 48, 128];
const OUT_DIR = path.join(__dirname, '..', 'icons');

const THEMES = {
    on:  { play: '#ff0033', arrow: '#ffffff', pill: '#10b981', knob: '#ffffff', knobX: 105 },
    off: { play: '#5f5f5f', arrow: '#c4c4c4', pill: '#6b7280', knob: '#d1d5db', knobX: 79 }
};
const OUTLINE = '#0f0f0f';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// All shapes are defined on a 128x128 canvas and scaled to each output size.
function inRoundRect(x, y, x0, y0, x1, y1, r) {
    const cx = Math.min(Math.max(x, x0 + r), x1 - r);
    const cy = Math.min(Math.max(y, y0 + r), y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
    const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function sample(x, y, theme) {
    // Painted top to bottom; the first match wins.
    if (inCircle(x, y, theme.knobX, 101, 12)) return hex(theme.knob);
    if (inRoundRect(x, y, 62, 84, 122, 118, 17)) return hex(theme.pill);
    if (inRoundRect(x, y, 57, 79, 127, 123, 22)) return hex(OUTLINE);
    if (inTriangle(x, y, [50, 42], [50, 86], [88, 64])) return hex(theme.arrow);
    if (inRoundRect(x, y, 4, 20, 124, 108, 26)) return hex(theme.play);
    return null;
}

function render(size, theme) {
    const SS = 4; // supersampling for anti-aliasing
    const scale = 128 / size;
    const pixels = Buffer.alloc(size * size * 4);
    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let sy = 0; sy < SS; sy++) {
                for (let sx = 0; sx < SS; sx++) {
                    const c = sample((px + (sx + 0.5) / SS) * scale, (py + (sy + 0.5) / SS) * scale, theme);
                    if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
                }
            }
            const i = (py * size + px) * 4;
            if (a) {
                pixels[i] = Math.round(r / a);
                pixels[i + 1] = Math.round(g / a);
                pixels[i + 2] = Math.round(b / a);
                pixels[i + 3] = Math.round((a / (SS * SS)) * 255);
            }
        }
    }
    return encodePNG(size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

function crc32(buf) {
    let c = 0xffffffff;
    for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}

function encodePNG(size, pixels) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;  // bit depth
    header[9] = 6;  // RGBA
    const raw = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [state, theme] of Object.entries(THEMES)) {
    for (const size of SIZES) {
        const file = path.join(OUT_DIR, `icon_${state}_${size}.png`);
        fs.writeFileSync(file, render(size, theme));
        console.log('wrote', path.relative(process.cwd(), file));
    }
}
