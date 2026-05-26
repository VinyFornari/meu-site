# Site VMF — Vinícius M. Fornari

Site estático. Para publicar no **Cloudflare Pages**:

1. Faça login em [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Upload assets**
2. Dê um nome ao projeto (ex: `site-vmf`)
3. Faça upload desta pasta inteira (todos os arquivos) ou conecte via GitHub
4. Pronto — o site fica em `https://site-vmf.pages.dev` (e você pode plugar um domínio custom depois)

## Estrutura

- `index.html` — página principal
- `styles.css` — todos os estilos
- `enhancements.js` — modais, reveal-on-scroll, cookies
- `hero-bg.js` — rede neural interativa no hero
- `image-slot.js` — slots de imagem (drag-and-drop persistente)
- `tweaks-panel.jsx` + `tweaks-app.jsx` — painel de Tweaks (cor de acento, tema, layout)
- `logo-wordmark.svg` — wordmark da marca
