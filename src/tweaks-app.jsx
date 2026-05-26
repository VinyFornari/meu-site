// VMF Tweaks app — mounts the Tweaks panel and applies values to <body> data-attrs
const { useEffect } = React;

function VMFTweaks() {
  const [t, setTweak] = useTweaks(window.__TWEAK_DEFAULTS);

  useEffect(() => {
    document.body.setAttribute('data-theme', t.theme);
    document.body.setAttribute('data-accent', t.accent);
    const grid = document.querySelector('.mats__grid');
    if (grid) grid.setAttribute('data-layout', t.matsLayout);
  }, [t.theme, t.accent, t.matsLayout]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Tema" />
      <TweakRadio
        label="Modo"
        value={t.theme}
        options={['dark', 'light']}
        onChange={(v) => setTweak('theme', v)}
      />
      <TweakSection label="Acento" />
      <TweakRadio
        label="Cor"
        value={t.accent}
        options={['lime', 'emerald', 'cyan', 'amber']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakSection label="Materiais" />
      <TweakRadio
        label="Layout"
        value={t.matsLayout}
        options={['side', 'stack']}
        onChange={(v) => setTweak('matsLayout', v)}
      />
    </TweaksPanel>
  );
}

const __vmfRoot = document.createElement('div');
document.body.appendChild(__vmfRoot);
ReactDOM.createRoot(__vmfRoot).render(<VMFTweaks />);
