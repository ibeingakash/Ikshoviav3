const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.join(process.cwd(), 'public', 'branding');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Common Star Path:
// 4-point star base contour inside 100x100 box
const starBase = 'M50 2 C52 32, 68 48, 98 50 C68 52, 52 68, 50 98 C48 68, 32 52, 2 50 C32 48, 48 32, 50 2 Z';
const starInner = 'M50 22 C51 38, 62 49, 78 50 C62 51, 51 62, 50 78 C49 62, 38 51, 22 50 C38 49, 49 38, 50 22 Z';

const starGradients = `
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3CA65" />
      <stop offset="45%" stop-color="#D49A32" />
      <stop offset="100%" stop-color="#9A6517" />
    </linearGradient>
    <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#E2B65D" stop-opacity="0.45" />
    </linearGradient>
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
`;

function renderGoldSymbol(x, y, scale = 1, glow = false) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" ${glow ? 'filter="url(#subtleGlow)"' : ''}>
      <path d="${starBase}" fill="url(#goldGrad)" />
      <path d="${starInner}" fill="url(#innerGrad)" />
      <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
    </g>
  `;
}

function renderMonoSymbol(x, y, scale = 1, color = '#FFFFFF') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})">
      <path d="${starBase}" fill="${color}" />
      <path d="${starInner}" fill="${color}" opacity="0.75" />
      <circle cx="50" cy="50" r="4.5" fill="${color}" />
    </g>
  `;
}

const assets = [
  {
    filename: '01_IKSHOVIA_Primary_Logo_White.png',
    width: 720,
    height: 180,
    svg: `
      <svg width="720" height="180" viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <!-- Mark in luxury badge -->
        <rect x="24" y="25" width="130" height="130" rx="28" fill="#0E1228" stroke="#D97706" stroke-width="2" stroke-opacity="0.45" />
        ${renderGoldSymbol(39, 40, 1.0, true)}
        <!-- Text Group -->
        <g transform="translate(180, 0)">
          <text x="0" y="98" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="58" letter-spacing="4" fill="#FFFFFF">IKSHOVIA</text>
          <text x="2" y="132" font-family="'Newsreader', 'Liberation Serif', 'Georgia', serif" font-style="italic" font-weight="500" font-size="20" letter-spacing="0.5" fill="#F3CA65">Unlock Human Potential Through Understanding</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '02_IKSHOVIA_Horizontal_Logo_White.png',
    width: 520,
    height: 110,
    svg: `
      <svg width="520" height="110" viewBox="0 0 520 110" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <!-- Compact Mark Badge -->
        <rect x="16" y="15" width="80" height="80" rx="18" fill="#0E1228" stroke="#D97706" stroke-width="1.5" stroke-opacity="0.4" />
        ${renderGoldSymbol(26, 25, 0.6, false)}
        <!-- Compact Wordmark -->
        <g transform="translate(116, 0)">
          <text x="0" y="70" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="44" letter-spacing="3" fill="#FFFFFF">IKSHOVIA</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '03_IKSHOVIA_App_Icon.png',
    width: 512,
    height: 512,
    svg: `
      <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <!-- Midnight Navy Background Squircle -->
        <rect x="0" y="0" width="512" height="512" rx="115" fill="#0C1024" />
        <!-- Subtle Radial Ambient Light -->
        <circle cx="256" cy="256" r="210" fill="#D97706" opacity="0.08" />
        <!-- Gold Accent Border Rim -->
        <rect x="16" y="16" width="480" height="480" rx="100" fill="none" stroke="#D97706" stroke-width="3" stroke-opacity="0.35" />
        <!-- Centered 4-Point Star Brand Symbol -->
        ${renderGoldSymbol(96, 96, 3.2, true)}
      </svg>
    `,
  },
  {
    filename: '04_IKSHOVIA_Favicon.png',
    width: 128,
    height: 128,
    svg: `
      <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <rect x="0" y="0" width="128" height="128" rx="28" fill="#0C1024" />
        <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" />
        ${renderGoldSymbol(20, 20, 0.88, false)}
      </svg>
    `,
  },
  {
    filename: '05_IKSHOVIA_Login_Logo.png',
    width: 540,
    height: 140,
    svg: `
      <svg width="540" height="140" viewBox="0 0 540 140" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <rect x="18" y="18" width="104" height="104" rx="24" fill="#0C1024" stroke="#D97706" stroke-width="2" stroke-opacity="0.45" />
        ${renderGoldSymbol(30, 30, 0.8, true)}
        <g transform="translate(144, 0)">
          <text x="0" y="76" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="46" letter-spacing="3.5" fill="#111426">IKSHOVIA</text>
          <text x="2" y="106" font-family="'Plus Jakarta Sans', 'Liberation Sans', sans-serif" font-weight="600" font-size="14" letter-spacing="2" fill="#B45309">PERSONAL LEARNING INTELLIGENCE</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '06_IKSHOVIA_Dashboard_Logo.png',
    width: 460,
    height: 110,
    svg: `
      <svg width="460" height="110" viewBox="0 0 460 110" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <rect x="14" y="15" width="80" height="80" rx="18" fill="#0C1024" stroke="#D97706" stroke-width="1.5" stroke-opacity="0.4" />
        ${renderGoldSymbol(24, 25, 0.6, false)}
        <g transform="translate(112, 0)">
          <text x="0" y="66" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="40" letter-spacing="2.5" fill="#111426">IKSHOVIA</text>
          <text x="2" y="88" font-family="'Plus Jakarta Sans', 'Liberation Sans', sans-serif" font-weight="600" font-size="10.5" letter-spacing="2.5" fill="#78350F">ACADEMIC COGNITIVE ARCHITECTURE</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '07_IKSHOVIA_PDF_Report_Logo.png',
    width: 620,
    height: 130,
    svg: `
      <svg width="620" height="130" viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <rect x="16" y="16" width="96" height="96" rx="20" fill="#0C1024" stroke="#D97706" stroke-width="2" stroke-opacity="0.5" />
        ${renderGoldSymbol(26, 26, 0.76, false)}
        <g transform="translate(132, 0)">
          <text x="0" y="70" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="44" letter-spacing="3" fill="#1C1917">IKSHOVIA</text>
          <line x1="0" y1="84" x2="380" y2="84" stroke="#D97706" stroke-width="1.5" stroke-opacity="0.5" />
          <text x="2" y="104" font-family="'Newsreader', 'Liberation Serif', 'Georgia', serif" font-style="italic" font-weight="600" font-size="15" letter-spacing="1" fill="#57534E">EVALUATION &amp; ASSESSMENT REPORT</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '08_IKSHOVIA_Certificate_Logo.png',
    width: 660,
    height: 160,
    svg: `
      <svg width="660" height="160" viewBox="0 0 660 160" xmlns="http://www.w3.org/2000/svg">
        ${starGradients}
        <!-- Ceremonial Gold Seal Ring -->
        <circle cx="75" cy="80" r="58" fill="#0C1024" stroke="#D97706" stroke-width="2.5" />
        <circle cx="75" cy="80" r="50" fill="none" stroke="#F3CA65" stroke-width="1" stroke-dasharray="3,3" />
        ${renderGoldSymbol(35, 40, 0.8, true)}
        <g transform="translate(160, 0)">
          <text x="0" y="78" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="48" letter-spacing="4" fill="#92400E">IKSHOVIA</text>
          <text x="2" y="112" font-family="'Newsreader', 'Liberation Serif', 'Georgia', serif" font-style="italic" font-weight="600" font-size="17" letter-spacing="1.5" fill="#78350F">ACADEMY OF CIVIL SERVICES LEARNING EXCELLENCE</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '09_IKSHOVIA_Monochrome_Light.png',
    width: 500,
    height: 110,
    svg: `
      <svg width="500" height="110" viewBox="0 0 500 110" xmlns="http://www.w3.org/2000/svg">
        ${renderMonoSymbol(16, 15, 0.8, '#FFFFFF')}
        <g transform="translate(112, 0)">
          <text x="0" y="72" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="44" letter-spacing="3" fill="#FFFFFF">IKSHOVIA</text>
        </g>
      </svg>
    `,
  },
  {
    filename: '10_IKSHOVIA_Monochrome_Dark.png',
    width: 500,
    height: 110,
    svg: `
      <svg width="500" height="110" viewBox="0 0 500 110" xmlns="http://www.w3.org/2000/svg">
        ${renderMonoSymbol(16, 15, 0.8, '#111426')}
        <g transform="translate(112, 0)">
          <text x="0" y="72" font-family="'Cinzel', 'Liberation Serif', 'Times New Roman', serif" font-weight="700" font-size="44" letter-spacing="3" fill="#111426">IKSHOVIA</text>
        </g>
      </svg>
    `,
  },
];

