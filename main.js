// ── config ────────────────────────────────────────────────────────────────────
// Add a project: { repo: 'user/repo', links?: [{ label, url }] }
// GitHub supplies name, desc, URL, stars, forks, language automatically.
// links[] is for anything GitHub doesn't know (store URLs, live demos, etc.)

const REPOS = [
    {
        repo: 'Aadam-Gafar/Weight-Forecasting-Pipeline',
        name: 'Weight Forecasting Pipeline',
        description: 'Weight forecasting pipeline for athletes using daily nutrition data. Predicts weight trajectory from MacroFactor exports to support controlled weight cuts for combat sports.',
        stars: '-',
        forks: '-',
        language: 'Jupyter Notebook',
    },
    {
        repo: 'Aadam-Gafar/Mono-Hub',
        name: 'Mono Hub',
        description: `The official hub for Mono, a suite of distraction-free tools designed to help users reclaim their time. Includes: 'Mono, a distraction-free video library' and 'Mono, a distraction-free YouTube extension'.`,
        stars: '-',
        forks: '-',
        language: 'JavaScript',
        links: [
            { label: 'website ↗', url: 'https://monoapp.uk' }        ]
    },
];

// ── constants ─────────────────────────────────────────────────────────────────

const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26',
    CSS: '#563d7c', TypeScript: '#2b7489', 'Jupyter Notebook': '#DA5B0B',
};

const ICONS = {
    star: `<svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`,
    fork: `<svg viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z"/></svg>`,
};

const MATRIX_GLITCH_SYMBOLS = '@#%&$WM8B';
const MATRIX_GLITCH_COUNT = 10;
const MATRIX_GLITCH_LENGTH = 500;
const MATRIX_GLITCH_INTERVAL = 100;
const MATRIX_ART_FILES = {
    dark: 'face-dark.txt',
    light: 'face-light.txt',
};
const GITHUB_USER = 'Aadam-Gafar';
const GITHUB_REPO_CACHE_KEY = 'githubRepoMetadata';
const GITHUB_REPO_CACHE_TTL = 1000 * 60 * 60 * 6;
let githubReposRequest;

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
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

function isLightTheme() {
    return document.body.classList.contains('light');
}

async function fetchMatrixArt(file) {
    const r = await fetch(file, { cache: 'force-cache' });
    return r.ok ? (await r.text()).replace(/\r\n?/g, '\n') : '';
}

async function fetchRepo(path) {
    const repos = await fetchGitHubRepos();
    return repos.find(repo => repo.full_name?.toLowerCase() === path.toLowerCase()) || null;
}

function readGitHubRepoCache() {
    try {
        const cache = JSON.parse(localStorage.getItem(GITHUB_REPO_CACHE_KEY));
        return cache && Array.isArray(cache.data) ? cache : null;
    } catch {
        return null;
    }
}

function writeGitHubRepoCache(data) {
    try {
        localStorage.setItem(GITHUB_REPO_CACHE_KEY, JSON.stringify({
            createdAt: Date.now(),
            data,
        }));
    } catch {
        // Rendering should not depend on cache availability.
    }
}

async function fetchGitHubRepos() {
    const cache = readGitHubRepoCache();

    if (cache && Date.now() - cache.createdAt < GITHUB_REPO_CACHE_TTL) {
        return cache.data;
    }

    if (githubReposRequest) {
        return githubReposRequest;
    }

    githubReposRequest = fetchGitHubReposFromApi(cache);
    return githubReposRequest;
}

async function fetchGitHubReposFromApi(cache) {
    try {
        const r = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
            headers: { Accept: 'application/vnd.github+json' },
        });

        if (!r.ok) {
            console.warn(`GitHub metadata unavailable: ${r.status} ${r.statusText}`);
            return cache?.data || [];
        }

        const repos = await r.json();
        writeGitHubRepoCache(repos);
        return repos;
    } catch (error) {
        console.warn('GitHub metadata unavailable:', error);
        return cache?.data || [];
    }
}

