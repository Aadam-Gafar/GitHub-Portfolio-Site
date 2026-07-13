// ── config ────────────────────────────────────────────────────────────────────
// Add a project: { name, description, languages?: [], links?: [{ label, url }] }
// links[] holds every card link (repos, store URLs, live demos, etc.)

const PROJECTS = [
    {
        name: 'Weight Forecasting Pipeline',
        description: 'Weight forecasting pipeline for athletes using daily nutrition data. Predicts weight trajectory from MacroFactor exports to support controlled weight cuts for combat sports.',
        languages: ['Jupyter Notebook'],
        links: [
            { label: 'github ↗', url: 'https://github.com/Aadam-Gafar/Weight-Forecasting-Pipeline' },
        ],
    },
    {
        name: 'Mono: a distraction-free video library',
        description: `A desktop app for browsing and watching videos on your computer. Turns your folders into a searchable, streaming-style library without any data leaving your machine.`,
        languages: ['HTML', 'CSS', 'JavaScript', 'Rust'],
        links: [
            { label: 'store ↗', url: 'https://apps.microsoft.com/detail/9N6D00VZBLR2?hl=en-us&gl=GB&ocid=pdpshare' },
            { label: 'website ↗', url: 'https://monoapp.uk' }
        ],
    },
];

// ── constants ─────────────────────────────────────────────────────────────────

const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26',
    CSS: '#563d7c', TypeScript: '#2b7489', 'Jupyter Notebook': '#DA5B0B',
    Rust: '#dea584',
};

const BOOT_START_DELAY = 180;
const BOOT_TYPE_SPEED = 24;
const BOOT_ENTER_DELAY = 1000;
const FLOW_INTERVAL = 24;
const FLOW_ROWS_PER_FRAME = 4;
const FLOW_EDGE_ROWS = 6;
const DECODE_INTERVAL = 16;
const DECODE_CHARS_PER_FRAME = 2;
const PORTRAIT_MAX_VW = .92;
const PORTRAIT_MAX_VH = .7;
const MATRIX_GLITCH_SYMBOLS = '@#%&$WM8B';
const MATRIX_GLITCH_COUNT = 10;
const MATRIX_GLITCH_LENGTH = 500;
const MATRIX_GLITCH_INTERVAL = 100;
const MATRIX_ART_FILE = 'face.txt';

// ── helpers ───────────────────────────────────────────────────────────────────

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[char]));
const link = (cls, href, text) => href
    ? `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${text}</a>`
    : `<span class="${cls}">${text}</span>`;

async function fetchMatrixArt(file) {
    const r = await fetch(file, { cache: 'force-cache' });
    return r.ok ? (await r.text()).replace(/\r\n?/g, '\n') : '';
}

// The portrait is ~36k characters. It renders as one element per row so
// every animation frame touches only the few affected rows (~256 chars)
// instead of re-parsing the whole artwork into DOM.
async function initMatrixPortrait() {
    const portrait = document.getElementById('matrix-portrait');
    if (!portrait) return;

    try {
        const art = await fetchMatrixArt(MATRIX_ART_FILE);
        if (!art) return;

        const rows = art.split('\n');
        const rowEls = rows.map(row => {
            const el = document.createElement('span');
            el.className = 'ascii-row';
            el.textContent = row;
            return el;
        });

        await initPortraitScale(portrait, rowEls);

        const start = () => flowInPortrait(rowEls, rows, () => initMatrixGlitch(rowEls, rows));

        if (document.documentElement.classList.contains('booting')) {
            window.addEventListener('bootdone', start, { once: true });
        } else {
            start();
        }
    } catch {
        portrait.remove();
    }
}

// measures the art at its fixed cell size, then fits it to the viewport with
// a uniform scale — aspect ratio stays exact at every screen size
async function initPortraitScale(portrait, rowEls) {
    await document.fonts.ready; // fallback-font metrics would skew the measurement

    const frag = document.createDocumentFragment();
    rowEls.forEach(el => frag.appendChild(el));

    portrait.style.visibility = 'hidden';
    portrait.appendChild(frag);
    const naturalWidth = portrait.offsetWidth;
    const naturalHeight = portrait.offsetHeight;
    rowEls.forEach(el => { el.textContent = ''; }); // blank until the flow-in
    portrait.style.visibility = '';

    if (!naturalWidth || !naturalHeight) return;

    // lock the measured size: layout stays fixed while rows fill in,
    // so the centring never shifts and content edits stay cheap
    portrait.style.width = `${naturalWidth}px`;
    portrait.style.height = `${naturalHeight}px`;

    const fit = () => {
        const scale = Math.min(
            (window.innerWidth * PORTRAIT_MAX_VW) / naturalWidth,
            (window.innerHeight * PORTRAIT_MAX_VH) / naturalHeight,
        );
        portrait.style.setProperty('--portrait-scale', scale.toFixed(4));
    };

    // transform-only update, throttled to one per rendered frame
    let scheduled = 0;
    const onResize = () => {
        if (scheduled) return;
        scheduled = requestAnimationFrame(() => { scheduled = 0; fit(); });
    };

    fit();
    window.addEventListener('resize', onResize);
}

