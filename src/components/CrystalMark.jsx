import React, { useEffect, useRef } from 'react';
import { registerCrystalMark } from './CrystalMarkField.jsx';

// Drop-in replacement for <SaltBasinCrystal size="mark" .../> — same visual
// result (a small real 3D crystal), but registers with the shared
// CrystalMarkField canvas instead of mounting its own WebGLRenderer. Use this
// for any small, purely-decorative crystal accent; use SaltBasinCrystal
// itself for the hero/backdrop/orbit scenes that need their own camera and
// interaction.
export default function CrystalMark({ variant = 'signature', autoRotate = true, className = '' }) {
  const elRef = useRef(null);

  useEffect(() => {
    const cleanup = registerCrystalMark(elRef.current, { variant, autoRotate });
    return cleanup;
  }, [variant, autoRotate]);

  return (
    <div ref={elRef} className={`sbh-webgl-crystal sbh-webgl-crystal-mark ${className}`} data-rendered="true" aria-hidden="true">
      <div className={`sbh-crystal sbh-crystal-fallback sbh-crystal-${variant}`} aria-hidden="true">
        <span className="facet facet-a" />
        <span className="facet facet-b" />
        <span className="facet facet-c" />
        <span className="facet facet-d" />
      </div>
    </div>
  );
}
