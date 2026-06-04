// Block library. Each block accepts { section, config, mode } and renders the
// public-facing markup. `mode` is 'public' or 'preview' so admin previews can
// show draft/soon banners that the real public site never sees.
import React from 'react';
import { InlineDataNotice } from '../DataNotice.jsx';

const BG_VAR = {
  ivory: 'var(--sb-ivory)',
  navy: 'var(--sb-navy)',
  linen: 'var(--sb-linen)',
  teal: 'var(--sb-teal)',
  cream: 'var(--sb-cream)',
};
const TEXT_FOR = {
  ivory: 'var(--sb-navy)',
  navy: 'var(--sb-cream)',
  linen: 'var(--sb-navy)',
  teal: 'var(--sb-cream)',
  cream: 'var(--sb-navy)',
};
const SUB_FOR = {
  ivory: 'var(--sb-teal-deep)',
  navy: 'var(--sb-sage)',
  linen: 'var(--sb-teal-deep)',
  teal: 'var(--sb-cream)',
  cream: 'var(--sb-teal-deep)',
};

function StatusBanner({ status }) {
  if (status === 'live') return null;
  if (status === 'draft') {
    return (
      <div className="sb-status-banner draft">
        ◐ Draft section — hidden from visitors
      </div>
    );
  }
  return <div className="sb-status-banner soon">◌ Coming Soon — visitors see a placeholder</div>;
}

function SoonScreen({ msg }) {
  return (
    <div
      style={{
        background: 'var(--sb-navy)',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--sb-gold)' }}>◌</div>
      <h2
        className="sb-display"
        style={{
          fontSize: '2rem',
          color: 'var(--sb-cream)',
          marginBottom: '0.75rem',
          letterSpacing: '0.08em',
        }}
      >
        {msg || 'Coming Soon'}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--sb-sage)', marginBottom: '1.5rem' }}>
        Check back shortly — something good is on the way.
      </p>
      <div className="sb-gold-rule" style={{ margin: '0 auto' }} />
    </div>
  );
}

// ── Block implementations ──

function HeroBlock({ section, config }) {
  const f = section.fields || {};
  const tagline = f.subtitle || f.tagline || config?.site?.tagline;
  const rings = [300, 500, 700, 900].map((s) => (
    <div
      key={s}
      style={{
        position: 'absolute',
        borderRadius: '50%',
        border: '0.5px solid rgba(181,196,193,0.07)',
        width: s,
        height: s,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }}
    />
  ));
  return (
    <section
      id={section.id}
      style={{
        minHeight: '100vh',
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {rings}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
        {f.eyebrow && (
          <p
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.72rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
              marginBottom: '1.5rem',
            }}
          >
            {f.eyebrow}
          </p>
        )}
        <h1
          className="sb-display"
          style={{
            fontSize: '5.5rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: 'var(--sb-cream)',
            marginBottom: '0.4rem',
            lineHeight: 1,
          }}
        >
          {f.heading}
        </h1>
        {tagline && (
          <p
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.78rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
              marginBottom: '2rem',
            }}
          >
            ✦ {tagline} ✦
          </p>
        )}
        {f.concept && (
          <p
            className="sb-display"
            style={{
              fontSize: '1.25rem',
              fontStyle: 'italic',
              color: 'var(--sb-sage)',
              maxWidth: 640,
              margin: '0 auto 2rem',
              lineHeight: 1.85,
            }}
          >
            {f.concept}
          </p>
        )}
        {f.domainStrip && (
          <p
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-sage)',
              opacity: 0.75,
              marginBottom: '2.25rem',
            }}
          >
            {f.domainStrip}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: f.platformLine ? '3rem' : 0 }}>
          {f.cta1 && (
            <a href={f.cta1Link || '#'} className="sb-btn sb-btn-gold">
              {f.cta1}
            </a>
          )}
          {f.cta2 && (
            <a href={f.cta2Link || '#'} className="sb-btn sb-btn-outline">
              {f.cta2}
            </a>
          )}
        </div>
        {f.platformLine && (
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--sb-dusty)',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.7,
              opacity: 0.7,
            }}
          >
            {f.platformLine}
          </p>
        )}
      </div>
    </section>
  );
}

function ScriptureBlock({ section }) {
  const f = section.fields || {};
  return (
    <div
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-teal)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}
    >
      <p
        className="sb-display"
        style={{
          fontSize: '1.2rem',
          fontStyle: 'italic',
          color: 'var(--sb-cream)',
          marginBottom: '0.5rem',
        }}
      >
        {f.verse}
      </p>
      <p
        style={{
          fontSize: '0.78rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
        }}
      >
        {f.reference}
      </p>
    </div>
  );
}

function AboutBlock({ section }) {
  const f = section.fields || {};
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div className="sb-grid-2col-photo" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--sb-cream)',
            borderRadius: 'var(--sb-radius)',
            aspectRatio: '4 / 5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '0.5px solid var(--sb-taupe)',
          }}
        >
          <div style={{ textAlign: 'center', opacity: 0.4 }}>
            <div
              className="sb-display"
              style={{ fontSize: '3rem', color: 'var(--sb-navy)' }}
            >
              Betsy
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--sb-teal)', marginTop: '0.5rem' }}>
              [ Photo placeholder ]
            </p>
          </div>
        </div>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <h2
            className="sb-display"
            style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}
          >
            {f.heading}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          {[f.p1, f.p2, f.p3].filter(Boolean).map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: '0.96rem',
                lineHeight: 1.9,
                color: '#4a4a4a',
                marginBottom: '1rem',
              }}
            >
              {p}
            </p>
          ))}
          {f.howIWork && (
            <div
              style={{
                background: 'var(--sb-navy)',
                padding: '1.25rem 1.5rem',
                marginTop: '1.25rem',
                borderLeft: '3px solid var(--sb-gold)',
                borderRadius: 'var(--sb-radius)',
              }}
            >
              <div
                className="sb-label"
                style={{ color: 'var(--sb-gold)', marginBottom: '0.5rem' }}
              >
                How I Work
              </div>
              <div
                style={{ fontSize: '0.87rem', lineHeight: 1.75, color: 'var(--sb-sage)' }}
              >
                {f.howIWork}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CardsBlock({ section }) {
  const f = section.fields || {};
  const onDark = section.bg === 'navy' || section.bg === 'teal';
  const cards = [1, 2, 3, 4].map((i) => ({
    t: f[`card${i}Title`],
    d: f[`card${i}Desc`],
    icon: f[`card${i}Icon`],
  })).filter((c) => c.t);
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        padding: '5rem 2rem',
        color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2
          className="sb-display"
          style={{
            fontSize: '2.4rem',
            color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
            marginBottom: '0.75rem',
          }}
        >
          {f.heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
              maxWidth: 620,
              marginBottom: '2.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)`,
            gap: '1.5rem',
          }}
        >
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                background: onDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(196,132,58,0.05)',
                border: onDark
                  ? '0.5px solid rgba(232,221,208,0.12)'
                  : '0.5px solid rgba(196,132,58,0.2)',
                borderRadius: 'var(--sb-radius)',
                padding: '2rem 1.5rem',
              }}
            >
              {c.icon && (
                <div style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--sb-gold)' }}>
                  {c.icon}
                </div>
              )}
              <h3
                className="sb-display"
                style={{
                  fontSize: '1.2rem',
                  color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
                  marginBottom: '0.75rem',
                }}
              >
                {c.t}
              </h3>
              <p
                style={{
                  fontSize: '0.87rem',
                  lineHeight: 1.75,
                  color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
                }}
              >
                {c.d}
              </p>
            </div>
          ))}
        </div>
        {f.aiBadge && (
          <div
            style={{
              marginTop: '2.5rem',
              background: 'rgba(196,132,58,0.1)',
              border: '0.5px solid rgba(196,132,58,0.3)',
              borderRadius: 'var(--sb-radius)',
              padding: '1.5rem 2rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '1.75rem', flexShrink: 0, color: 'var(--sb-gold)' }}>✦</div>
            <p
              style={{
                fontSize: '0.87rem',
                lineHeight: 1.7,
                color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
              }}
            >
              {f.aiBadge}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function TwoColBlock({ section }) {
  const f = section.fields || {};
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-linen)',
        padding: '5rem 2rem',
      }}
    >
      <div className="sb-grid-2col" style={{ maxWidth: 1000, margin: '0 auto', gap: '4rem' }}>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <div
            className="sb-display"
            style={{ fontSize: '3rem', color: 'var(--sb-navy)', lineHeight: 1 }}
          >
            {f.heading}
          </div>
          {f.subheading && (
            <div
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--sb-teal-deep)',
                margin: '0.25rem 0 1.25rem',
              }}
            >
              {f.subheading}
            </div>
          )}
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          {[f.p1, f.p2].filter(Boolean).map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: '0.96rem',
                lineHeight: 1.85,
                color: '#5a4a3a',
                marginBottom: '1rem',
              }}
            >
              {p}
            </p>
          ))}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {f.cta1 && (
              <a href={f.cta1Link || '#'} className="sb-btn sb-btn-gold">
                {f.cta1}
              </a>
            )}
            {f.cta2 && (
              <a href={f.cta2Link || '#'} className="sb-btn sb-btn-outline-dark">
                {f.cta2}
              </a>
            )}
          </div>
        </div>
        <div
          style={{
            background: 'var(--sb-cream)',
            borderRadius: 'var(--sb-radius)',
            border: '0.5px solid var(--sb-taupe)',
            minHeight: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sb-teal-deep)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          [ Image placeholder ]
        </div>
      </div>
    </section>
  );
}