const scrambleRow = row => [...row].map(char =>
    /\S/.test(char)
        ? MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)]
        : char
).join('');

// reveals the art top-to-bottom: a scrambled leading edge sweeps down,
// resolving into the final characters row by row. Each frame writes only the
// rows entering or leaving the edge zone.
function flowInPortrait(rowEls, rows, done) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rowEls.forEach((el, i) => { el.textContent = rows[i]; });
        done();
        return;
    }

    let edge = 0;

    const step = () => {
        for (let i = Math.max(edge - FLOW_ROWS_PER_FRAME, 0); i < Math.min(edge, rows.length); i++) {
            rowEls[i].classList.remove('matrix-glitch');
            rowEls[i].textContent = rows[i];
        }

        if (edge >= rows.length) {
            done();
            return;
        }

        for (let i = edge; i < Math.min(edge + FLOW_EDGE_ROWS, rows.length); i++) {
            rowEls[i].classList.add('matrix-glitch');
            rowEls[i].textContent = scrambleRow(rows[i]);
        }

        edge += FLOW_ROWS_PER_FRAME;
        window.setTimeout(step, FLOW_INTERVAL);
    };

    step();
}

function initMatrixGlitch(rowEls, rows) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // every glitchable [row, col] position, computed once
    const positions = [];
    rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
            if (/\S/.test(row[c])) positions.push([r, c]);
        }
    });

    if (!positions.length) return;

    const glitch = () => {
        if (document.hidden) { // tab in background: idle instead of animating
            window.setTimeout(glitch, 1000);
            return;
        }

        const byRow = new Map();
        for (let n = 0; n < MATRIX_GLITCH_COUNT; n++) {
            const [r, c] = positions[Math.floor(Math.random() * positions.length)];
            if (!byRow.has(r)) byRow.set(r, new Set());
            byRow.get(r).add(c);
        }

        byRow.forEach((cols, r) => {
            rowEls[r].innerHTML = [...rows[r]].map((char, c) => {
                if (!cols.has(c)) return escapeHtml(char);

                const symbol = MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)];
                return `<span class="matrix-glitch">${escapeHtml(symbol)}</span>`;
            }).join('');
        });

        window.setTimeout(() => {
            byRow.forEach((cols, r) => { rowEls[r].textContent = rows[r]; });
            window.setTimeout(glitch, MATRIX_GLITCH_INTERVAL);
        }, MATRIX_GLITCH_LENGTH);
    };

    glitch();
}

// ── projects ──────────────────────────────────────────────────────────────────

function buildCard(p) {
    const titleUrl = p.links?.[0]?.url;
    const langs = (p.languages || []).map(lang => {
        const dot = LANG_COLORS[lang] ? `<span class="lang-dot" style="background:${LANG_COLORS[lang]}"></span>` : '';
        return `<span class="meta-item">${dot} ${lang}</span>`;
    }).join('');
    return `<article class="card">
    <div class="card-body">
      <div class="card-header">
        ${link('card-title', titleUrl, p.name)}
        <div class="card-links">${(p.links || []).map(l => link('card-link', l.url, l.label)).join('')}</div>
      </div>
      ${p.description ? `<p class="card-desc prose">${p.description}</p>` : ''}
      ${langs ? `<div class="card-meta">${langs}</div>` : ''}
    </div>
  </article>`;
}

function initProjects() {
    document.getElementById('project-grid').innerHTML = PROJECTS.map(buildCard).join('');
}

// ── boot sequence ─────────────────────────────────────────────────────────────
// Types the masthead prompt, "presses enter", then reveals the page by
// dropping html.booting (set inline in <head>; absent for reduced motion).

function initBootSequence() {
    const root = document.documentElement;
    if (!root.classList.contains('booting')) return;

    const reveal = () => {
        root.classList.remove('booting');
        decodeText(document.querySelector('h1'));
        window.dispatchEvent(new Event('bootdone'));
    };
    const cursor = document.querySelector('.cursor');
    const promptText = document.querySelector('.prompt > span')?.firstChild;

    if (!promptText) {
        reveal();
        return;
    }

    const fullText = promptText.textContent;
    let typed = 0;
    promptText.textContent = '';

    const type = () => {
        typed += 1;
        promptText.textContent = fullText.slice(0, typed);

        if (typed < fullText.length) {
            window.setTimeout(type, BOOT_TYPE_SPEED);
        } else {
            cursor?.classList.add('waiting');            // cursor blinks while idle
            window.setTimeout(reveal, BOOT_ENTER_DELAY); // enter ↵
        }
    };

    window.setTimeout(type, BOOT_START_DELAY);
}

// resolves an element's text left to right from scrambled glitch characters
function decodeText(el) {
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const finalText = el.textContent;
    let resolved = 0;

    const step = () => {
        if (resolved >= finalText.length) {
            el.textContent = finalText;
            return;
        }

        el.textContent = [...finalText].map((char, i) =>
            i < resolved || !/\S/.test(char)
                ? char
                : MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)]
        ).join('');

        resolved += DECODE_CHARS_PER_FRAME;
        window.setTimeout(step, DECODE_INTERVAL);
    };

    step();
}

// ── init ──────────────────────────────────────────────────────────────────────

initBootSequence();
initMatrixPortrait();
initProjects();
