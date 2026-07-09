import React from 'react';

// Wraps whatever a section's block renders to apply optional layout config
// (section.layout — width / height / padding) without touching any of the
// individual block components. Every block places `id={section.id}` on a
// single outermost <section> node with inline padding/minHeight — this is
// the one structurally-reliable hook we can reach through.
//
// IMPORTANT: never add transform / filter / perspective / contain /
// will-change:transform to the outer wrapper below. ReferencesRequestBlock
// and OutputGeneratorBlock render position:fixed confirmation modals that
// rely on no ancestor establishing a new containing block — any of those
// properties here would trap those modals inside this wrapper's box instead
// of the viewport. maxWidth/margin are safe; nothing else has been vetted.

const WIDTH_PX = { contained: 1100, narrow: 720 };

export default function SectionShell({ section, children }) {
  const layout = section?.layout;
  // No layout config — zero extra DOM, guarantees pixel-identical rendering
  // for every section created before this feature existed.
  if (!layout) return children;
  return <SectionShellActive layout={layout}>{children}</SectionShellActive>;
}

function SectionShellActive({ layout, children }) {
  const wrapRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const el = wrapRef.current?.firstElementChild;
    if (!el) return;

    if (layout.padding?.mode === 'custom') {
      el.style.setProperty('padding-top', `${layout.padding.top ?? 0}px`, 'important');
      el.style.setProperty('padding-bottom', `${layout.padding.bottom ?? 0}px`, 'important');
    } else {
      el.style.removeProperty('padding-top');
      el.style.removeProperty('padding-bottom');
    }

    // min-height, not height: several blocks (Hero) hardcode
    // minHeight:'100vh' inline. Overriding with an exact height risks
    // clipping content taller than the admin's chosen value — min-height
    // only ever grows the box, never truncates it.
    if (layout.height?.mode === 'fixed' && layout.height.px) {
      el.style.setProperty('min-height', `${layout.height.px}px`, 'important');
    } else {
      el.style.removeProperty('min-height');
    }
  }, [layout.padding?.mode, layout.padding?.top, layout.padding?.bottom, layout.height?.mode, layout.height?.px]);

  const outerStyle = {};
  if (layout.width && layout.width !== 'full') {
    outerStyle.maxWidth = WIDTH_PX[layout.width];
    outerStyle.margin = '0 auto';
  }

  return (
    <div ref={wrapRef} style={outerStyle}>
      {children}
    </div>
  );
}