function ResumeBlock({ section }) {
  const f = section.fields || {};
  const roles = [1, 2, 3, 4, 5, 6]
    .map((i) => [f[`role${i}`], f[`role${i}Desc`]])
    .filter(([r]) => r);
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Professional Background
        </p>
        <h2
          className="sb-display"
          style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}
        >
          {f.heading || 'Experience'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: 'var(--sb-teal-deep)',
              maxWidth: 700,
              marginBottom: '2.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        <div
          style={{
            position: 'relative',
            paddingLeft: '2rem',
            marginTop: '1rem',
            borderLeft: '1.5px solid var(--sb-cream)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {roles.map(([role, desc], i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '-2.45rem',
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--sb-gold)',
                  border: '2px solid var(--sb-ivory)',
                }}
              />
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: 'var(--sb-navy)',
                  marginBottom: '0.4rem',
                }}
              >
                {role}
              </div>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#5a5a5a' }}>{desc}</div>
            </div>
          ))}
        </div>
        {f.education && (
          <div
            style={{
              marginTop: '2.5rem',
              padding: '1rem 1.25rem',
              background: 'var(--sb-cream)',
              borderRadius: 'var(--sb-radius)',
              borderLeft: '3px solid var(--sb-gold)',
              fontSize: '0.88rem',
              color: 'var(--sb-navy)',
              fontWeight: 500,
            }}
          >
            ◆ {f.education}
          </div>
        )}
      </div>
    </section>
  );
}

function SocialGridBlock({ section, config }) {
  const f = section.fields || {};
  const active = Object.values(config?.social || {}).filter((s) => s.on && s.url);
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Connect
        </p>
        <h2
          className="sb-display"
          style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}
        >
          {f.heading || 'Find Me Online'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: 'var(--sb-teal-deep)',
              maxWidth: 620,
              marginBottom: '1.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        {active.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic' }}>
            No social links enabled yet — add them in the config panel.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            {active.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem 1.25rem',
                  background: `${s.color}15`,
                  border: `0.5px solid ${s.color}40`,
                  borderRadius: 'var(--sb-radius)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: 'var(--sb-navy)',
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactBlock({ section, config }) {
  const f = section.fields || {};
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-linen)', padding: '5rem 2rem' }}
    >
      <div className="sb-grid-2col" style={{ maxWidth: 1000, margin: '0 auto', gap: '4rem' }}>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <h2
            className="sb-display"
            style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}
          >
            {f.heading}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <p style={{ fontSize: '0.96rem', lineHeight: 1.85, color: '#5a5a5a', marginBottom: '2rem' }}>
            {f.intro}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--sb-teal-deep)' }}>
              ◆ {config?.site?.domain || 'saltbasin.net'}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--sb-teal-deep)' }}>
              ◆ {f.location || 'St. Petersburg, Florida'}
            </div>
          </div>
        </div>
        <div>
          <InlineDataNotice dark={false} compact style={{ marginBottom: '1rem' }} />
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onSubmit={(e) => {
              e.preventDefault();
              alert('Contact submissions ship in Phase 5 — for now, reach out via the links above.');
            }}
          >
            <input className="sb-input sb-input-light" placeholder="Your Name" />
            <input className="sb-input sb-input-light" placeholder="Email" />
            <textarea
              className="sb-input sb-input-light sb-textarea"
              placeholder="Message"
            />
            <button type="submit" className="sb-btn sb-btn-gold" style={{ justifyContent: 'center' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function TextBlock({ section }) {
  const f = section.fields || {};
  const onDark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-ivory)',
        padding: '5rem 2rem',
        color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2
          className="sb-display"
          style={{
            fontSize: '2.4rem',
            color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
            marginBottom: '0.75rem',
          }}
        >
          {f.heading || section.name}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
              maxWidth: 660,
            }}
          >
            {f.intro}
          </p>
        )}
      </div>
    </section>
  );
}

function CtaBlock({ section }) {
  const f = section.fields || {};
  const onDark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-linen)',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h2
          className="sb-display"
          style={{
            fontSize: '2rem',
            color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
            marginBottom: '1rem',
          }}
        >
          {f.heading}
        </h2>
        {f.intro && (
          <p
            style={{
              fontSize: '0.95rem',
              color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
              marginBottom: '1.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        {f.cta1 && (
          <a href={f.cta1Link || '#contact'} className="sb-btn sb-btn-gold">
            {f.cta1}
          </a>
        )}
      </div>
    </section>
  );
}

// ── New blocks for the founder-first + platform-teaser layout ──

