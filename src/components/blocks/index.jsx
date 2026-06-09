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
  // Two shapes are supported:
  //   New (preferred): f.cards = [{ title, desc, icon }]
  //   Legacy: f.card1Title / f.card1Desc / f.card1Icon ... up to card4
  // The editor writes the array shape on save. The renderer accepts either so
  // existing pages keep rendering correctly until they next edit.
  const cards = Array.isArray(f.cards) && f.cards.length
    ? f.cards
        .map((c) => ({ t: c.title, d: c.desc, icon: c.icon }))
        .filter((c) => c.t)
    : [1, 2, 3, 4].map((i) => ({
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
  // Two shapes are supported:
  //   New (preferred): f.roles = [{title, company, start, end, description, current}]
  //   Legacy: f.role1 / f.role1Desc / f.role2 / f.role2Desc / ... up to role6
  // The editor writes the array shape on save. The renderer accepts either so
  // existing member profiles keep rendering correctly until they next edit.
  function rolesFromLegacy() {
    return [1, 2, 3, 4, 5, 6]
      .map((i) => {
        const head = f[`role${i}`];
        const desc = f[`role${i}Desc`];
        if (!head) return null;
        // Try to split the legacy "Title — Company (dates)" string into pieces.
        // If parsing fails, fall back to using the whole string as title.
        return { title: head, company: '', start: '', end: '', description: desc || '', current: false, _legacy: true };
      })
      .filter(Boolean);
  }
  const rolesArr = Array.isArray(f.roles) && f.roles.length
    ? f.roles
    : rolesFromLegacy();
  function dateRange(r) {
    const start = r.start || '';
    const end = r.current ? 'Present' : (r.end || '');
    if (!start && !end) return '';
    if (start && end) return `${start} – ${end}`;
    return start || end;
  }
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
          {rolesArr.map((r, i) => {
            const dates = dateRange(r);
            // Legacy single-string roles render as a single line; new structured
            // roles render with title + company on one line and dates on another.
            const heading = r._legacy
              ? r.title
              : [r.title, r.company].filter(Boolean).join(' · ');
            return (
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
                    marginBottom: dates ? '0.2rem' : '0.4rem',
                  }}
                >
                  {heading}
                </div>
                {dates && (
                  <div style={{
                    fontSize: '0.7rem', letterSpacing: '0.04em',
                    color: 'var(--sb-teal-deep)', marginBottom: '0.4rem',
                  }}>
                    {dates}
                  </div>
                )}
                <div style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#5a5a5a' }}>
                  {r.description}
                </div>
              </div>
            );
          })}
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

function ContactBlock({ section, config, memberSlug = '' }) {
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
          <ContactForm memberSlug={memberSlug} />
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
  // Two shapes are supported:
  //   New (preferred): f.domains = [{ title, desc }]
  //   Legacy: f.d1Title / f.d1Desc / ... up to d8
  // The editor writes the array shape on save. The renderer accepts either so
  // existing pages keep rendering correctly until they next edit.
  const items = Array.isArray(f.domains) && f.domains.length
    ? f.domains.filter((d) => d.title)
    : [1, 2, 3, 4, 5, 6, 7, 8]
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
  const PROPOSAL_SLUG_BY_INDEX = {
    1: 'diagnostic-sprint',
    2: 'embedded-operator',
    3: 'advisory-retainer',
  };
  const items = [1, 2, 3]
    .map((i) => ({
      title: f[`s${i}Title`],
      tag: f[`s${i}Tag`],
      desc: f[`s${i}Desc`],
      cta: f[`s${i}Cta`] || 'Inquire',
      proposalSlug: PROPOSAL_SLUG_BY_INDEX[i],
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
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                <a
                  href="#contact"
                  className="sb-btn sb-btn-outline-dark"
                  style={{ padding: '0.55rem 1.1rem', fontSize: '0.7rem' }}
                >
                  {s.cta} →
                </a>
                {s.proposalSlug && (
                  <a
                    href={`/output/proposal/${s.proposalSlug}`}
                    target="_blank" rel="noreferrer"
                    className="sb-btn sb-btn-outline-dark"
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.7rem' }}
                  >
                    View Proposal
                  </a>
                )}
              </div>
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
              {a.price && (
                <div style={{ fontSize: '0.7rem', color: 'var(--sb-gold)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  {a.price}
                </div>
              )}
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

// ── Reusable lead-success modal: shows URL + password on submission ──
// Visitors get one shot to see the password (we only show it once on
// creation). They can copy, screenshot, or proceed straight to the record.
// The same password is sent to their email via the server.
function LeadSuccessModal({ result, onDismiss }) {
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedPw, setCopiedPw] = React.useState(false);
  const fullUrl = `${window.location.origin}${result.leadUrl}`;

  function copy(value, setter) {
    navigator.clipboard?.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 1500);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1.5rem',
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--sb-navy-deep)',
          border: '0.5px solid rgba(196,132,58,0.4)',
          borderTop: '3px solid var(--sb-gold)',
          borderRadius: 'var(--sb-radius)',
          padding: '2rem', maxWidth: 540, width: '100%',
          color: 'var(--sb-cream)',
        }}
      >
        <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          {result.existing ? 'You\'re already in my records' : 'Submission received'}
        </div>
        <h2 className="sb-display" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          Lead #{result.publicId}
        </h2>
        {result.merged > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>
            Merged {result.merged} prior submission{result.merged === 1 ? '' : 's'} into this record.
          </p>
        )}
        <p style={{ fontSize: '0.9rem', color: 'var(--sb-sage)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
          {result.password
            ? 'Save these credentials — I also sent them to your email. Use the URL + password to come back any time and update what you have shared.'
            : 'I already have a record under this email. Use the original credentials I sent you previously, or check your inbox — I just resent a copy.'}
        </p>

        <div style={credRow}>
          <div style={credLabel}>URL</div>
          <div style={credValue}>{fullUrl}</div>
          <button onClick={() => copy(fullUrl, setCopiedUrl)} className="sb-btn sb-btn-outline" style={copyBtn}>
            {copiedUrl ? '✓' : 'Copy'}
          </button>
        </div>

        {result.password && (
          <div style={credRow}>
            <div style={credLabel}>Password</div>
            <div style={{ ...credValue, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              {result.password}
            </div>
            <button onClick={() => copy(result.password, setCopiedPw)} className="sb-btn sb-btn-outline" style={copyBtn}>
              {copiedPw ? '✓' : 'Copy'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <a href={result.leadUrl} className="sb-btn sb-btn-gold" style={{ padding: '0.65rem 1.25rem' }}>
            Open my lead record →
          </a>
          <button onClick={onDismiss} className="sb-btn sb-btn-outline" style={{ padding: '0.65rem 1.25rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
const credRow = {
  display: 'grid',
  gridTemplateColumns: '80px 1fr auto',
  gap: '0.6rem',
  alignItems: 'center',
  padding: '0.6rem 0.85rem',
  background: 'var(--sb-navy)',
  border: '0.5px solid rgba(196,132,58,0.25)',
  borderRadius: 'var(--sb-radius)',
  marginBottom: '0.65rem',
};
const credLabel = {
  fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem',
  letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)',
};
const credValue = { fontSize: '0.82rem', color: 'var(--sb-cream)', wordBreak: 'break-all' };
const copyBtn = { padding: '0.35rem 0.8rem', fontSize: '0.68rem' };

// Capture which CTA fired so admin can see exactly where the lead came from.
function ctaLocation(button) {
  const path = window.location.pathname + window.location.hash;
  return button ? `${path} · ${button}` : path;
}

function ContactForm({ memberSlug = '' }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = { source: 'contact', email, phone, name, message, ctaLocation: ctaLocation('contact form') };
      if (memberSlug) payload.memberSlug = memberSlug;
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Submission failed');
      setResult(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input className="sb-input sb-input-light" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
        <input className="sb-input sb-input-light" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="sb-input sb-input-light" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
        <textarea className="sb-input sb-input-light sb-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's on your mind?" />
        <button type="submit" className="sb-btn sb-btn-gold" style={{ justifyContent: 'center' }} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
        {error && (
          <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{error}</div>
        )}
      </form>
      {result && <LeadSuccessModal result={result} onDismiss={() => setResult(null)} />}
    </>
  );
}

function LeadCaptureForm({ source, ctaLabel, placeholder, thanks, dark, message }) {
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source, email, message,
          ctaLocation: ctaLocation(ctaLabel || source),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Submit failed');
      setResult(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <InlineDataNotice dark={dark} compact style={{ marginBottom: '0.75rem' }} />
      <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="email" required
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
      {result && <LeadSuccessModal result={result} onDismiss={() => setResult(null)} />}
    </div>
  );
}

// References-request block: a focused lead-capture form that asks for
// requester name + email + company + context. Submits as source='references'
// so admin can filter, with the lead-flow's password-protected URL.
// References block — two modes the visitor selects:
//
//   "Offer a Reference"   — visitor volunteers to vouch for the member
//   "Request References"  — visitor asks the member to furnish references to them
//
// All heading/intro fields live in section.fields so each member (and Betsy on
// her own profile) can write their own copy. The memberLabel field controls how
// the member is referred to in the form card copy.
function ReferencesRequestBlock({ section, memberSlug = '' }) {
  const f = section.fields || {};
  const memberLabel = f.memberLabel || 'this operator';

  // Shared contact fields
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [company, setCompany] = React.useState('');

  // Mode — 'offer' | 'request'
  const [mode, setMode] = React.useState('offer');

  // Mode-specific fields
  const [howKnown, setHowKnown] = React.useState('');       // offer: how do they know the member
  const [endorsement, setEndorsement] = React.useState(''); // offer: what they'd say
  const [evalRole, setEvalRole] = React.useState('');       // request: visitor's role in evaluation
  const [context, setContext] = React.useState('');         // request: what they need references for

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  function switchMode(m) {
    setMode(m);
    setError('');
    setDone(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!email || !name) return;
    setSubmitting(true);
    setError('');
    try {
      let source, parts;
      if (mode === 'offer') {
        source = memberSlug ? 'referenceOffer' : 'references';
        parts = [
          howKnown && `How I know them: ${howKnown}`,
          company && `My organization: ${company}`,
          endorsement && `What I'd say: ${endorsement}`,
        ].filter(Boolean);
      } else {
        source = memberSlug ? 'referenceRequest' : 'referencesOutbound';
        parts = [
          evalRole && `My role in this evaluation: ${evalRole}`,
          company && `My organization: ${company}`,
          context && `What I'm looking for: ${context}`,
        ].filter(Boolean);
      }
      const payload = {
        source, email, name,
        message: parts.join('\n\n'),
        ctaLocation: ctaLocation('References'),
      };
      if (memberSlug) payload.memberSlug = memberSlug;
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Request failed');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const tabStyle = (active) => ({
    flex: 1,
    padding: '0.55rem 0.5rem',
    fontSize: '0.72rem',
    fontFamily: 'var(--sb-font-label)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: active ? 'var(--sb-navy)' : 'transparent',
    color: active ? 'var(--sb-cream)' : 'var(--sb-navy)',
    border: '0.5px solid var(--sb-navy)',
    borderRadius: active ? 'calc(var(--sb-radius) - 2px)' : 0,
    cursor: 'pointer',
  });

  return (
    <section
      id={section.id || 'references'}
      style={{ background: BG_VAR[section.bg] || 'var(--sb-cream)', padding: '5rem 2rem' }}
    >
      <div className="sb-grid-2col-pitch" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
          <h2 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            {f.heading || 'References'}
          </h2>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', marginBottom: '1.25rem' }}>
            {f.intro || `Two ways to engage with ${memberLabel}'s reference network: offer your own endorsement, or ask ${memberLabel} to provide references for you.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(196,132,58,0.07)', borderLeft: '3px solid var(--sb-gold)', borderRadius: 'var(--sb-radius)', fontSize: '0.88rem', lineHeight: 1.7, color: '#4a4a4a' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--sb-navy)' }}>Offer a Reference</strong>
              {f.offerNote || `If you've worked with ${memberLabel} and would vouch for their work, submit your contact and what you'd say. ${memberLabel} may share your info with prospective clients or partners.`}
            </div>
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(196,132,58,0.07)', borderLeft: '3px solid var(--sb-gold)', borderRadius: 'var(--sb-radius)', fontSize: '0.88rem', lineHeight: 1.7, color: '#4a4a4a' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--sb-navy)' }}>Request References</strong>
              {f.requestNote || `If you're evaluating ${memberLabel} for a project or engagement and want to speak with their references, submit context about who you are and what you're looking for. ${memberLabel} will follow up with relevant contacts.`}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '0.5px solid var(--sb-taupe)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            padding: '1.75rem',
          }}
        >
          {done ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
              <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
                {mode === 'offer' ? 'Reference submitted' : 'Request received'}
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#4a4a4a' }}>
                {mode === 'offer'
                  ? (f.offerSuccess || `Thank you — your reference has been sent to ${memberLabel}.`)
                  : (f.requestSuccess || `Your request has been sent to ${memberLabel}. You'll hear back directly with relevant references.`)}
              </p>
              <button onClick={() => switchMode(mode)} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--sb-gold)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Submit another
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 2, background: 'rgba(27,42,59,0.06)', borderRadius: 'var(--sb-radius)', padding: 3, marginBottom: '1.25rem' }}>
                <button style={tabStyle(mode === 'offer')} onClick={() => switchMode('offer')}>Offer a Reference</button>
                <button style={tabStyle(mode === 'request')} onClick={() => switchMode('request')}>Request References</button>
              </div>

              {mode === 'offer' ? (
                <>
                  <p style={{ fontSize: '0.78rem', color: '#4a4a4a', marginBottom: '1rem', lineHeight: 1.6 }}>
                    Offer yourself as a reference for {memberLabel}. Your contact and endorsement go directly to {memberLabel} — not shared publicly without their vetting.
                  </p>
                  <InlineDataNotice dark={false} compact style={{ marginBottom: '1rem' }} />
                  <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input className="sb-input sb-input-light" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                    <input className="sb-input sb-input-light" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" />
                    <input className="sb-input sb-input-light" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your organization (optional)" />
                    <input className="sb-input sb-input-light" type="text" value={howKnown} onChange={(e) => setHowKnown(e.target.value)} placeholder="How you know them (engagement, context, time period)" />
                    <textarea className="sb-input sb-input-light sb-textarea" value={endorsement} onChange={(e) => setEndorsement(e.target.value)} placeholder="What you'd say about their work" />
                    <button type="submit" className="sb-btn sb-btn-gold" disabled={submitting} style={{ justifyContent: 'center' }}>
                      {submitting ? 'Submitting…' : 'Submit as reference'}
                    </button>
                    {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{error}</div>}
                  </form>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.78rem', color: '#4a4a4a', marginBottom: '1rem', lineHeight: 1.6 }}>
                    Ask {memberLabel} to provide references for you. Include context so the right contacts can be matched to your evaluation.
                  </p>
                  <InlineDataNotice dark={false} compact style={{ marginBottom: '1rem' }} />
                  <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input className="sb-input sb-input-light" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                    <input className="sb-input sb-input-light" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" />
                    <input className="sb-input sb-input-light" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your organization (optional)" />
                    <input className="sb-input sb-input-light" type="text" value={evalRole} onChange={(e) => setEvalRole(e.target.value)} placeholder="Your role in this evaluation (e.g. prospective client, recruiter, investor)" />
                    <textarea className="sb-input sb-input-light sb-textarea" value={context} onChange={(e) => setContext(e.target.value)} placeholder="What you're evaluating and what kind of reference perspective would help most" />
                    <button type="submit" className="sb-btn sb-btn-gold" disabled={submitting} style={{ justifyContent: 'center' }}>
                      {submitting ? 'Sending…' : 'Send reference request'}
                    </button>
                    {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{error}</div>}
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
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
        {/* Configurable action buttons — defined via section.fields.actions array
            [{label, href, style:'gold'|'outline'|'outline-dark'}] or legacy cta1/cta2 fields */}
        {(() => {
          const btns = Array.isArray(f.actions) && f.actions.length
            ? f.actions
            : [
                f.cta1 ? { label: f.cta1, href: f.cta1Link || '#', style: f.cta1Style || 'gold' } : null,
                f.cta2 ? { label: f.cta2, href: f.cta2Link || '#', style: f.cta2Style || 'outline-dark' } : null,
              ].filter(Boolean);
          if (!btns.length) return null;
          return (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {btns.map((b, i) => (
                <a key={i} href={b.href} target={b.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                  className={`sb-btn sb-btn-${b.style || 'gold'}`}
                  style={{ fontSize: '0.72rem', padding: '0.55rem 1.25rem' }}>
                  {b.label}
                </a>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}

const CASE_STUDY_SLUG_BY_INDEX = {
  1: 'healthcare-nasdaq-relisting',
  2: 'global-tech-usage-billing',
  3: 'global-manufacturing-q2r',
};

function CaseStudiesBlock({ section }) {
  const f = section.fields || {};
  // Supports three shapes:
  //  1. f.cases[] with full new fields (clientSummary, problemStatement, kpiImprovement, methodsTaken, challenges, impact)
  //  2. f.cases[] with legacy shape (challenge, approach, outcome, tags)
  //  3. Legacy fixed-slot fields (case1Title…case5Title)
  let cases;
  if (Array.isArray(f.cases) && f.cases.length > 0) {
    cases = f.cases.map((c, i) => ({ key: `case-${i}`, ...c }));
  } else {
    cases = [];
    for (let i = 1; i <= 5; i++) {
      const title = f[`case${i}Title`];
      if (!title) continue;
      cases.push({
        key: `case${i}`,
        slug: CASE_STUDY_SLUG_BY_INDEX[i],
        title,
        clientSummary: f[`case${i}Subtitle`] || '',
        problemStatement: f[`case${i}Context`] || '',
        methodsTaken: f[`case${i}Role`] || '',
        impact: f[`case${i}Impact`] || '',
        feedback: f[`case${i}Feedback`] || '',
      });
    }
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
  const [open, setOpen] = React.useState(false);
  // Normalize tags from string or array
  const tags = Array.isArray(data.tags) ? data.tags
    : typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const FIELDS = [
    { key: 'clientSummary',    label: 'Client Summary' },
    { key: 'problemStatement', label: 'Problem Statement' },
    { key: 'kpiImprovement',   label: 'KPI Improvement', accent: true },
    { key: 'methodsTaken',     label: 'Methods & Approach' },
    { key: 'challenges',       label: 'Challenges' },
    { key: 'impact',           label: 'Impact & Outcomes', accent: true },
  ];

  const filledFields = FIELDS.filter(f => data[f.key]);
  const preview = filledFields.slice(0, 3);
  const rest = filledFields.slice(3);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(196,132,58,0.3)',
      borderLeft: '3px solid var(--sb-gold)',
      borderRadius: 'var(--sb-radius)',
      padding: '1.75rem 2rem',
    }}>
      <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>Case Study</div>
      <h3 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
        {data.title}
      </h3>
      {/* Client + sector subtitle */}
      {(data.clientSummary || data.subtitle) && (
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '1.25rem' }}>
          {data.clientSummary || data.subtitle}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {tags.map((t, i) => (
            <span key={i} style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 10, background: 'rgba(196,132,58,0.15)', color: 'var(--sb-gold)', border: '0.5px solid rgba(196,132,58,0.3)' }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: rest.length && !open ? '1rem' : (data.feedback ? '1.25rem' : 0) }}>
        {(open ? filledFields : preview).map(({ key, label, accent }) => (
          <CaseField key={key} label={label} text={data[key]} accent={accent} />
        ))}
      </div>

      {rest.length > 0 && (
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: '0.5px solid rgba(196,132,58,0.4)', borderRadius: 4, color: 'var(--sb-gold)', fontSize: '0.72rem', padding: '4px 14px', cursor: 'pointer', marginBottom: data.feedback ? '1rem' : 0, fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>
          {open ? '▲ Less detail' : `▼ More detail (${rest.length} more fields)`}
        </button>
      )}

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
      {data.tags?.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {data.tags.map((tag, i) => (
            <span key={i} style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', border: '0.5px solid rgba(196,132,58,0.4)', borderRadius: 'var(--sb-radius)', padding: '0.2rem 0.5rem' }}>{tag}</span>
          ))}
        </div>
      )}
      {data.slug && (
        <div style={{ marginTop: '1rem' }}>
          <a
            href={`/output/case-study/${data.slug}`}
            target="_blank" rel="noreferrer"
            className="sb-btn sb-btn-outline"
            style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
          >
            ↗ View as PDF / Print
          </a>
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

// ── Net Works Banner ──
// A horizontally-scrolling row of member cards (logo + name + blurb → link to
// /u/:slug). Sources from GET /api/member-site/featured, which returns every
// member who has opted in via their Config panel. Designed to live directly
// under the founder About/Intro section on the Salt Basin home page.
function NetWorksBannerBlock({ section }) {
  const f = section.fields || {};
  const [members, setMembers] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/member-site/featured')
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((b) => setMembers(b.members || []))
      .catch(() => setMembers([]));
  }, []);

  const heading = f.heading || 'Salt Basin Net Works';
  const intro = f.intro || 'A growing roster of senior operators building from the same shoreline.';

  return (
    <section
      id={section.id}
      style={{
        background: BG_VAR[section.bg] || 'var(--sb-cream)',
        padding: '4rem 0 4.5rem',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 1.5rem' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
          {heading}
        </h2>
        <div className="sb-gold-rule" style={{ marginBottom: '1.25rem' }} />
        <p style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'var(--sb-teal-deep)', maxWidth: 720 }}>
          {intro}
        </p>
      </div>

      {members === null ? null : members.length === 0 ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', fontSize: '0.85rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic' }}>
          Members start opting in soon — once they do, their profile cards appear here.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.5rem 2rem 1rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {members.map((m) => (
            <a
              key={m.slug}
              href={`/u/${m.slug}`}
              style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'white',
                border: '0.5px solid var(--sb-taupe)',
                borderTop: '3px solid var(--sb-gold)',
                borderRadius: 'var(--sb-radius)',
                padding: '1.25rem 1.25rem 1.5rem',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 1px 3px rgba(27,42,59,0.06)',
              }}
            >
              <div
                style={{
                  width: 64, height: 64, borderRadius: 8,
                  background: m.logoUrl ? `url(${m.logoUrl}) center/contain no-repeat #FBF6F0` : 'var(--sb-cream)',
                  border: '0.5px solid var(--sb-taupe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sb-teal-deep)', fontWeight: 500, fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                }}
              >
                {!m.logoUrl && (m.displayName || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="sb-display" style={{ fontSize: '1.1rem', color: 'var(--sb-navy)', letterSpacing: '0.02em' }}>
                  {m.displayName}
                </div>
                {m.companyName && (
                  <div style={{
                    fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--sb-gold)', marginTop: 2,
                  }}>
                    {m.companyName}
                  </div>
                )}
              </div>
              {m.blurb && (
                <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: '#4a4a4a', margin: 0 }}>
                  {m.blurb}
                </p>
              )}
              <div style={{
                marginTop: 'auto', paddingTop: '0.5rem',
                fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--sb-gold)',
              }}>
                View profile →
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Visual / diagram blocks ──

function StatGridBlock({ section }) {
  const f = section.fields || {};
  const stats = Array.isArray(f.stats) ? f.stats : [];
  const cols = Math.min(Math.max(stats.length, 2), 4);
  return (
    <section id={section.id} style={{ background: BG_VAR[section.bg] || 'var(--sb-navy)', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-cream)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--sb-sage)', maxWidth: 740, marginBottom: '2.5rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.5rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)' }}>
              <div className="sb-display" style={{ fontSize: '3rem', color: 'var(--sb-gold)', letterSpacing: '0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-cream)', marginTop: '0.75rem' }}>{s.label}</div>
              {s.sublabel && <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: '0.35rem' }}>{s.sublabel}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessBlock({ section }) {
  const f = section.fields || {};
  const steps = Array.isArray(f.steps) ? f.steps : [];
  return (
    <section id={section.id} style={{ background: BG_VAR[section.bg] || 'var(--sb-ivory)', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', maxWidth: 700, marginBottom: '2.5rem' }}>{f.intro}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sb-navy)', color: 'var(--sb-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sb-font-label)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, zIndex: 1 }}>{i + 1}</div>
                {i < steps.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 32, background: 'rgba(196,132,58,0.3)', margin: '4px 0' }} />}
              </div>
              <div style={{ paddingBottom: i < steps.length - 1 ? '2rem' : 0, paddingTop: '0.5rem' }}>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-navy)', marginBottom: '0.35rem' }}>{step.title}</div>
                {step.description && <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#4a4a4a', margin: 0 }}>{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ColumnsBlock({ section }) {
  const f = section.fields || {};
  const cols = Array.isArray(f.cols) ? f.cols : [];
  const colCount = Math.min(Math.max(Number(f.columnCount) || cols.length || 3, 2), 4);
  return (
    <section id={section.id} style={{ background: BG_VAR[section.bg] || 'var(--sb-linen)', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', maxWidth: 740, marginBottom: '2.5rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '2rem' }}>
          {cols.map((col, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {col.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{col.icon}</div>}
              {col.title && <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>{col.title}</div>}
              {col.body && <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#4a4a4a', margin: 0 }}>{col.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconGridBlock({ section }) {
  const f = section.fields || {};
  const items = Array.isArray(f.items) ? f.items : [];
  const [tooltip, setTooltip] = React.useState(null);
  return (
    <section id={section.id} style={{ background: BG_VAR[section.bg] || 'var(--sb-cream)', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
          {items.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => item.tooltip && setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '1rem 1.25rem', background: 'rgba(27,42,59,0.06)', border: '0.5px solid rgba(27,42,59,0.15)', borderRadius: 'var(--sb-radius)', cursor: item.tooltip ? 'help' : 'default', minWidth: 90 }}
            >
              {item.icon && <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>}
              <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-navy)', textAlign: 'center' }}>{item.label}</span>
              {tooltip === i && item.tooltip && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, background: 'var(--sb-navy)', color: 'var(--sb-cream)', fontSize: '0.78rem', lineHeight: 1.5, padding: '0.5rem 0.75rem', borderRadius: 'var(--sb-radius)', whiteSpace: 'nowrap', maxWidth: 240, zIndex: 50, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                  {item.tooltip}
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid var(--sb-navy)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Status color helpers (shared across new blocks) ──────────────────────────
const STATUS_PILL = {
  complete:    { bg: '#24bb7f20', border: '#24bb7f50', text: '#1a8a5a' },
  'in-progress':{ bg: '#f9dc5c20', border: '#f9dc5c60', text: '#a07800' },
  planned:     { bg: '#5271ff20', border: '#5271ff50', text: '#3050cc' },
  blocked:     { bg: '#f2504420', border: '#f2504450', text: '#c02010' },
  pending:     { bg: '#8b9bae20', border: '#8b9bae50', text: '#4a6670' },
};

// ── KPI Dashboard Block ───────────────────────────────────────────────────────
// Multi-panel metric grid. panels: [{label, value, change, caption, color}]
function KpiDashboardBlock({ section }) {
  const f = section.fields || {};
  const panels = Array.isArray(f.panels) ? f.panels : [];
  const PASTEL = ['#c4e7e3','#b1f3fe','#fbd1f5','#e4cafc','#ffeec0','#cdfdf1','#fbba99','#fadf8d','#c8f5c8','#fde4d0'];
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && (
          <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2rem' }}>
            {f.heading}
          </h2>
        )}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '2.5rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {panels.map((p, i) => {
            const cardBg = p.color || PASTEL[i % PASTEL.length];
            const isUp = String(p.change || '').startsWith('+');
            const isDown = String(p.change || '').startsWith('-');
            return (
              <div key={i} style={{ background: cardBg, borderRadius: 12, padding: '1.5rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
                {p.icon && <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{p.icon}</div>}
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333', opacity: 0.65, marginBottom: '0.4rem', fontFamily: 'var(--sb-font-label)' }}>{p.label}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a1a', lineHeight: 1.1 }}>{p.value}</div>
                {p.change && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: isUp ? '#1a8a5a' : isDown ? '#c02010' : '#555', fontWeight: 600 }}>
                    {isUp ? '▲' : isDown ? '▼' : '●'} {p.change}
                  </div>
                )}
                {p.caption && <div style={{ fontSize: '0.7rem', color: '#555', opacity: 0.75, marginTop: '0.3rem', lineHeight: 1.4 }}>{p.caption}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Roadmap Block ─────────────────────────────────────────────────────────────
// Horizontal timeline with color-coded milestones.
// milestones: [{date, title, description, status}]
function RoadmapBlock({ section }) {
  const f = section.fields || {};
  const milestones = Array.isArray(f.milestones) ? f.milestones : [];
  const GRAD_COLORS = ['#f950b8','#a352ff','#5271ff','#0077b6','#02c39a','#24bb7f','#f9dc5c','#ed7843'];
  const bg = BG_VAR[section.bg] || 'var(--sb-linen)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '3rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '3rem' }}>{f.intro}</p>}
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', minWidth: Math.max(milestones.length * 220, 600) }}>
            {/* Gradient spine */}
            <div style={{ position: 'absolute', top: 20, left: '4%', right: '4%', height: 3, background: 'linear-gradient(to right, #f950b8, #5271ff, #02c39a)', borderRadius: 2, opacity: 0.5 }} />
            {milestones.map((m, i) => {
              const color = GRAD_COLORS[i % GRAD_COLORS.length];
              const pill = STATUS_PILL[m.status] || {};
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 0, position: 'relative' }}>
                  {/* Node dot */}
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: color, border: '3px solid white', boxShadow: `0 0 0 3px ${color}44`, zIndex: 1, flexShrink: 0, marginBottom: '1.25rem' }} />
                  {/* Date */}
                  <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: color, marginBottom: '0.35rem', fontWeight: 700 }}>{m.date}</div>
                  {/* Title */}
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', textAlign: 'center', padding: '0 0.5rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>{m.title}</div>
                  {/* Description */}
                  {m.description && <p style={{ fontSize: '0.76rem', color: dark ? 'var(--sb-sage)' : '#666', textAlign: 'center', lineHeight: 1.55, padding: '0 0.5rem', margin: 0, marginBottom: '0.5rem' }}>{m.description}</p>}
                  {/* Status pill */}
                  {m.status && (
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 10px', borderRadius: 20, background: pill.bg || '#eee', border: `1px solid ${pill.border || '#ccc'}`, color: pill.text || '#333', fontFamily: 'var(--sb-font-label)' }}>
                      {m.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Heatmap Block ─────────────────────────────────────────────────────────────
// Status matrix — rows × columns with color-coded cells.
// rows: [{label, values: ['green','yellow','red','blue','gray',...]}]
// columns: ['Jan','Feb',...]
function HeatmapBlock({ section }) {
  const f = section.fields || {};
  const rows = Array.isArray(f.rows) ? f.rows : [];
  const columns = Array.isArray(f.columns) ? f.columns : [];
  const CELL = {
    green:  { bg: '#24bb7f18', border: '#24bb7f40', text: '#1a7a4f', label: 'On Track' },
    yellow: { bg: '#f9dc5c18', border: '#f9dc5c50', text: '#a07800', label: 'At Risk' },
    red:    { bg: '#f2504418', border: '#f2504440', text: '#c02010', label: 'Blocked' },
    blue:   { bg: '#5271ff18', border: '#5271ff40', text: '#2040cc', label: 'Planned' },
    gray:   { bg: '#88888810', border: '#88888830', text: '#666',    label: 'N/A' },
    teal:   { bg: '#02a1a618', border: '#02a1a640', text: '#016870', label: 'Review' },
  };
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  const legend = Object.entries(CELL).filter(([k]) => k !== 'gray');
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '2rem' }}>{f.intro}</p>}
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {legend.map(([k, c]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c.bg, border: `1px solid ${c.border}` }} />
              <span style={{ color: dark ? 'var(--sb-sage)' : '#555' }}>{c.label}</span>
            </div>
          ))}
        </div>
        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
            {columns.length > 0 && (
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sb-font-label)', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)', fontWeight: 600, borderBottom: '0.5px solid rgba(128,128,128,0.25)' }}>
                    {f.rowLabel || 'Item'}
                  </th>
                  {columns.map((col, i) => (
                    <th key={i} style={{ padding: '0.5rem 0.5rem', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sb-font-label)', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)', fontWeight: 600, textAlign: 'center', borderBottom: '0.5px solid rgba(128,128,128,0.25)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '0.5px solid rgba(128,128,128,0.12)' }}>
                  <td style={{ padding: '0.6rem 1rem 0.6rem 0', fontSize: '0.88rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                  {(row.values || []).map((v, ci) => {
                    const c = CELL[v] || CELL.gray;
                    return (
                      <td key={ci} style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, fontSize: '0.65rem', letterSpacing: '0.08em', color: c.text, fontFamily: 'var(--sb-font-label)', whiteSpace: 'nowrap' }}>
                          {v || '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Leaderboard Block ─────────────────────────────────────────────────────────
// Ranked list with metric values.
// entries: [{name, subtitle, value, change, icon, avatar}]
function LeaderboardBlock({ section }) {
  const f = section.fields || {};
  const entries = Array.isArray(f.entries) ? f.entries : [];
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  const RANK_BG = ['#C4843A','#8B9BAE','#C8895A']; // gold / silver / bronze
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 640, marginBottom: '2rem' }}>{f.intro}</p>}
        <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: 12, overflow: 'hidden', border: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.08)', boxShadow: dark ? 'none' : '0 2px 20px rgba(0,0,0,0.06)' }}>
          {entries.map((e, i) => {
            const rankColor = RANK_BG[i] || (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)');
            const isUp = String(e.change || '').startsWith('+');
            const isDown = String(e.change || '').startsWith('-');
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: i < entries.length - 1 ? (dark ? '0.5px solid rgba(255,255,255,0.07)' : '0.5px solid rgba(0,0,0,0.06)') : 'none', transition: 'background 0.15s' }}>
                {/* Rank */}
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: i < 3 ? rankColor : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: i < 3 ? 'white' : (dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)'), flexShrink: 0 }}>
                  {i + 1}
                </div>
                {/* Avatar / icon */}
                {e.avatar
                  ? <img src={e.avatar} alt={e.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 42, height: 42, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.1)' : 'var(--sb-linen)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{e.icon || '👤'}</div>
                }
                {/* Name + subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                  {e.subtitle && <div style={{ fontSize: '0.76rem', color: dark ? 'var(--sb-sage)' : '#888', marginTop: '0.1rem' }}>{e.subtitle}</div>}
                </div>
                {/* Value */}
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '1.15rem', fontWeight: 800, color: i === 0 ? 'var(--sb-gold)' : (dark ? 'var(--sb-cream)' : 'var(--sb-navy)'), letterSpacing: '-0.01em', flexShrink: 0 }}>{e.value}</div>
                {/* Change */}
                {e.change && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isUp ? '#24bb7f' : isDown ? '#f25044' : (dark ? 'var(--sb-sage)' : '#888'), flexShrink: 0, minWidth: 36, textAlign: 'right' }}>{isUp ? '▲' : isDown ? '▼' : '●'} {e.change}</div>}
              </div>
            );
          })}
        </div>
        {f.footnote && <p style={{ fontSize: '0.72rem', color: dark ? 'var(--sb-sage)' : '#888', marginTop: '1rem', textAlign: 'right', opacity: 0.75 }}>{f.footnote}</p>}
      </div>
    </section>
  );
}

// ── Executive Summary Block ───────────────────────────────────────────────────
// Company/personal overview with key stats and contact block.
// stats: [{value, label}]; contacts: [{icon, label, value, href}]
function ExecutiveSummaryBlock({ section }) {
  const f = section.fields || {};
  const stats = Array.isArray(f.stats) ? f.stats : [];
  const contacts = Array.isArray(f.contacts) ? f.contacts : [];
  const ACCENT = f.accentColor || '#ed7843';
  const bg = BG_VAR[section.bg] || '#fff9e7';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: '4rem', alignItems: 'center' }}>
        {/* Left: text + stats */}
        <div>
          {f.eyebrow && <p style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem' }}>{f.eyebrow}</p>}
          {f.heading && <h2 style={{ fontSize: '2.8rem', fontWeight: 700, color: dark ? 'var(--sb-cream)' : '#1a1a1a', lineHeight: 1.15, marginBottom: '1.25rem' }}>{f.heading}</h2>}
          {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.85, color: dark ? 'var(--sb-sage)' : '#4a4a4a', marginBottom: '2.25rem' }}>{f.intro}</p>}
          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`, gap: '1rem' }}>
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1.25rem 0.75rem', background: `${ACCENT}12`, border: `0.5px solid ${ACCENT}30`, borderRadius: 8 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: ACCENT, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : '#666', marginTop: '0.4rem', fontFamily: 'var(--sb-font-label)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: contact / info card */}
        {(contacts.length > 0 || f.cardHeading) && (
          <div style={{ padding: '2rem', background: dark ? 'rgba(255,255,255,0.06)' : 'white', borderRadius: 14, boxShadow: dark ? 'none' : '0 4px 30px rgba(0,0,0,0.08)', border: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.06)' }}>
            {f.cardHeading && <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.25rem' }}>{f.cardHeading}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {c.icon && <span style={{ fontSize: '1rem', flexShrink: 0 }}>{c.icon}</span>}
                  <div>
                    {c.label && <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : '#888', fontFamily: 'var(--sb-font-label)' }}>{c.label}</div>}
                    {c.href
                      ? <a href={c.href} style={{ fontSize: '0.88rem', color: ACCENT, textDecoration: 'none' }}>{c.value}</a>
                      : <div style={{ fontSize: '0.88rem', color: dark ? 'var(--sb-cream)' : '#1a1a1a' }}>{c.value}</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── App Mockup Block ──────────────────────────────────────────────────────────
// Phone/tablet frame with content overlay. Useful for showcasing apps/products.
// screens: [{title, description, image, tag}]; layout: 'phone'|'tablet'|'browser'
function AppMockupBlock({ section }) {
  const f = section.fields || {};
  const screens = Array.isArray(f.screens) ? f.screens : [];
  const layout = f.layout || 'phone';
  const GRAD = f.gradientFrom || '#030455';
  const GRAD2 = f.gradientTo || '#0077b6';
  const frameW = layout === 'tablet' ? 320 : layout === 'browser' ? 420 : 240;
  const frameH = layout === 'phone' ? 480 : layout === 'tablet' ? 400 : 300;
  const frameR = layout === 'browser' ? 10 : 36;
  const bg = BG_VAR[section.bg] || 'var(--sb-navy)';
  const dark = section.bg === 'navy' || section.bg === 'teal' || !section.bg;
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: screens.length > 1 ? '1fr 1fr' : '1fr 1.2fr', gap: '4rem', alignItems: 'center' }}>
        {/* Text */}
        <div>
          {f.eyebrow && <p style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '1rem' }}>{f.eyebrow}</p>}
          {f.heading && <h2 className="sb-display" style={{ fontSize: '2.5rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', lineHeight: 1.2, marginBottom: '1.25rem' }}>{f.heading}</h2>}
          {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.85, color: dark ? 'var(--sb-sage)' : '#555', marginBottom: '2rem' }}>{f.intro}</p>}
          {f.cta1 && <a href={f.cta1Link || '#'} className="sb-btn sb-btn-gold">{f.cta1}</a>}
          {f.cta2 && <a href={f.cta2Link || '#'} className="sb-btn sb-btn-outline" style={{ marginLeft: '1rem' }}>{f.cta2}</a>}
        </div>
        {/* Phone frames */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {(screens.length ? screens : [{ title: 'App Preview' }]).map((sc, i) => (
            <div key={i} style={{ width: frameW, flexShrink: 0, position: 'relative' }}>
              {/* Frame shell */}
              <div style={{ background: `linear-gradient(145deg, ${GRAD}, ${GRAD2})`, borderRadius: frameR, padding: layout === 'phone' ? '14px 10px' : '10px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.15)' }}>
                {/* Browser chrome */}
                {layout === 'browser' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: '0.5rem' }}>
                    {['#f25044','#f9dc5c','#24bb7f'].map((c, j) => <div key={j} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 4, height: 20 }} />
                  </div>
                )}
                {/* Phone notch */}
                {layout === 'phone' && <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3, margin: '0 auto 10px' }} />}
                {/* Screen content */}
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: layout === 'phone' ? 24 : 6, minHeight: frameH - 60, overflow: 'hidden', position: 'relative' }}>
                  {sc.image
                    ? <img src={sc.image} alt={sc.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : (
                      <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                        {sc.tag && <div style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', fontFamily: 'var(--sb-font-label)' }}>{sc.tag}</div>}
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{sc.title}</div>
                        {sc.description && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{sc.description}</div>}
                        {/* Placeholder UI chrome */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {[0.9,0.7,0.5].map((w,k) => <div key={k} style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, width: `${w * 100}%`, margin: '0 auto' }} />)}
                        </div>
                      </div>
                    )
                  }
                </div>
                {/* Home indicator */}
                {layout === 'phone' && <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2, margin: '10px auto 0' }} />}
              </div>
              {sc.label && <div style={{ textAlign: 'center', fontSize: '0.72rem', color: dark ? 'var(--sb-sage)' : '#666', marginTop: '0.75rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em' }}>{sc.label}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Choice Grid Block ─────────────────────────────────────────────────────────
// Interactive grid of colored option tiles with hover/select state.
// choices: [{icon, title, description, color, cta, ctaLink}]
function ChoiceGridBlock({ section }) {
  const f = section.fields || {};
  const choices = Array.isArray(f.choices) ? f.choices : [];
  const [selected, setSelected] = React.useState(null);
  const PALETTE = ['#f08cae','#c99ee7','#ffc071','#73bbce','#a5d6a7','#ffcc80','#80cbc4','#ef9a9a'];
  const bg = BG_VAR[section.bg] || 'var(--sb-cream)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '2rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {choices.map((c, i) => {
            const accent = c.color || PALETTE[i % PALETTE.length];
            const isSelected = selected === i;
            return (
              <div
                key={i}
                onClick={() => setSelected(isSelected ? null : i)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? accent : `${accent}22`,
                  border: `2px solid ${accent}`,
                  borderRadius: 14,
                  padding: '1.5rem 1.25rem',
                  transition: 'all 0.18s ease',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? `0 8px 24px ${accent}44` : 'none',
                }}
              >
                {c.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>}
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'white' : (dark ? 'var(--sb-cream)' : 'var(--sb-navy)'), marginBottom: '0.4rem' }}>{c.title}</div>
                {c.description && <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: isSelected ? 'rgba(255,255,255,0.85)' : (dark ? 'var(--sb-sage)' : '#555') }}>{c.description}</div>}
                {isSelected && c.cta && (
                  <a
                    href={c.ctaLink || '#'}
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-block', marginTop: '1rem', padding: '0.4rem 1.1rem', background: 'rgba(0,0,0,0.18)', color: 'white', borderRadius: 6, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {c.cta} →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Decision Tree Block ───────────────────────────────────────────────────────
// YES/NO branching flowchart. Rendered as a visual nested tree.
// nodes: [{id, question?, answer?, yes?, no?, type?}]  rootId: 'root'
function DecisionTreeBlock({ section }) {
  const f = section.fields || {};
  const nodesArr = Array.isArray(f.nodes) ? f.nodes : [];
  const rootId = f.rootId || (nodesArr[0]?.id);
  const nodeMap = Object.fromEntries(nodesArr.map((n) => [n.id, n]));
  const [path, setPath] = React.useState({});  // { nodeId: 'yes'|'no' }
  const bg = BG_VAR[section.bg] || 'var(--sb-linen)';
  const dark = section.bg === 'navy' || section.bg === 'teal';

  function renderNode(id, depth = 0) {
    const node = nodeMap[id];
    if (!node) return null;
    if (node.type === 'end' || (!node.yes && !node.no)) {
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: '#24bb7f18', border: '1.5px solid #24bb7f40', borderRadius: 10, maxWidth: 320 }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>✓</span>
          <div style={{ fontSize: '0.88rem', color: dark ? 'var(--sb-cream)' : '#1a1a1a', lineHeight: 1.55 }}>{node.answer || node.question}</div>
        </div>
      );
    }
    const choiceYes = path[id] === 'yes';
    const choiceNo = path[id] === 'no';
    return (
      <div>
        {/* Question box */}
        <div style={{ padding: '0.9rem 1.25rem', background: dark ? 'rgba(255,255,255,0.08)' : 'white', border: `1.5px solid ${dark ? 'rgba(255,255,255,0.18)' : 'rgba(27,42,59,0.2)'}`, borderRadius: 10, maxWidth: 360, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: depth > 0 ? 0 : '0.5rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.35rem' }}>Decision</div>
          <div style={{ fontSize: '0.9rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', fontWeight: 500, lineHeight: 1.5 }}>{node.question}</div>
        </div>
        {/* YES/NO buttons + branches */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', alignItems: 'flex-start' }}>
          {['yes', 'no'].map((branch) => {
            const targetId = node[branch];
            if (!targetId) return null;
            const chosen = path[id] === branch;
            const branchColor = branch === 'yes' ? '#24bb7f' : '#f25044';
            return (
              <div key={branch} style={{ flex: 1 }}>
                <button
                  onClick={() => setPath((p) => ({ ...p, [id]: chosen ? null : branch }))}
                  style={{ padding: '4px 14px', borderRadius: 6, border: `1.5px solid ${branchColor}`, background: chosen ? branchColor : 'transparent', color: chosen ? 'white' : branchColor, fontSize: '0.72rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', marginBottom: '0.6rem', width: '100%', transition: 'all 0.15s' }}
                >
                  {branch === 'yes' ? '✓ Yes' : '✗ No'}
                </button>
                {chosen && (
                  <div style={{ borderLeft: `2px solid ${branchColor}40`, paddingLeft: '0.75rem' }}>
                    {renderNode(targetId, depth + 1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2.5rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 700, marginBottom: '2.5rem' }}>{f.intro}</p>}
        {rootId ? renderNode(rootId) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: dark ? 'var(--sb-sage)' : '#888', fontSize: '0.9rem' }}>
            Add nodes via the editor to build your decision tree.
          </div>
        )}
        {Object.keys(path).length > 0 && (
          <button onClick={() => setPath({})} style={{ marginTop: '1.5rem', fontSize: '0.75rem', padding: '6px 16px', borderRadius: 6, border: '1px solid var(--sb-dusty)', background: 'transparent', cursor: 'pointer', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)' }}>
            ↺ Reset
          </button>
        )}
      </div>
    </section>
  );
}

// ── Output Generator Block ────────────────────────────────────────────────────
// Drag-and-drop content output builder. Users select content blocks, set an
// audience/context, and generate a tailored output (resume, bio, proposal, etc.)
// This block is always 'preview' / admin-only; the public site hides it.
function OutputGeneratorBlock({ section, mode }) {
  const f = section.fields || {};
  const contentBlocks = Array.isArray(f.contentBlocks) ? f.contentBlocks : [
    { id: 'summary', label: 'Professional Summary', icon: '📋', included: true, content: f.summary || '' },
    { id: 'experience', label: 'Work Experience', icon: '💼', included: true, content: f.experience || '' },
    { id: 'skills', label: 'Skills & Tools', icon: '🛠', included: true, content: f.skills || '' },
    { id: 'achievements', label: 'Key Achievements', icon: '🏆', included: false, content: f.achievements || '' },
    { id: 'education', label: 'Education', icon: '🎓', included: false, content: f.education || '' },
    { id: 'certifications', label: 'Certifications', icon: '📜', included: false, content: f.certifications || '' },
  ];
  const [blocks, setBlocks] = React.useState(contentBlocks);
  const [audience, setAudience] = React.useState('');
  const [outputType, setOutputType] = React.useState(f.defaultOutputType || 'resume');
  const [generating, setGenerating] = React.useState(false);
  const [output, setOutput] = React.useState('');
  const [dragIdx, setDragIdx] = React.useState(null);
  const [dragOverIdx, setDragOverIdx] = React.useState(null);

  function toggleBlock(id) {
    setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, included: !b.included } : b));
  }

  function onDragStart(e, i) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e, i) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function onDrop(e, i) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    setBlocks((bs) => {
      const next = [...bs];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  async function generate() {
    const included = blocks.filter((b) => b.included);
    if (!included.length) return;
    setGenerating(true);
    setOutput('');
    try {
      const prompt = `Generate a ${outputType} ${audience ? `tailored for: ${audience}` : ''}\n\nContent to include:\n${included.map((b) => `### ${b.label}\n${b.content || '[add content]'}`).join('\n\n')}`;
      const res = await fetch('/api/members/me/agent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, threadId: null }),
      });
      const data = await res.json();
      setOutput(data.reply || data.response || data.content || JSON.stringify(data));
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    }
    setGenerating(false);
  }

  const OUTPUT_TYPES = ['resume', 'executive bio', 'cover letter', 'LinkedIn summary', 'one-pager', 'proposal intro'];
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';

  return (
    <section id={section.id} style={{ background: bg, padding: '3rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.heading && <h2 className="sb-display" style={{ fontSize: '1.8rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: '0.5rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.88rem', color: dark ? 'var(--sb-sage)' : '#666', marginBottom: '1.5rem', lineHeight: 1.7 }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: block palette + controls */}
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.6rem' }}>Content Blocks</div>
            <div style={{ fontSize: '0.68rem', color: dark ? 'var(--sb-sage)' : '#888', marginBottom: '0.75rem', lineHeight: 1.5 }}>Drag to reorder. Toggle to include/exclude.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {blocks.map((b, i) => (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={(e) => onDrop(e, i)}
                  onDragLeave={() => setDragOverIdx(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.75rem', borderRadius: 8,
                    background: b.included ? (dark ? 'rgba(196,132,58,0.15)' : 'rgba(196,132,58,0.1)') : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                    border: dragOverIdx === i ? '1.5px dashed var(--sb-gold)' : `1px solid ${b.included ? 'rgba(196,132,58,0.35)' : 'rgba(128,128,128,0.15)'}`,
                    cursor: 'grab', transition: 'all 0.12s',
                    opacity: dragIdx === i ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: dark ? 'var(--sb-sage)' : '#aaa', flexShrink: 0 }}>⠿</span>
                  <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{b.icon}</span>
                  <span style={{ fontSize: '0.8rem', flex: 1, color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', fontWeight: b.included ? 500 : 400 }}>{b.label}</span>
                  <button onClick={() => toggleBlock(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: b.included ? 'var(--sb-gold)' : (dark ? 'var(--sb-sage)' : '#aaa'), padding: 0 }} title={b.included ? 'Exclude' : 'Include'}>
                    {b.included ? '◉' : '○'}
                  </button>
                </div>
              ))}
            </div>
            {/* Output type */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>Output Type</div>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="sb-input"
                style={{ fontSize: '0.82rem', marginBottom: '1rem' }}
              >
                {OUTPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Audience */}
            <div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>Audience / Role (optional)</div>
              <textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="sb-input"
                placeholder="Paste a job description, company name, or audience context…"
                style={{ fontSize: '0.78rem', minHeight: 80, resize: 'vertical', lineHeight: 1.55 }}
              />
            </div>
            <button
              onClick={generate}
              disabled={generating || !blocks.some((b) => b.included)}
              style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', borderRadius: 8, border: 'none', background: generating ? '#aaa' : 'var(--sb-navy)', color: 'white', fontFamily: 'var(--sb-font-label)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: generating ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            >
              {generating ? '⟳ Generating…' : '✦ Generate Output'}
            </button>
          </div>
          {/* Right: output panel */}
          <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: 10, border: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.08)', padding: '1.5rem', minHeight: 400 }}>
            {output ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>Generated {outputType}</div>
                  <button onClick={() => navigator.clipboard?.writeText(output)} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(196,132,58,0.4)', background: 'transparent', cursor: 'pointer', color: dark ? 'var(--sb-sage)' : 'var(--sb-teal-deep)' }}>⧉ Copy</button>
                </div>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: dark ? 'var(--sb-cream)' : '#1a1a1a', whiteSpace: 'pre-wrap' }}>{output}</div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.4 }}>
                <div style={{ fontSize: '2.5rem' }}>✦</div>
                <div style={{ fontSize: '0.88rem', color: dark ? 'var(--sb-sage)' : '#888', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
                  Select content blocks, set your audience, and hit Generate.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Skills Block ─────────────────────────────────────────────────────────────
// Dynamic skill entries grouped by category.
// skills: [{category, items: [{name, level:'expert'|'proficient'|'familiar', years}]}]
function SkillsBlock({ section }) {
  const f = section.fields || {};
  const groups = Array.isArray(f.skills) ? f.skills : [];
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';
  const LEVEL_COLOR = { expert: 'var(--sb-gold)', proficient: 'var(--sb-teal-deep)', familiar: '#8b9bae' };
  const LEVEL_W = { expert: '100%', proficient: '70%', familiar: '40%' };
  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '2rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '2rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {groups.map((g, gi) => (
            <div key={gi} style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: 10, padding: '1.25rem', border: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.07)', boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.05)' }}>
              {g.category && (
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '1rem', paddingBottom: '0.4rem', borderBottom: '0.5px solid rgba(196,132,58,0.2)' }}>{g.category}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(g.items || []).map((sk, si) => {
                  const lvl = sk.level || 'proficient';
                  return (
                    <div key={si}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.88rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', fontWeight: 500 }}>{sk.name}</span>
                        <span style={{ fontSize: '0.62rem', color: LEVEL_COLOR[lvl] || '#888', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {sk.years ? `${sk.years}y · ` : ''}{lvl}
                        </span>
                      </div>
                      <div style={{ height: 3, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: LEVEL_W[lvl] || '60%', background: LEVEL_COLOR[lvl] || '#888', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(LEVEL_COLOR).map(([lvl, color]) => (
            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', color: dark ? 'var(--sb-sage)' : '#777' }}>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: color }} />
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Client Snapshot Block ─────────────────────────────────────────────────────
// Each client is an entry: {name, industry, employerSponsor, capabilitiesDelivered,
//   capabilitiesTouched, techDelivered, techTouched, revenueRange, tags}
// The block renders a grouped rollup view: groupBy = 'industry'|'capability'|'revenue'
function ClientSnapshotBlock({ section }) {
  const f = section.fields || {};
  const clients = Array.isArray(f.clients) ? f.clients : [];
  const [groupBy, setGroupBy] = React.useState(f.defaultGroupBy || 'industry');
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dark = section.bg === 'navy' || section.bg === 'teal';

  // Build grouped map
  function getGroupKey(c) {
    if (groupBy === 'industry') return c.industry || 'Other';
    if (groupBy === 'revenue') return c.revenueRange || 'Unspecified';
    if (groupBy === 'capability') {
      const caps = (c.capabilitiesDelivered || '').split(',').map(s => s.trim()).filter(Boolean);
      return caps[0] || 'General';
    }
    return 'All';
  }

  const grouped = {};
  clients.forEach(c => {
    if (groupBy === 'capability') {
      // A client can appear in multiple capability groups
      const caps = (c.capabilitiesDelivered || '').split(',').map(s => s.trim()).filter(Boolean);
      const keys = caps.length ? caps : ['General'];
      keys.forEach(k => { (grouped[k] = grouped[k] || []).push(c); });
    } else {
      const k = getGroupKey(c);
      (grouped[k] = grouped[k] || []).push(c);
    }
  });

  const sortedKeys = Object.keys(grouped).sort();
  const GROUP_BTNS = [
    { id: 'industry',   label: 'By Industry' },
    { id: 'capability', label: 'By Capability' },
    { id: 'revenue',    label: 'By Revenue' },
  ];

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: f.intro ? '0.75rem' : '1.5rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: dark ? 'var(--sb-sage)' : '#555', maxWidth: 740, marginBottom: '1.5rem' }}>{f.intro}</p>}

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.4rem 1rem', borderRadius: 20, background: 'rgba(196,132,58,0.12)', border: '0.5px solid rgba(196,132,58,0.3)', fontSize: '0.75rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>{clients.length} clients</div>
          {['industry','capability','revenue'].map(dim => {
            const vals = new Set();
            clients.forEach(c => {
              if (dim === 'industry') vals.add(c.industry);
              else if (dim === 'capability') (c.capabilitiesDelivered||'').split(',').forEach(x => x.trim() && vals.add(x.trim()));
              else vals.add(c.revenueRange);
            });
            vals.delete(''); vals.delete(undefined);
            return vals.size ? <div key={dim} style={{ padding: '0.4rem 1rem', borderRadius: 20, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', border: '0.5px solid rgba(0,0,0,0.1)', fontSize: '0.72rem', color: dark ? 'var(--sb-sage)' : '#666' }}>{vals.size} {dim === 'capability' ? 'capabilities' : dim === 'revenue' ? 'revenue ranges' : 'industries'}</div> : null;
          })}
        </div>

        {/* Group-by toggle */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {GROUP_BTNS.map(b => (
            <button key={b.id} onClick={() => setGroupBy(b.id)} style={{ padding: '4px 14px', borderRadius: 6, border: `1.5px solid ${groupBy === b.id ? 'var(--sb-gold)' : 'rgba(0,0,0,0.15)'}`, background: groupBy === b.id ? 'var(--sb-gold)' : 'transparent', color: groupBy === b.id ? 'white' : (dark ? 'var(--sb-sage)' : '#555'), fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
              {b.label}
            </button>
          ))}
        </div>

        {/* Grouped cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedKeys.map(grpKey => (
            <div key={grpKey}>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.75rem', paddingBottom: '0.35rem', borderBottom: '0.5px solid rgba(196,132,58,0.2)' }}>
                {grpKey} <span style={{ color: dark ? 'var(--sb-sage)' : '#aaa', fontWeight: 400 }}>({grouped[grpKey].length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {grouped[grpKey].map((c, ci) => (
                  <div key={ci} style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: 8, padding: '1rem 1.1rem', border: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.07)', boxShadow: dark ? 'none' : '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: dark ? 'var(--sb-cream)' : 'var(--sb-navy)', marginBottom: '0.25rem' }}>{c.name || 'Client'}</div>
                    {c.employerSponsor && <div style={{ fontSize: '0.72rem', color: dark ? 'var(--sb-sage)' : '#888', marginBottom: '0.5rem' }}>via {c.employerSponsor}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {c.industry && <SnapshotRow label="Industry" val={c.industry} dark={dark} />}
                      {c.revenueRange && <SnapshotRow label="Revenue" val={c.revenueRange} dark={dark} />}
                      {c.capabilitiesDelivered && <SnapshotRow label="Delivered" val={c.capabilitiesDelivered} dark={dark} />}
                      {c.capabilitiesTouched && <SnapshotRow label="Touched" val={c.capabilitiesTouched} dark={dark} />}
                      {c.techDelivered && <SnapshotRow label="Tech" val={c.techDelivered} dark={dark} />}
                    </div>
                    {c.tags && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {c.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, ti) => (
                          <span key={ti} style={{ fontSize: '0.58rem', padding: '1px 7px', borderRadius: 8, background: 'rgba(196,132,58,0.12)', color: 'var(--sb-gold)', border: '0.5px solid rgba(196,132,58,0.25)', letterSpacing: '0.06em' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: dark ? 'var(--sb-sage)' : '#aaa', fontSize: '0.88rem' }}>
              Add clients via the editor to populate the snapshot.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function SnapshotRow({ label, val, dark }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', lineHeight: 1.4 }}>
      <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? 'var(--sb-sage)' : '#aaa', flexShrink: 0, minWidth: 56 }}>{label}</span>
      <span style={{ color: dark ? 'var(--sb-cream)' : '#333' }}>{val}</span>
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
  referencesRequest: ReferencesRequestBlock,
  forCompanies: ForCompaniesBlock,
  industryWheel: IndustryWheelBlock,
  technology: TechnologyBlock,
  aboutIntro: AboutIntroBlock,
  timeline: TimelineBlock,
  caseStudies: CaseStudiesBlock,
  netWorksBanner: NetWorksBannerBlock,
  statGrid: StatGridBlock,
  process: ProcessBlock,
  columns: ColumnsBlock,
  iconGrid: IconGridBlock,
  kpiDashboard: KpiDashboardBlock,
  roadmap: RoadmapBlock,
  heatmap: HeatmapBlock,
  leaderboard: LeaderboardBlock,
  executiveSummary: ExecutiveSummaryBlock,
  appMockup: AppMockupBlock,
  choiceGrid: ChoiceGridBlock,
  decisionTree: DecisionTreeBlock,
  outputGenerator: OutputGeneratorBlock,
  skills: SkillsBlock,
  clientSnapshot: ClientSnapshotBlock,
};

export function RenderSection({ section, config, mode = 'public', memberSlug = '' }) {
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
      <Block section={section} config={config} memberSlug={memberSlug} />
    </>
  );
}

export const BLOCK_TYPES = Object.keys(REGISTRY);