async function generateAll() {
  console.log('Generating IKSHOVIA Brand Assets in', outputDir);
  for (const asset of assets) {
    const destPath = path.join(outputDir, asset.filename);
    const buffer = Buffer.from(asset.svg.trim());
    await sharp(buffer)
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(destPath);
    console.log(`✓ Generated ${asset.filename} (${asset.width}x${asset.height})`);
  }

  // Also copy favicon to public/favicon.ico
  const faviconSrc = path.join(outputDir, '04_IKSHOVIA_Favicon.png');
  const faviconDest = path.join(process.cwd(), 'public', 'favicon.ico');
  fs.copyFileSync(faviconSrc, faviconDest);
  console.log('✓ Copied favicon to public/favicon.ico');

  // Also generate Android mipmap icons from 03_IKSHOVIA_App_Icon.png
  const appIconBuffer = fs.readFileSync(path.join(outputDir, '03_IKSHOVIA_App_Icon.png'));
  const androidResDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(androidResDir)) {
    const mipmaps = [
      { dir: 'mipmap-mdpi', size: 48 },
      { dir: 'mipmap-hdpi', size: 72 },
      { dir: 'mipmap-xhdpi', size: 96 },
      { dir: 'mipmap-xxhdpi', size: 144 },
      { dir: 'mipmap-xxxhdpi', size: 192 },
    ];
    for (const m of mipmaps) {
      const targetDir = path.join(androidResDir, m.dir);
      if (fs.existsSync(targetDir)) {
        await sharp(appIconBuffer).resize(m.size, m.size).png().toFile(path.join(targetDir, 'ic_launcher.png'));
        await sharp(appIconBuffer).resize(m.size, m.size).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
        console.log(`✓ Updated Android icons in ${m.dir} (${m.size}x${m.size})`);
      }
    }
  }

  console.log('All brand assets successfully generated!');
}

generateAll().catch(err => {
  console.error('Failed to generate brand assets:', err);
  process.exit(1);
});