function IndustriesBlock({ section }) {
  const f = section.fields || {};
  const items = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => f[`i${i}`]).filter(Boolean);
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2
          className="sb-display"
          style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}
        >
          {f.heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: 'var(--sb-teal-deep)',
              maxWidth: 720,
              marginBottom: '2.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {items.map((label, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                border: '0.5px solid var(--sb-taupe)',
                borderLeft: '3px solid var(--sb-gold)',
                borderRadius: 'var(--sb-radius)',
                padding: '1rem 1.25rem',
                fontSize: '0.88rem',
                color: 'var(--sb-navy)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DomainsBlock({ section }) {
  const f = section.fields || {};
  const onDark = section.bg === 'navy' || section.bg === 'teal';
  const items = [1, 2, 3, 4, 5, 6, 7, 8]
    .map((i) => ({ title: f[`d${i}Title`], desc: f[`d${i}Desc`] }))
    .filter((d) => d.title);
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        padding: '5rem 2rem',
        color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2
          className="sb-display"
          style={{
            fontSize: '2.4rem',
            color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
            marginBottom: '0.75rem',
          }}
        >
          {f.heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.8,
              color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
              maxWidth: 720,
              marginBottom: '2.5rem',
            }}
          >
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((d, i) => (
            <div
              key={i}
              style={{
                background: onDark ? 'rgba(255,255,255,0.04)' : 'rgba(196,132,58,0.06)',
                border: onDark
                  ? '0.5px solid rgba(232,221,208,0.12)'
                  : '0.5px solid rgba(196,132,58,0.22)',
                borderRadius: 'var(--sb-radius)',
                padding: '1.5rem 1.25rem',
                borderTop: '2px solid var(--sb-gold)',
              }}
            >
              <h3
                className="sb-display"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 500,
                  color: onDark ? 'var(--sb-cream)' : 'var(--sb-navy)',
                  marginBottom: '0.55rem',
                  letterSpacing: '0.02em',
                }}
              >
                {d.title}
              </h3>
              <p
                style={{
                  fontSize: '0.86rem',
                  lineHeight: 1.7,
                  color: onDark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)',
                }}
              >
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesBlock({ section }) {
  const f = section.fields || {};
  const onDark = section.bg === 'navy' || section.bg === 'teal';
  const items = [1, 2, 3]
    .map((i) => ({
      title: f[`s${i}Title`],
      tag: f[`s${i}Tag`],
      desc: f[`s${i}Desc`],
      cta: f[`s${i}Cta`] || 'Inquire',
    }))
    .filter((s) => s.title);
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-linen)',
        padding: '5rem 2rem',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
          {f.heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-teal-deep)', maxWidth: 720, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                border: '0.5px solid var(--sb-taupe)',
                borderRadius: 'var(--sb-radius)',
                padding: '1.75rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-gold)',
                  fontWeight: 500,
                }}
              >
                {s.tag}
              </div>
              <h3
                className="sb-display"
                style={{ fontSize: '1.4rem', color: 'var(--sb-navy)', letterSpacing: '0.02em' }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#4a4a4a', flex: 1 }}>
                {s.desc}
              </p>
              <a
                href="#contact"
                className="sb-btn sb-btn-outline-dark"
                style={{ alignSelf: 'flex-start', padding: '0.6rem 1.2rem', fontSize: '0.72rem' }}
              >
                {s.cta} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssessmentsBlock({ section }) {
  const f = section.fields || {};
  const items = [1, 2, 3]
    .map((i) => ({
      title: f[`a${i}Title`],
      desc: f[`a${i}Desc`],
      price: f[`a${i}Price`],
    }))
    .filter((a) => a.title);
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        padding: '5rem 2rem',
        color: 'var(--sb-cream)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && (
          <p
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
              marginBottom: '0.5rem',
            }}
          >
            ◌ {f.eyebrow}
          </p>
        )}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-cream)', marginBottom: '0.75rem' }}>
          {f.heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-sage)', maxWidth: 720, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {items.map((a, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px dashed rgba(196,132,58,0.4)',
                borderRadius: 'var(--sb-radius)',
                padding: '1.75rem 1.5rem',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  fontSize: '0.62rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-gold)',
                  background: 'rgba(196,132,58,0.15)',
                  padding: '2px 8px',
                  borderRadius: 'var(--sb-radius)',
                }}
              >
                Soon
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sb-gold)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                {a.price}
              </div>
              <h3
                className="sb-display"
                style={{ fontSize: '1.25rem', color: 'var(--sb-cream)', marginBottom: '0.6rem', letterSpacing: '0.02em' }}
              >
                {a.title}
              </h3>
              <p style={{ fontSize: '0.86rem', lineHeight: 1.7, color: 'var(--sb-sage)' }}>{a.desc}</p>
            </div>
          ))}
        </div>
        <LeadCaptureForm
          source="assessments"
          ctaLabel={f.notifyLabel || 'Notify Me at Launch'}
          placeholder="your@email.com"
          thanks="Got it — you'll hear from me the moment they go live."
          dark
        />
      </div>
    </section>
  );
}

function LeadCaptureForm({ source, ctaLabel, placeholder, thanks, dark, message }) {
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, email, message }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Submit failed');
      // Take the lead to their own record. They can bookmark and return.
      window.location.assign(body.leadUrl);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <InlineDataNotice dark={dark} compact style={{ marginBottom: '0.75rem' }} />
      <form
        onSubmit={submit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className={dark ? 'sb-input' : 'sb-input sb-input-light'}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button type="submit" className="sb-btn sb-btn-gold" disabled={submitting}>
          {submitting ? '…' : ctaLabel}
        </button>
        {error && (
          <div style={{ width: '100%', color: 'var(--sb-risk-critical)', fontSize: '0.78rem' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

function JoinNetworkBlock({ section }) {
  const f = section.fields || {};
  const bullets = [f.bullet1, f.bullet2, f.bullet3].filter(Boolean);
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-cream)', padding: '5rem 2rem' }}
    >
      <div className="sb-grid-2col-pitch" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            {f.heading}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', marginBottom: '1.5rem' }}>
            {f.intro}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--sb-navy)',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>◆</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            background: 'white',
            border: '0.5px solid var(--sb-taupe)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '2rem',
          }}
        >
          <div
            className="sb-eyebrow"
            style={{ color: 'var(--sb-gold)', marginBottom: '0.75rem' }}
          >
            Early Access
          </div>
          <h3 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '1rem' }}>
            {f.cta || 'Get on the early list'}
          </h3>
          <LeadCaptureForm
            source="joinNetwork"
            ctaLabel="Notify Me"
            placeholder={f.placeholder || 'your@email.com'}
            thanks={f.thanks || 'On the list.'}
          />
        </div>
      </div>
    </section>
  );
}

function ForCompaniesBlock({ section }) {
  const f = section.fields || {};
  const bullets = [f.bullet1, f.bullet2, f.bullet3].filter(Boolean);
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div className="sb-grid-2col-pitch" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--sb-navy)',
            color: 'var(--sb-cream)',
            border: '0.5px solid rgba(196,132,58,0.4)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '2rem',
          }}
        >
          <div
            className="sb-eyebrow"
            style={{ color: 'var(--sb-gold)', marginBottom: '0.75rem' }}
          >
            Start the Conversation
          </div>
          <h3 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-cream)', marginBottom: '1rem' }}>
            {f.cta || 'Reach out'}
          </h3>
          <LeadCaptureForm
            source="forCompanies"
            ctaLabel="Connect"
            placeholder={f.placeholder || 'work email'}
            thanks={f.thanks || 'Talk soon.'}
            dark
          />
        </div>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            {f.heading}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', marginBottom: '1.5rem' }}>
            {f.intro}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--sb-navy)',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>◆</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Phase 2.5 blocks: Industry Wheel + Technology Experience ──

