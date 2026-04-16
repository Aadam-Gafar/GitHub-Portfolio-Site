# Aadam Gafar Portfolio

![Website screenshot](art/screenshot.png)

A personal portfolio and CV built with plain HTML, CSS, and JavaScript.

## What It Includes

- Responsive portfolio/CV sections for about, projects, education, experience, skills, and contact
- Project cards generated from `main.js` with GitHub metadata fetched from the GitHub API
- Local storage caching for GitHub repo metadata to reduce repeated API calls
- Dark/light theme toggle with saved preference
- ASCII portrait background that swaps artwork between dark and light mode
- Small glitch animation that respects `prefers-reduced-motion`
- Mailto contact form, with no server-side processing or third-party form service
- Open Graph metadata, favicon, and JSON-LD `Person` schema

## Project Data

Featured projects are configured in `main.js` through the `REPOS` array. Each entry can provide fallback metadata and optional extra links:

```js
{
  repo: 'Aadam-Gafar/Mono-YouTube-Extension',
  name: 'Mono YouTube Extension',
  description: '...',
  language: 'CSS',
  links: [
    { label: 'chrome store', url: '...' },
  ],
}
```

When available, GitHub supplies the current repo name, description, stars, forks, language, and GitHub URL.

## Structure

```text
.
|-- index.html
|-- style.css
|-- main.js
|-- face-dark.txt
|-- face-light.txt
|-- art/
|   |-- icon.svg
|   |-- screenshot.png
|   `-- toggle.svg
|-- CNAME
`-- README.md
```

## Running Locally

Open `index.html` directly in a browser for the static page. For the ASCII portrait fetches to work consistently across browsers, serve the folder locally instead:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

The site is intended for GitHub Pages with the custom domain configured in `CNAME`.