async function initMatrixPortrait() {
    const portrait = document.getElementById('matrix-portrait');
    if (!portrait) return;

    try {
        const [darkArt, lightArt] = await Promise.all([
            fetchMatrixArt(MATRIX_ART_FILES.dark),
            fetchMatrixArt(MATRIX_ART_FILES.light),
        ]);
        if (!darkArt && !lightArt) return;

        const art = {
            dark: darkArt || lightArt,
            light: lightArt || darkArt,
        };
        const getArt = () => isLightTheme() ? art.light : art.dark;
        const render = () => { portrait.textContent = getArt(); };

        render();
        window.addEventListener('themechange', render);
        initMatrixGlitch(portrait, getArt);
    } catch {
        portrait.remove();
    }
}

function initMatrixGlitch(portrait, getArt) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderGlitchFrame = (source, picked) => {
        portrait.innerHTML = source.map((char, index) => {
            if (!picked.has(index)) return escapeHtml(char);

            const symbol = MATRIX_GLITCH_SYMBOLS[Math.floor(Math.random() * MATRIX_GLITCH_SYMBOLS.length)];
            return `<span class="matrix-glitch">${escapeHtml(symbol)}</span>`;
        }).join('');
    };

    const glitch = () => {
        const source = [...getArt()];
        const glitchable = [];

        source.forEach((char, index) => {
            if (/\S/.test(char)) glitchable.push(index);
        });

        if (!glitchable.length) return;

        const picked = new Set();
        const count = Math.min(MATRIX_GLITCH_COUNT, glitchable.length);

        while (picked.size < count) {
            picked.add(glitchable[Math.floor(Math.random() * glitchable.length)]);
        }

        renderGlitchFrame(source, picked);

        window.setTimeout(() => {
            portrait.textContent = getArt();
            window.setTimeout(glitch, MATRIX_GLITCH_INTERVAL);
        }, MATRIX_GLITCH_LENGTH);
    };

    glitch();
}

// ── projects ──────────────────────────────────────────────────────────────────

function buildCard(p, d) {
    const lang = d?.language || p.language;
    const dot = lang && LANG_COLORS[lang] ? `<span class="lang-dot" style="background:${LANG_COLORS[lang]}"></span>` : '';
    const repoUrl = d?.html_url || `https://github.com/${p.repo}`;
    const repoName = d?.name || p.name || p.repo.split('/').pop();
    const description = d?.description || p.description;
    const stars = d?.stargazers_count ?? p.stars;
    const forks = d?.forks_count ?? p.forks;
    const allLinks = [...(p.links || []), { label: 'github ↗', url: repoUrl }];

    return `<div class="card">
    <div class="card-header">
      ${link('card-title', repoUrl, repoName)}
      <div class="card-links">${allLinks.map(l => link('card-link', l.url, l.label)).join('')}</div>
    </div>
    ${description ? `<p class="card-desc prose">${description}</p>` : ''}
    <div class="card-meta">
      <span class="meta-item">${ICONS.star} ${Number.isFinite(stars) ? fmt(stars) : '—'}</span>
      <span class="meta-item">${ICONS.fork} ${Number.isFinite(forks) ? fmt(forks) : '—'}</span>
      ${lang ? `<span class="meta-item">${dot} ${lang}</span>` : ''}
    </div>
  </div>`;
}

async function initProjects() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = REPOS.map(() =>
        `<div class="card"><p class="loading">fetching...</p></div>`
    ).join('');
    const repos = await fetchGitHubRepos();
    const data = REPOS.map(p => repos.find(repo => repo.full_name?.toLowerCase() === p.repo.toLowerCase()) || null);
    grid.innerHTML = REPOS.map((p, i) => buildCard(p, data[i])).join('');
}

// ── contact form ──────────────────────────────────────────────────────────────

function initContact() {
    document.getElementById('contact-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('cf-name').value.trim();
        const email = document.getElementById('cf-email').value.trim();
        const msg = document.getElementById('cf-msg').value.trim();
        const subject = encodeURIComponent(`Portfolio contact from ${name}`);
        const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
        window.location.href = `mailto:aadamhgafar@gmail.com?subject=${subject}&body=${body}`;
    });
}

// ── theme toggle ──────────────────────────────────────────────────────────────

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const stored = localStorage.getItem('theme');

    if (stored === 'light') {
        document.body.classList.add('light');
    }

    btn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        window.dispatchEvent(new Event('themechange'));
    });
}

// ── init ──────────────────────────────────────────────────────────────────────

initTheme();
initMatrixPortrait();
initProjects();
initContact();