// Wheel data is part of the block field set so future iterations can be
// admin-editable. For now it ships hardcoded in the seed; the renderer just
// trusts the shape.
const DEFAULT_DOMAIN_CATEGORIES = [
  {
    title: 'Strategic',
    icon: '◆',
    domains: [
      { title: 'Executive Strategy & C-Suite Partnership', desc: 'Translating revenue targets and board mandates into system-level execution plans.' },
      { title: 'Financial Modeling & Scenario Planning', desc: 'Operating models, unit economics, scenario builds for investor and board packages.' },
      { title: 'Enterprise / Org Intelligence & Infrastructure Scaffolding', desc: 'The org-design and data-spine work that makes the rest of the operation legible.' },
    ],
  },
  {
    title: 'Growth & Operational Excellence',
    icon: '▲',
    domains: [
      { title: 'RevOps & GTM Systems', desc: 'Pipeline hygiene, forecasting, territory, attribution — CRM as a system, not a graveyard.' },
      { title: 'Quote-to-Revenue Transformation', desc: 'Lead-to-cash, CPQ + billing alignment, deal-desk operations, RevRec controls.' },
      { title: 'Data & Lead-to-Cash Architecture', desc: 'The data plumbing from first touch through invoice — modeled, instrumented, governed.' },
    ],
  },
  {
    title: 'Monitoring',
    icon: '●',
    domains: [
      { title: 'Enterprise Risk & Crisis Advisory', desc: 'NASDAQ delisting, restructuring, deal-stage triage. Calm execution under board-level pressure.' },
      { title: 'Governance', desc: 'Decision rights, approvals, audit trails — the rails that keep growth from breaking compliance.' },
      { title: 'Data Quality', desc: 'Source-of-truth alignment, lineage, reconciliation — clean inputs make every downstream system trustworthy.' },
      { title: 'Bookings Reconciliations & Operating Financials', desc: 'Ledger-to-CRM ties, ARR/MRR roll-forwards, deferred-revenue waterfalls — close-readiness across the stack.' },
    ],
  },
];

const INDUSTRY_TAILORED = {
  pe: {
    label: 'Private Equity',
    intro: 'Operator support across the lifecycle — from deal team to portfolio CFO to value-creation hands.',
    domains: [
      { title: 'Sourcing & Deal Scoring', desc: 'Sector mapping, scoring frameworks, top-of-funnel discipline.' },
      { title: 'Due Diligence', desc: 'Commercial, operational, and systems DD. Models and findings ready for IC.' },
      { title: 'Value Creation Planning', desc: 'First-100-day plans, integration roadmaps, EBITDA bridges with named owners.' },
      { title: 'Value Creation Execution', desc: 'Hands-on operator support inside the portco — Q2R, RevOps, finance systems.' },
      { title: 'Portfolio Company Monitoring', desc: 'KPI cadences, board-pack instrumentation, exception triage.' },
    ],
    callout: 'Data Platform focus: bridging the gap between fund expectations, portfolio budgets, actuals, and the confidence gradient in between. Single pane of glass from LP letter to operating ledger.',
  },
};

const INDUSTRIES = [
  { key: 'hightech', label: 'High Tech / SaaS', icon: '◇' },
  { key: 'pe', label: 'Private Equity', icon: '◈' },
  { key: 'peportco', label: 'PE / VC Portcos', icon: '◉' },
  { key: 'mfg', label: 'Manufacturing', icon: '⚙' },
  { key: 'finserv', label: 'FinServ / FinTech', icon: '◎' },
  { key: 're', label: 'Real Estate', icon: '◫' },
  { key: 'edu', label: 'Education', icon: '◰' },
  { key: 'pub', label: 'Publishing', icon: '◱' },
];

// Per-industry dashboard data — surfaced in the top-right panel when an
// industry is selected on the wheel. Seeded from resume where I can infer it;
// FinServ and Real Estate are placeholders for now.
const INDUSTRY_DASHBOARDS = {
  hightech: {
    clientCount: '8+',
    revenueRange: '$50M – $3.7B+',
    description:
      'Lead-to-cash builds for high-growth SaaS and technology companies — CPQ, billing, RevOps, and the data plumbing under them.',
    notable: [
      '$2.6B virtual healthcare platform — CPQ + billing systems (PwC)',
      '$3.7B+ global positioning technology company — CPQ delivery (PwC)',
      'Cross-portfolio Q2R lifts at PwC and Slalom',
    ],
    workTypes: ['Q2R Transformation', 'CPQ + Billing', 'RevOps', 'GTM Systems'],
  },
  pe: {
    clientCount: 'Fund-level',
    revenueRange: 'Across portfolio',
    description:
      'Operator support to PE funds across deal team, ops, and portfolio CFO roles. Vista Equity Partners (direct) plus deal/integration support through consulting tenure.',
    notable: [
      'Vista Equity Partners — Senior Consultant',
      'Cross-portfolio system changes tied to pricing strategy and revenue generation',
    ],
    workTypes: ['Value Creation Execution', 'Portfolio Operator Support', 'Due Diligence'],
  },
  peportco: {
    clientCount: '6+',
    revenueRange: '$50M – $615M typical',
    description:
      'Operating inside PE/VC-backed portfolio companies — system rebuilds, crisis advisory, and revenue-engine resets.',
    notable: [
      '$615M healthcare IT — NASDAQ delisting crisis support (Slalom)',
      'Vista portco operating model resets',
      'Mid-market SaaS portcos — Q2R + RevOps rebuilds',
    ],
    workTypes: ['Crisis Advisory', 'Operating Model Resets', 'Q2R Lift', 'RevRec Stabilization'],
  },
  mfg: {
    clientCount: '2+',
    revenueRange: '$9B – $38B+',
    description:
      'Enterprise Q2R and billing architecture for large-scale industrial and semiconductor manufacturers.',
    notable: [
      '$9B global industrial automation manufacturer — Q2R transformation (Slalom)',
      '$38B+ semiconductor company — usage-based billing design (Slalom)',
    ],
    workTypes: ['Q2R Transformation', 'Usage-Based Billing', 'CPQ Architecture'],
  },
  finserv: {
    clientCount: '[Add via admin]',
    revenueRange: '[Add range]',
    description:
      'FinServ / FinTech engagement detail to be added. Add specific clients and work performed via the admin.',
    notable: [],
    workTypes: [],
  },
  re: {
    clientCount: '[Add via admin]',
    revenueRange: '[Add range]',
    description:
      'Real Estate engagement detail to be added. Add specific clients and work performed via the admin.',
    notable: [],
    workTypes: [],
  },
  edu: {
    clientCount: '1+',
    revenueRange: '$4.5B+',
    description:
      'Enterprise business analysis and systems integration for global education and publishing platforms.',
    notable: [
      '$4.5B+ global education and publishing company — business analysis and systems integration (Accenture)',
    ],
    workTypes: ['Business Analysis', 'Systems Integration', 'Order-to-Cash'],
  },
  pub: {
    clientCount: '1+',
    revenueRange: '$4.5B+',
    description:
      'Publishing engagements straddle the education work — enterprise systems integration and operations support.',
    notable: [
      '$4.5B+ global education and publishing company — business analysis and systems integration (Accenture)',
    ],
    workTypes: ['Business Analysis', 'Systems Integration'],
  },
};

// Niche solution categories — bottom-right tabbed panel.
const NICHE_SOLUTIONS = [
  {
    key: 'pe',
    label: 'Private Equity',
    icon: '◈',
    intro: 'Operator support across the lifecycle — from deal team to portfolio CFO to value-creation hands.',
    domains: [
      { title: 'Sourcing & Deal Scoring', desc: 'Sector mapping, scoring frameworks, top-of-funnel discipline.' },
      { title: 'Due Diligence', desc: 'Commercial, operational, and systems DD. Models and findings ready for IC.' },
      { title: 'Value Creation Planning', desc: 'First-100-day plans, integration roadmaps, EBITDA bridges with named owners.' },
      { title: 'Value Creation Execution', desc: 'Hands-on operator support inside the portco — Q2R, RevOps, finance systems.' },
      { title: 'Portfolio Company Monitoring', desc: 'KPI cadences, board-pack instrumentation, exception triage.' },
    ],
    callout:
      'Data Platform focus: bridging the gap between fund expectations, portfolio budgets, actuals, and the confidence gradient in between. Single pane of glass from LP letter to operating ledger.',
    calloutLabel: '◆ Specialized Data Platform Focus',
  },
  {
    key: 'ai',
    label: 'All Things AI',
    icon: '✦',
    intro: 'AI advisory grounded in operating fluency — readiness, modeling, ROI.',
    domains: [
      { title: 'Data Readiness Assessment', desc: 'Score your data foundation for AI workloads — lineage, freshness, governance, and the gaps that block first-value.' },
      { title: 'Data Modeling', desc: 'Modeling for AI consumption — feature stores, vector schemas, retrieval-friendly structures, and the human-loop tagging that keeps them right.' },
      { title: 'AI ROI', desc: 'Quantifying the business case for AI initiatives — operating-model impact, cost-to-build vs. cost-of-status-quo, time-to-confidence framework.' },
    ],
  },
  {
    key: 'dai',
    label: 'Data Aggregation Intelligence',
    icon: '◰',
    intro: 'Modern master data and zero-copy patterns that make agentic layers reliable.',
    domains: [
      { title: 'Modern MDM Solutions', desc: 'Master data management for the cloud-native, multi-source era — Reltio, Profisee, Snowflake-native patterns, and the governance model around them.' },
      { title: 'Zero-Copy for Agentic Layers', desc: 'Cross-system intelligence without ETL sprawl — zero-copy patterns (Snowflake, Databricks, Iceberg) that power agents with single-source-of-truth context.' },
    ],
  },
];

// Track viewport width so child grids can pick a layout. Returns 0 during SSR.
function useViewportWidth() {
  const [w, setW] = React.useState(
    typeof window === 'undefined' ? 1200 : window.innerWidth
  );
  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

function IndustryWheelBlock({ section }) {
  const f = section.fields || {};
  const [selected, setSelected] = React.useState(null);
  const [niche, setNiche] = React.useState('pe');
  const viewportWidth = useViewportWidth();

  // Wheel scales down on smaller screens so it fits and the node labels stay
  // legible. Phone (≤ 480) gets 260px, tablet (≤ 768) gets 320, desktop 360.
  const wheelSize = viewportWidth <= 480 ? 260 : viewportWidth <= 768 ? 320 : 360;
  const nodeSize = viewportWidth <= 480 ? 58 : viewportWidth <= 768 ? 64 : 72;
  const radius = wheelSize / 2 - nodeSize / 2 - 6;
  const center = wheelSize / 2;
  const nodes = INDUSTRIES.map((ind, i) => {
    const angle = (Math.PI * 2 * i) / INDUSTRIES.length - Math.PI / 2;
    return {
      ...ind,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
  const selectedInd = selected ? INDUSTRIES.find((i) => i.key === selected) : null;
  const dashboard = selected ? INDUSTRY_DASHBOARDS[selected] : null;

  const handsOn = parseTechList(f.handsOn);
  const integrationDesign = parseTechList(f.integrationDesign);
  const adjacent = parseTechList(f.adjacent);

  const activeNiche = NICHE_SOLUTIONS.find((n) => n.key === niche) || NICHE_SOLUTIONS[0];

  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
          {f.heading || 'Industries Served × Domains of Expertise'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-teal-deep)', maxWidth: 800, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}

        {/* TOP ROW: Wheel | Right panel (Tech default / Dashboard on select) */}
        <div className="sb-grid-wheel" style={{ marginBottom: '2rem' }}>
          {/* WHEEL */}
          <PanelCard title="Industries Served · click any to focus">
            <div style={{ position: 'relative', width: wheelSize, height: wheelSize, margin: '0 auto' }}>
              <svg
                width={wheelSize}
                height={wheelSize}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(196,132,58,0.18)" strokeWidth="0.5" />
                <circle cx={center} cy={center} r={radius - 32} fill="none" stroke="rgba(196,132,58,0.1)" strokeWidth="0.5" strokeDasharray="2 4" />
                {nodes.map((n) => (
                  <line
                    key={n.key}
                    x1={center}
                    y1={center}
                    x2={n.x}
                    y2={n.y}
                    stroke={
                      selected === n.key ? 'var(--sb-gold)' : selected ? 'rgba(196,132,58,0.1)' : 'rgba(196,132,58,0.22)'
                    }
                    strokeWidth={selected === n.key ? 1.5 : 0.5}
                  />
                ))}
              </svg>
              <div
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute',
                  left: center - nodeSize / 2,
                  top: center - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  background: 'var(--sb-navy)',
                  color: 'var(--sb-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--sb-font-display)',
                  fontSize: nodeSize >= 70 ? '0.9rem' : '0.78rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: '1.5px solid var(--sb-gold)',
                  textAlign: 'center',
                  zIndex: 2,
                  lineHeight: 1.1,
                }}
                title="Reset to all-industry view"
              >
                Salt<br />Basin
              </div>
              {nodes.map((n) => {
                const isSelected = selected === n.key;
                const isDimmed = selected && !isSelected;
                return (
                  <button
                    key={n.key}
                    onClick={() => setSelected(n.key)}
                    style={{
                      position: 'absolute',
                      left: n.x - nodeSize / 2,
                      top: n.y - nodeSize / 2,
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: '50%',
                      background: isSelected ? 'var(--sb-gold)' : 'white',
                      color: isSelected ? 'var(--sb-ivory)' : 'var(--sb-navy)',
                      border: isSelected ? '1.5px solid var(--sb-gold-warm)' : '0.5px solid var(--sb-taupe)',
                      opacity: isDimmed ? 0.45 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontFamily: 'var(--sb-font-body)',
                      fontSize: nodeSize >= 70 ? '0.58rem' : '0.52rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '0 3px',
                      transition: 'all 0.18s',
                      boxShadow: isSelected ? '0 4px 14px rgba(196,132,58,0.35)' : '0 1px 3px rgba(0,0,0,0.06)',
                      zIndex: isSelected ? 3 : 1,
                    }}
                    title={n.label}
                  >
                    <span style={{ fontSize: '1rem', marginBottom: 2 }}>{n.icon}</span>
                    <span style={{ lineHeight: 1.1, textAlign: 'center' }}>{n.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.74rem', color: 'var(--sb-teal-deep)', textAlign: 'center', lineHeight: 1.5 }}>
              {selected ? (
                <>Showing client snapshot for <strong>{selectedInd?.label}</strong>. Click center to reset.</>
              ) : (
                'Right panel shows my tech & capability stack. Click an industry to see a client snapshot.'
              )}
            </div>
          </PanelCard>

          {/* RIGHT PANEL: Tech & Capability OR Industry Dashboard */}
          <PanelCard
            title={selected ? `${selectedInd?.label} · Client Snapshot` : 'Tech & Capability Experience'}
          >
            {selected ? (
              <IndustryDashboard industry={selectedInd} data={dashboard} />
            ) : (
              <TechCapabilitySummary handsOn={handsOn} integrationDesign={integrationDesign} adjacent={adjacent} />
            )}
          </PanelCard>
        </div>

        {/* ANCHOR for nav: Domains & Niche Expertise */}
        <div id="domains-niche" style={{ paddingTop: 8 }} />

        {/* FULL-WIDTH ROW: Categorized Domains */}
        <PanelCard title="Domains of Expertise · categorized" style={{ marginBottom: '2rem' }}>
          <DefaultDomainsPanel />
        </PanelCard>

        {/* FULL-WIDTH ROW: Niche Solutions */}
        <PanelCard
          title="Niche Solutions"
          headerRight={
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {NICHE_SOLUTIONS.map((n) => {
                const active = niche === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => setNiche(n.key)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      background: active ? 'var(--sb-gold)' : 'transparent',
                      color: active ? 'var(--sb-ivory)' : 'var(--sb-teal-deep)',
                      border: '0.5px solid ' + (active ? 'var(--sb-gold-warm)' : 'var(--sb-taupe)'),
                      borderRadius: 'var(--sb-radius)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'var(--sb-font-body)',
                    }}
                  >
                    <span style={{ marginRight: 4 }}>{n.icon}</span>
                    {n.label}
                  </button>
                );
              })}
            </div>
          }
        >
          <NicheContent data={activeNiche} />
        </PanelCard>
      </div>
    </section>
  );
}

function PanelCard({ title, children, headerRight, style }) {
  return (
    <div
      style={{
        background: 'white',
        border: '0.5px solid var(--sb-taupe)',
        borderTop: '2px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '1.25rem 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '0.5px solid rgba(196,132,58,0.18)',
        }}
      >
        <div
          className="sb-label"
          style={{ color: 'var(--sb-gold)', fontSize: '0.62rem', letterSpacing: '0.18em' }}
        >
          {title}
        </div>
        {headerRight}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function DefaultDomainsPanel() {
  // Each category gets one column. Domains inside the column are individual
  // tiles with icon, title, and short desc — visually distinct cards so the
  // section reads as a portfolio, not a wall of text.
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {DEFAULT_DOMAIN_CATEGORIES.map((cat) => (
        <div
          key={cat.title}
          style={{
            background: 'linear-gradient(180deg, rgba(196,132,58,0.07) 0%, rgba(196,132,58,0.02) 100%)',
            border: '0.5px solid rgba(196,132,58,0.22)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Category header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1rem',
              paddingBottom: '0.65rem',
              borderBottom: '0.5px dashed rgba(196,132,58,0.3)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--sb-navy)',
                color: 'var(--sb-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              {cat.icon}
            </div>
            <div>
              <div
                className="sb-label"
                style={{
                  color: 'var(--sb-gold)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.16em',
                  marginBottom: 1,
                }}
              >
                Category
              </div>
              <h3
                className="sb-display"
                style={{ fontSize: '1.15rem', color: 'var(--sb-navy)', letterSpacing: '0.02em', lineHeight: 1.1 }}
              >
                {cat.title}
              </h3>
            </div>
          </div>

          {/* Domain tiles inside the category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
            {cat.domains.map((d, i) => (
              <div
                key={d.title}
                style={{
                  background: 'white',
                  border: '0.5px solid rgba(196,132,58,0.18)',
                  borderRadius: 'var(--sb-radius)',
                  padding: '0.7rem 0.85rem',
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(196,132,58,0.15)',
                    color: 'var(--sb-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--sb-navy)', marginBottom: 3 }}>
                    {d.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', lineHeight: 1.55, color: 'var(--sb-teal-deep)' }}>
                    {d.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NicheContent({ data }) {
  return (
    <div>
      {data.intro && (
        <p style={{ fontSize: '0.88rem', color: 'var(--sb-teal-deep)', lineHeight: 1.7, marginBottom: '1rem' }}>
          {data.intro}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: data.callout ? '1.25rem' : 0 }}>
        {data.domains.map((d, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(196,132,58,0.05)',
              border: '0.5px solid rgba(196,132,58,0.18)',
              borderLeft: '3px solid var(--sb-gold)',
              borderRadius: 'var(--sb-radius)',
              padding: '0.8rem 1rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--sb-navy)', marginBottom: 2 }}>
              {d.title}
            </div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--sb-teal-deep)' }}>
              {d.desc}
            </div>
          </div>
        ))}
      </div>
      {data.callout && (
        <div
          style={{
            background: 'var(--sb-navy)',
            color: 'var(--sb-cream)',
            border: '0.5px solid rgba(196,132,58,0.4)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '1rem 1.25rem',
          }}
        >
          <div className="sb-label" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem', fontSize: '0.6rem', letterSpacing: '0.18em' }}>
            {data.calloutLabel || '◆ Special Focus'}
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--sb-sage)' }}>
            {data.callout}
          </div>
        </div>
      )}
    </div>
  );
}

function IndustryDashboard({ industry, data }) {
  if (!data) return null;
  return (
    <div>
      {/* Headline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <StatBox label="Clients" value={data.clientCount} />
        <StatBox label="Revenue Range" value={data.revenueRange} />
      </div>

      <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--sb-teal-deep)', marginBottom: '1.25rem' }}>
        {data.description}
      </p>

      {/* Work-type badges */}
      {data.workTypes?.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.6rem', letterSpacing: '0.16em', marginBottom: '0.5rem' }}>
            Work Performed
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {data.workTypes.map((w) => (
              <span
                key={w}
                style={{
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(196,132,58,0.12)',
                  border: '0.5px solid rgba(196,132,58,0.3)',
                  borderRadius: 'var(--sb-radius)',
                  fontSize: '0.74rem',
                  color: 'var(--sb-navy)',
                  fontWeight: 500,
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notable engagements */}
      {data.notable?.length > 0 ? (
        <div>
          <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.6rem', letterSpacing: '0.16em', marginBottom: '0.5rem' }}>
            Notable Engagements
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.notable.map((n, i) => (
              <li
                key={i}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--sb-navy)',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                  lineHeight: 1.55,
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>◆</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
          Notable engagements will be added here.
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--sb-navy)',
        color: 'var(--sb-cream)',
        borderTop: '2px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '0.85rem 1rem',
      }}
    >
      <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.58rem', letterSpacing: '0.16em', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div
        className="sb-display"
        style={{ fontSize: '1.3rem', color: 'var(--sb-cream)', fontWeight: 500, lineHeight: 1.1, letterSpacing: '0.02em' }}
      >
        {value}
      </div>
    </div>
  );
}

function TechCapabilitySummary({ handsOn, integrationDesign, adjacent }) {
  const buckets = [
    { title: 'Hands-On Implementation', subtitle: 'Direct build / configure / deliver', items: handsOn },
    { title: 'Integration Designs · Adjacent Systems', subtitle: 'Architected interfaces & data flows', items: integrationDesign },
    { title: 'Adjacent Project Exposure', subtitle: 'Encountered, observed, briefed', items: adjacent },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {buckets.map((b) => (
        <div
          key={b.title}
          style={{
            background: 'rgba(196,132,58,0.04)',
            border: '0.5px solid rgba(196,132,58,0.18)',
            borderLeft: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--sb-navy)' }}>{b.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)', marginTop: 1 }}>{b.subtitle}</div>
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                background: 'rgba(196,132,58,0.12)',
                color: 'var(--sb-gold)',
                borderRadius: 'var(--sb-radius)',
                fontWeight: 500,
              }}
            >
              {b.items.length} tools
            </span>
          </div>
          {b.items.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>Add tools here.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {b.items.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.55rem',
                    background: 'white',
                    border: '0.5px solid var(--sb-taupe)',
                    borderRadius: 'var(--sb-radius)',
                    fontSize: '0.76rem',
                    color: 'var(--sb-navy)',
                  }}
                >
                  <TechLogo slug={t.slug} label={t.label} size={20} />
                  {t.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Technology Experience block ──

// simple-icons CDN URLs. Renderer falls back to initials box when slug is empty
// or when the image fails to load.
function TechLogo({ slug, label, size = 36 }) {
  const [errored, setErrored] = React.useState(false);
  if (!slug || errored) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--sb-radius)',
          background: 'rgba(196,132,58,0.12)',
          border: '0.5px solid rgba(196,132,58,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          color: 'var(--sb-gold)',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {(label || '?').split(/[\s/]+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}/C4843A`}
      alt={label}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--sb-radius)',
        flexShrink: 0,
        background: 'white',
        padding: 4,
        border: '0.5px solid var(--sb-taupe)',
      }}
    />
  );
}

function TechCategory({ title, subtitle, items }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(232,221,208,0.12)',
        borderTop: '2px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '1.5rem',
      }}
    >
      <h3
        className="sb-display"
        style={{ fontSize: '1.2rem', color: 'var(--sb-cream)', marginBottom: '0.25rem', letterSpacing: '0.02em' }}
      >
        {title}
      </h3>
      <div
        style={{ fontSize: '0.72rem', color: 'var(--sb-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}
      >
        {subtitle}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {items.length === 0 && (
          <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
            Add technologies here.
          </div>
        )}
        {items.map((t, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.4rem',
              borderRadius: 'var(--sb-radius)',
            }}
          >
            <TechLogo slug={t.slug} label={t.label} size={32} />
            <span style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', fontWeight: 500 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseTechList(raw) {
  // Supports either an array (richer admin editor later) or a comma-separated
  // string of `Label:slug` pairs (current admin editor reality). Empty parts
  // get filtered out.
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, slug] = part.split(':').map((s) => s.trim());
      return { label, slug: slug || '' };
    });
}

function TechnologyBlock({ section }) {
  const f = section.fields || {};
  const handsOn = parseTechList(f.handsOn);
  const integrationDesign = parseTechList(f.integrationDesign);
  const adjacent = parseTechList(f.adjacent);

  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        padding: '5rem 2rem',
        color: 'var(--sb-cream)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-cream)', marginBottom: '0.75rem' }}>
          {f.heading || 'Technology Experience'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-sage)', maxWidth: 760, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <TechCategory
            title="Hands-On Implementation"
            subtitle="Direct build / configure / deliver"
            items={handsOn}
          />
          <TechCategory
            title="Integration Designs in Adjacent Systems"
            subtitle="Architected interfaces & data flows"
            items={integrationDesign}
          />
          <TechCategory
            title="Adjacent Project Exposure"
            subtitle="Encountered, observed, briefed"
            items={adjacent}
          />
        </div>
      </div>
    </section>
  );
}

// ── Phase 3 blocks: aboutIntro (split hero), timeline, caseStudies ──

function AboutIntroBlock({ section, config }) {
  const f = section.fields || {};
  const bullets = [f.bullet1, f.bullet2, f.bullet3].filter(Boolean);
  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-navy)',
        padding: '5rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hidden anchor for the Home nav dropdown */}
      <div id="about-intro" style={{ position: 'absolute', top: 0 }} />
      <div className="sb-grid-2col-balanced" style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* LEFT — Face of the Founder */}
        <div>
          <div className="sb-eyebrow" style={{ marginBottom: '1rem' }}>
            {f.leftEyebrow || 'Face of the Founder'}
          </div>
          <div
            className="sb-grid-2col-photo"
            style={{ gap: '1.5rem' }}
          >
            {f.photoUrl ? (
              <img
                src={f.photoUrl}
                alt={f.heading || 'Founder photo'}
                style={{
                  width: 180,
                  height: 220,
                  objectFit: 'cover',
                  border: '0.5px solid var(--sb-taupe)',
                  borderTop: '3px solid var(--sb-gold)',
                  borderRadius: 'var(--sb-radius)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 220,
                  background: 'var(--sb-cream)',
                  border: '0.5px solid var(--sb-taupe)',
                  borderTop: '3px solid var(--sb-gold)',
                  borderRadius: 'var(--sb-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--sb-teal-deep)',
                  fontFamily: 'var(--sb-font-display)',
                  fontSize: '3rem',
                  position: 'relative',
                }}
                title="Photo placeholder — upload via admin"
              >
                <span style={{ opacity: 0.4 }}>Betsy</span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    fontSize: '0.6rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--sb-teal-deep)',
                    opacity: 0.7,
                  }}
                >
                  [ Photo ]
                </span>
              </div>
            )}
            <div>
              <h1
                className="sb-display"
                style={{
                  fontSize: '2.8rem',
                  letterSpacing: '0.04em',
                  color: 'var(--sb-cream)',
                  marginBottom: '0.4rem',
                  lineHeight: 1.05,
                }}
              >
                {f.heading || 'Betsy Salter'}
              </h1>
              <div
                style={{
                  fontFamily: 'var(--sb-font-label)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-gold)',
                  marginBottom: '1rem',
                }}
              >
                {f.title || 'Strategic Operator'}
              </div>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.75,
                  color: 'var(--sb-sage)',
                }}
              >
                {f.leftBlurb}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                {f.cta1 && (
                  <a href={f.cta1Link || '#contact'} className="sb-btn sb-btn-gold" style={{ fontSize: '0.72rem', padding: '0.55rem 1.25rem' }}>
                    {f.cta1}
                  </a>
                )}
                {f.cta2 && (
                  <a href={f.cta2Link || '#contact'} className="sb-btn sb-btn-outline" style={{ fontSize: '0.72rem', padding: '0.55rem 1.25rem' }}>
                    {f.cta2}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Salt Basin Mission */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(196,132,58,0.4)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '2rem',
          }}
        >
          <div className="sb-eyebrow" style={{ marginBottom: '0.75rem' }}>
            {f.rightEyebrow || 'Salt Basin Mission · Short-Term Growth'}
          </div>
          <h2
            className="sb-display"
            style={{
              fontSize: '2rem',
              color: 'var(--sb-cream)',
              marginBottom: '0.75rem',
              letterSpacing: '0.02em',
              lineHeight: 1.15,
            }}
          >
            {f.missionHeading || 'A network for the best of the best.'}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.25rem' }} />
          <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--sb-sage)', marginBottom: '1.25rem' }}>
            {f.missionBody}
          </p>
          {bullets.length > 0 && (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--sb-cream)',
                    paddingLeft: '1.25rem',
                    position: 'relative',
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>◆</span>
                  {b}
                </li>
              ))}
            </ul>
          )}
          {f.platformLine && (
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '0.5px dashed rgba(196,132,58,0.3)',
                fontSize: '0.78rem',
                color: 'var(--sb-dusty)',
                lineHeight: 1.6,
                opacity: 0.85,
              }}
            >
              {f.platformLine}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Timeline data — each job is a card pulled from her resume. Click a dot to
// expand and show the verbatim bullets.
function TimelineBlock({ section }) {
  const f = section.fields || {};
  // The seed packs job data into structured fields: job1Company, job1Title,
  // job1Dates, job1Bullets (newline-separated). Up to 8 jobs.
  const jobs = [];
  for (let i = 1; i <= 10; i++) {
    const company = f[`job${i}Company`];
    if (!company) continue;
    jobs.push({
      key: `job${i}`,
      company,
      title: f[`job${i}Title`] || '',
      dates: f[`job${i}Dates`] || '',
      bullets: (f[`job${i}Bullets`] || '').split('\n').map((s) => s.trim()).filter(Boolean),
    });
  }
  const [selected, setSelected] = React.useState(jobs[jobs.length - 1]?.key || null);
  const activeJob = jobs.find((j) => j.key === selected) || jobs[0];

  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
          {f.heading || 'Professional Experience Evolution'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-teal-deep)', maxWidth: 800, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}

        {/* Horizontal timeline */}
        <div
          style={{
            position: 'relative',
            paddingTop: '0.75rem',
            paddingBottom: '0.5rem',
            overflowX: 'auto',
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: 'absolute',
              left: '2.5%',
              right: '2.5%',
              top: 30,
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--sb-gold), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${jobs.length}, minmax(120px, 1fr))`,
              gap: 0,
              minWidth: jobs.length * 120,
            }}
          >
            {jobs.map((job) => {
              const isActive = job.key === selected;
              return (
                <button
                  key={job.key}
                  onClick={() => setSelected(job.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontFamily: 'var(--sb-font-body)',
                  }}
                >
                  <div
                    style={{
                      width: isActive ? 20 : 14,
                      height: isActive ? 20 : 14,
                      borderRadius: '50%',
                      background: isActive ? 'var(--sb-gold)' : 'white',
                      border: isActive ? '2.5px solid var(--sb-gold-warm)' : '2px solid var(--sb-gold)',
                      marginTop: isActive ? 20 : 23,
                      marginBottom: '0.65rem',
                      boxShadow: isActive ? '0 0 0 4px rgba(196,132,58,0.18)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: isActive ? 'var(--sb-navy)' : 'var(--sb-teal-deep)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    {job.company}
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.04em',
                      color: 'var(--sb-teal-deep)',
                      textAlign: 'center',
                      lineHeight: 1.25,
                    }}
                  >
                    {job.dates}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active job card */}
        {activeJob && (
          <div
            style={{
              marginTop: '2rem',
              background: 'white',
              border: '0.5px solid var(--sb-taupe)',
              borderTop: '3px solid var(--sb-gold)',
              borderRadius: 'var(--sb-radius)',
              padding: '1.75rem 2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div className="sb-eyebrow" style={{ marginBottom: '0.25rem' }}>
                  {activeJob.dates}
                </div>
                <h3
                  className="sb-display"
                  style={{
                    fontSize: '1.75rem',
                    color: 'var(--sb-navy)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeJob.company}
                </h3>
                <div
                  style={{
                    fontFamily: 'var(--sb-font-label)',
                    fontSize: '0.85rem',
                    color: 'var(--sb-teal-deep)',
                    fontStyle: 'italic',
                    marginTop: 2,
                  }}
                >
                  {activeJob.title}
                </div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeJob.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.75,
                    color: '#4a4a4a',
                    paddingLeft: '1.5rem',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--sb-gold)',
                      fontSize: '1.05rem',
                      lineHeight: 1.5,
                    }}
                  >
                    ·
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {f.educationLine && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.9rem 1.25rem',
              background: 'var(--sb-cream)',
              borderRadius: 'var(--sb-radius)',
              borderLeft: '3px solid var(--sb-gold)',
              fontSize: '0.88rem',
              color: 'var(--sb-navy)',
              fontWeight: 500,
            }}
          >
            ◆ {f.educationLine}
          </div>
        )}
      </div>
    </section>
  );
}

function CaseStudiesBlock({ section }) {
  const f = section.fields || {};
  const cases = [];
  for (let i = 1; i <= 5; i++) {
    const title = f[`case${i}Title`];
    if (!title) continue;
    cases.push({
      key: `case${i}`,
      title,
      subtitle: f[`case${i}Subtitle`] || '',
      context: (f[`case${i}Context`] || '').split('\n').map((s) => s.trim()).filter(Boolean),
      role: f[`case${i}Role`] || '',
      actions: (f[`case${i}Actions`] || '').split('\n').map((s) => s.trim()).filter(Boolean),
      impact: (f[`case${i}Impact`] || '').split('\n').map((s) => s.trim()).filter(Boolean),
      feedback: f[`case${i}Feedback`] || '',
    });
  }
  return (
    <section
      id={section.id}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-navy)', padding: '5rem 2rem', color: 'var(--sb-cream)' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-cream)', marginBottom: '0.75rem' }}>
          {f.heading || 'Detailed Case Studies'}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
        {f.intro && (
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-sage)', maxWidth: 800, marginBottom: '2.5rem' }}>
            {f.intro}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cases.map((c) => (
            <CaseStudyCard key={c.key} data={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyCard({ data }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(196,132,58,0.3)',
        borderLeft: '3px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '1.75rem 2rem',
      }}
    >
      <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
        Case Study
      </div>
      <h3
        className="sb-display"
        style={{
          fontSize: '1.6rem',
          color: 'var(--sb-cream)',
          letterSpacing: '0.04em',
          marginBottom: '0.35rem',
        }}
      >
        {data.title}
      </h3>
      {data.subtitle && (
        <div
          style={{
            fontFamily: 'var(--sb-font-label)',
            fontSize: '0.8rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--sb-gold)',
            marginBottom: '1.25rem',
          }}
        >
          {data.subtitle}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: data.feedback ? '1.25rem' : 0,
        }}
      >
        <CaseField label="Context" items={data.context} />
        <CaseField label="Role" text={data.role} />
        <CaseField label="Actions" items={data.actions} />
        <CaseField label="Impact" items={data.impact} accent />
      </div>

      {data.feedback && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(196,132,58,0.08)',
            borderLeft: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            fontStyle: 'italic',
            color: 'var(--sb-cream)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
          }}
        >
          “{data.feedback}”
        </div>
      )}
    </div>
  );
}

function CaseField({ label, items, text, accent }) {
  if (!items?.length && !text) return null;
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginBottom: '0.5rem',
          paddingBottom: '0.4rem',
          borderBottom: '0.5px solid rgba(196,132,58,0.2)',
        }}
      >
        {label}
      </div>
      {text && (
        <div style={{ fontSize: '0.85rem', color: 'var(--sb-cream)', lineHeight: 1.6 }}>{text}</div>
      )}
      {items?.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {items.map((it, i) => (
            <li
              key={i}
              style={{
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: accent ? 'var(--sb-cream)' : 'var(--sb-sage)',
                paddingLeft: '1rem',
                position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>·</span>
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const REGISTRY = {
  hero: HeroBlock,
  scripture: ScriptureBlock,
  about: AboutBlock,
  cards: CardsBlock,
  twoCol: TwoColBlock,
  resume: ResumeBlock,
  socialGrid: SocialGridBlock,
  contact: ContactBlock,
  text: TextBlock,
  cta: CtaBlock,
  industries: IndustriesBlock,
  domains: DomainsBlock,
  services: ServicesBlock,
  assessments: AssessmentsBlock,
  joinNetwork: JoinNetworkBlock,
  forCompanies: ForCompaniesBlock,
  industryWheel: IndustryWheelBlock,
  technology: TechnologyBlock,
  aboutIntro: AboutIntroBlock,
  timeline: TimelineBlock,
  caseStudies: CaseStudiesBlock,
};

export function RenderSection({ section, config, mode = 'public' }) {
  // Public never shows draft; preview shows everything with a banner.
  if (mode === 'public' && section.status === 'draft') return null;

  const Block = REGISTRY[section.type] || TextBlock;
  const banner = mode === 'preview' ? <StatusBanner status={section.status} /> : null;

  if (section.status === 'soon' && mode === 'public') {
    return <SoonScreen msg={section.fields?.soonMsg} />;
  }

  return (
    <>
      {banner}
      {section.status === 'soon' && mode === 'preview' ? (
        <Block section={section} config={config} />
      ) : (
        <Block section={section} config={config} />
      )}
    </>
  );
}

export const BLOCK_TYPES = Object.keys(REGISTRY);
