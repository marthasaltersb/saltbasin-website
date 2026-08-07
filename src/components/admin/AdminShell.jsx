import React, { lazy, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';
import Sidebar from './Sidebar.jsx';
import { SectionTemplateModal } from './SectionTemplateModal.jsx';
import EditorPane from './EditorPane.jsx';
import PreviewPane from './PreviewPane.jsx';
import PageLayoutView from './PageLayoutView.jsx';
import PageTypeManagerPanel from './PageTypeManagerPanel.jsx';
import ConfigPanel from './ConfigPanel.jsx';
const MemberStatsPanel = lazy(() => import('./MemberPanels.jsx').then((module) => ({ default: module.MemberStatsPanel })));
const MemberAuditPanel = lazy(() => import('./MemberPanels.jsx').then((module) => ({ default: module.MemberAuditPanel })));
const MemberAgentPanel = lazy(() => import('./MemberPanels.jsx').then((module) => ({ default: module.MemberAgentPanel })));
const MyResumePanel = lazy(() => import('./MyResumePanel.jsx'));
const OutputTemplateConfiguratorHub = lazy(() => import('./OutputTemplateConfigurator.jsx').then((module) => ({ default: module.OutputTemplateConfiguratorHub })));
const CareerMasterPanel = lazy(() => import('./CareerMasterPanel.jsx'));
const ProfileHub = lazy(() => import('./ProfileHub.jsx'));
const LeadsPanel = lazy(() => import('./LeadsPanel.jsx'));
const NetWorksPanel = lazy(() => import('./NetWorksPanel.jsx'));
const BacklogPanel = lazy(() => import('./BacklogPanel.jsx'));
const QAPanel = lazy(() => import('./QAPanel.jsx'));
const ContentManagerShell = lazy(() => import('./ContentManagerShell.jsx'));
const NrmPanel = lazy(() => import('./NrmPanel.jsx'));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel.jsx'));
const FinBridgeCoPanel = lazy(() => import('./FinBridgeCoPanel.jsx'));
const MemberPlmPanel = lazy(() => import('./MemberPlmPanel.jsx'));
const GovernancePanel = lazy(() => import('./GovernancePanel.jsx'));
const EmotionalWeatherPanel = lazy(() => import('./EmotionalWeatherPanel.jsx'));
const LineagePanel = lazy(() => import('./LineagePanel.jsx'));
const InboxPanel = lazy(() => import('./InboxPanel.jsx'));
const CommandCenterPanel = lazy(() => import('./CommandCenterPanel.jsx'));
const MemberProductsPanel = lazy(() => import('./MemberProductsPanel.jsx'));
const FeedbackPanel = lazy(() => import('./FeedbackPanel.jsx'));
const EidosOperatingModelPanel = lazy(() => import('./EidosOperatingModelPanel.jsx'));
const WebsiteIntelligencePanel = lazy(() => import('./WebsiteIntelligencePanel.jsx'));
const MetricIntelligencePanel = lazy(() => import('./MetricIntelligencePanel.jsx'));
const MemberFinancialPanel = lazy(() => import('./MemberFinancialPanel.jsx'));
const MemberEntitlementsPanel = lazy(() => import('./MemberEntitlementsPanel.jsx'));
const CareerConsentGate = lazy(() => import('./CareerConsentGate.jsx'));
const CareerMasterEntryPoint = lazy(() => import('./CareerMasterEntryPoint.jsx'));
const OrgDocumentsPanel = lazy(() => import('./OrgDocumentsPanel.jsx'));
const MethodologyConfigPanel = lazy(() => import('./MethodologyConfigPanel.jsx'));
const LonetreeMvpPanel = lazy(() => import('./LonetreeMvpPanel.jsx'));
const ProposalExperiencePanel = lazy(() => import('./ProposalExperiencePanel.jsx'));
const CareerPlacementAgentsPanel = lazy(() => import('./CareerPlacementAgentsPanel.jsx'));
const CommercialOpportunityPanel = lazy(() => import('./CommercialOpportunityPanel.jsx'));

// Tab component registry: the one piece that can't be data-driven, because
// React components have to be referenced by import. The nav structure stored
// in config_state references entries here via tab.componentId. Adding a new
// component-backed tab means: import the component, add an entry here, then
// edit the nav structure (eventually via the Config panel editor) to surface it.
//
// 'content' is a sentinel — it stays as inline JSX in AdminShell below because
// the content editor is too tangled with the shell's state to be a standalone
// panel without a real refactor.
const TAB_COMPONENTS = {
  leads:          () => <LeadsPanel />,
  networks:       () => <NetWorksPanel />,
  backlog:        () => <BacklogPanel />,
  feedback:       () => <FeedbackPanel />,
  qa:             () => <QAPanel />,
  plmDashboard:   () => <MemberPlmPanel scope="admin" />,
  resume:         (props) => <MyResumePanel {...props} />,
  outputTemplates: (props) => <OutputTemplateConfiguratorHub {...props} />,
  careerMaster:   () => <CareerMasterPanel scope="admin" />,
  contentManager: () => <ContentManagerShell />,
  nrm:            () => <NrmPanel isAdmin={true} />,
  analytics:      () => <AnalyticsPanel isAdmin={true} />,
  finbridgeco:    () => <FinBridgeCoPanel />,
  governance:     () => <GovernancePanel />,
  emotionalWeather: () => <EmotionalWeatherPanel />,
  memberNrm:      () => <NrmPanel isAdmin={false} />,
  memberAnalytics:() => <AnalyticsPanel isAdmin={false} />,
  lineage:        () => <LineagePanel />,
  inbox:          () => <InboxPanel />,
  commandCenter:  () => <CommandCenterPanel />,
  eidos:          () => <EidosOperatingModelPanel />,
  websiteIntelligence: () => <WebsiteIntelligencePanel />,
  metricIntelligence: () => <MetricIntelligencePanel />,
  methodologyConfig: () => <MethodologyConfigPanel />,
  lonetreeMvp:    (props) => <LonetreeMvpPanel {...props} />,
  commercialOpportunities: () => <CommercialOpportunityPanel />,
  // config: handled inline below (ConfigPanel needs draft + setters from shell)
  // content: handled inline below (Sidebar/EditorPane/PreviewPane composition)
};

// Fallback nav used if /api/config/admin-nav can't be reached (offline / 500).
// Mirrors the seeded default so the admin shell stays usable even with the
// API down.
const FALLBACK_ADMIN_NAV = {
  views: [
    { id: 'content', label: 'Network Relationship Management', sortOrder: 0, tabs: [
      { id: 'content',  label: 'My Profile',       componentId: 'content',  sortOrder: 0 },
      { id: 'resume',   label: 'My Resume',         componentId: 'resume',  sortOrder: 1 },
      { id: 'output-templates', label: 'Output Templates', componentId: 'outputTemplates', sortOrder: 2.5 },
      { id: 'career-master', label: 'Career Master', componentId: 'careerMaster', sortOrder: 2 },
      { id: 'networks', label: 'Net Works',         componentId: 'networks', sortOrder: 3 },
      { id: 'nrm',      label: 'Network Contacts',  componentId: 'nrm',     sortOrder: 3 },
    ]},
    { id: 'plm', label: 'Platform Lifecycle Management', sortOrder: 1, tabs: [
      { id: 'plm-dashboard', label: 'Operating Model Dashboard', componentId: 'plmDashboard', sortOrder: 0 },
      { id: 'backlog', label: 'Backlog', componentId: 'backlog', sortOrder: 1 },
      { id: 'qa', label: 'QA', componentId: 'qa', sortOrder: 2 },
    ]},
    { id: 'crm', label: 'Customer Relationship Management', sortOrder: 2, tabs: [
      { id: 'leads', label: 'Leads', componentId: 'leads', sortOrder: 0 },
      { id: 'commercial-opportunities', label: 'Commercial Opportunity Pipeline', componentId: 'commercialOpportunities', sortOrder: 1 },
    ]},
    { id: 'content-manager', label: 'Content Manager', sortOrder: 3, tabs: [
      { id: 'content-manager', label: 'Content Manager', componentId: 'contentManager', sortOrder: 0 },
    ]},
    { id: 'analytics', label: 'Analytics', sortOrder: 5, tabs: [
      { id: 'analytics', label: 'Analytics', componentId: 'analytics', sortOrder: 0 },
      { id: 'metric-intelligence', label: 'Metric Intelligence', componentId: 'metricIntelligence', sortOrder: 1 },
    ]},
    { id: 'finbridgeco', label: 'FinBridgeCo', sortOrder: 6, tabs: [
      { id: 'finbridgeco', label: 'FinBridgeCo', componentId: 'finbridgeco', sortOrder: 0 },
    ]},
    { id: 'governance', label: 'Governance', sortOrder: 7, tabs: [
      { id: 'governance', label: 'Governance Review', componentId: 'governance', sortOrder: 0 },
    ]},
    { id: 'emotional-weather', label: 'Emotional Weather', sortOrder: 8, tabs: [
      { id: 'emotional-weather', label: 'Emotional Weather', componentId: 'emotionalWeather', sortOrder: 0 },
    ]},
    { id: 'system', label: 'System', sortOrder: 9, tabs: [
      { id: 'config',   label: 'Config',       componentId: 'config',   sortOrder: 0 },
      { id: 'lineage',  label: 'Data Lineage', componentId: 'lineage',  sortOrder: 1 },
      { id: 'command-center', label: 'Command Center', componentId: 'commandCenter', sortOrder: 2 },
      { id: 'methodology-config', label: 'Methodology Config', componentId: 'methodologyConfig', sortOrder: 3 },
    ]},
    { id: 'eidos', label: 'EIDOS Operating Model', sortOrder: 4, tabs: [
      { id: 'eidos', label: 'EIDOS Operating Model', componentId: 'eidos', sortOrder: 0 },
    ]},
    { id: 'website-intelligence', label: 'Website Intelligence', sortOrder: 4.5, tabs: [
      { id: 'website-intelligence', label: 'Public Site Inventory', componentId: 'websiteIntelligence', sortOrder: 0 },
    ]},
  ],
};

// Ultimate fallback if the page-types API is unreachable — matches the single
// Hero section every page got before the page type registry existed, so a
// network failure degrades to today's exact behavior rather than breaking.
const FALLBACK_PAGE_TYPES = {
  types: [
    { id: 'standard', label: 'Standard', description: '', defaultSections: [
      { type: 'hero', name: 'Hero', bg: 'navy', fields: { heading: '{{pageName}}', subtitle: 'Add your intro here.' } },
    ]},
  ],
};

const STATUS_CYCLE = ['live', 'draft', 'soon'];

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function substitutePageName(value, pageName) {
  return typeof value === 'string' ? value.replace(/\{\{pageName\}\}/g, pageName) : value;
}

// Clones a page type's defaultSections template into real section objects for
// a newly created page: fresh ids, {{pageName}} substituted. Falls back to
// FALLBACK_PAGE_TYPES's single Hero template if the type isn't found (e.g.
// the registry hasn't loaded yet) — zero regression from today's behavior.
function instantiatePageSections(pageTypes, typeId, key, pageName) {
  const type = pageTypes?.types?.find((t) => t.id === typeId);
  const template = type?.defaultSections?.length ? type.defaultSections : FALLBACK_PAGE_TYPES.types[0].defaultSections;
  return template.map((sec, i) => ({
    id: `${key}-${sec.type}-${i}`,
    type: sec.type,
    name: substitutePageName(sec.name, pageName),
    status: 'live',
    bg: sec.bg || 'ivory',
    fields: Object.fromEntries(
      Object.entries(sec.fields || {}).map(([k, v]) => [k, substitutePageName(v, pageName)])
    ),
  }));
}

// `scope` controls which data the shell is editing and which tabs it shows:
//   'admin'  — the Salt Basin platform site (Betsy's view). Shows all tabs.
//   'member' — the logged-in member's own site. Hides Leads + Net Works.
// Both scopes use the same Sidebar / EditorPane / PreviewPane / ConfigPanel —
// only the API endpoints and the chrome differ.
export default function AdminShell({ scope = 'admin', orgId = null }) {
  const nav = useNavigate();
  const isOrg = scope === 'org-admin' || scope === 'org-user';
  const readOnly = scope === 'org-user';
  const isMember = scope !== 'admin';
  const apis = isOrg
    ? {
        getSite: () => api.getOrgSite(orgId),
        saveSite: (site) => api.saveOrgSite(orgId, site),
        publish: () => api.publishOrgPortal(orgId),
        getConfig: () => api.getOrgConfig(orgId),
        saveConfig: (config) => api.saveOrgConfig(orgId, config),
      }
    : isMember
    ? {
        getSite:    api.getMemberDraftSite,
        saveSite:   api.saveMemberDraftSite,
        publish:    async () => {
          await api.publishMemberSite();
          await api.publishMemberConfig();
        },
        getConfig:  api.getMemberDraftConfig,
        saveConfig: api.saveMemberDraftConfig,
      }
    : {
        getSite:    api.getDraftSite,
        saveSite:   api.saveDraftSite,
        publish:    api.publish,
        getConfig:  api.getDraftConfig,
        saveConfig: api.saveDraftConfig,
      };

  const [savedSite, setSavedSite] = useState(null); // last server-confirmed draft
  const [draft, setDraft] = useState(null); // local in-progress draft
  const [savedConfig, setSavedConfig] = useState(null);
  const [configDraft, setConfigDraft] = useState(null);
  const [profileSlug, setProfileSlug] = useState(null); // members get a /u/:slug

  // Landing tab (2026-08-07): both roles land on their crystal orbit world
  // instead of the site editor — members on Career Placement Agents
  // (mirrors defaultMemberConfig.js's memberTabs order, first entry), admins
  // (Betsy) on the Commercial Opportunity Pipeline (the 'crm' view's
  // 'commercial-opportunities' tab id, seeded into admin_nav by db.js's
  // one-shot migration). Org scopes keep the old 'content' default — orgs
  // have no orbit-world tab wired yet. The tab-guard effect below corrects
  // the member case against configDraft.navigation.memberTabs once it
  // loads, so a member whose own memberTabs don't include
  // 'careerPlacementAgents' still lands correctly; for admin, the adminNav-
  // load effect resolves activeViewId from whichever view owns this tab id,
  // so it self-corrects the same way if admin_nav is ever edited.
  const [tab, setTab] = useState(scope === 'member' ? 'careerPlacementAgents' : scope === 'admin' ? 'commercial-opportunities' : 'content'); // active tab id (from nav.views[].tabs[].id)
  const [view, setView] = useState('split'); // 'split' | 'editor' | 'preview' (content editor sub-mode)

  // Data-driven nav (admin only). Members keep the hardcoded 2-tab strip.
  // Named adminNav to avoid shadowing useNavigate()'s `nav` earlier in the file.
  const [adminNav, setAdminNav] = useState(null);
  const [activeViewId, setActiveViewId] = useState(null);

  const [currentPageKey, setCurrentPageKey] = useState('home');
  const [currentSectionId, setCurrentSectionId] = useState(null);
  // On desktop the sidebar is always visible; on mobile it slides over.
  // Default starts visible so first-time users can find pages.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Split-view editor/preview ratio. 0.55 = editor takes 55%, preview 45%.
  // Persisted in localStorage so each browser remembers the user's preference.
  // MUST come after `sidebarOpen` declaration — the drag handler reads it
  // and the useEffect deps array reads it at call time (TDZ otherwise).
  const SPLIT_KEY = `sb_admin_split_${scope}`;
  const [splitRatio, setSplitRatio] = useState(() => {
    const v = parseFloat(localStorage.getItem(SPLIT_KEY));
    return Number.isFinite(v) && v >= 0.2 && v <= 0.8 ? v : 0.55;
  });
  const [dragging, setDragging] = useState(false);
  const workspaceRef = React.useRef(null);

  // Save ratio when it stops moving.
  useEffect(() => {
    if (!dragging) localStorage.setItem(SPLIT_KEY, String(splitRatio));
  }, [dragging, splitRatio, SPLIT_KEY]);

  // Global mouse listener while dragging.
  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const root = workspaceRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      // Subtract the sidebar's width if visible to get the pure split area.
      const sidebarWidth = sidebarOpen ? 260 : 0;
      const left = rect.left + sidebarWidth;
      const usable = rect.width - sidebarWidth;
      const rel = (e.clientX - left) / usable;
      const clamped = Math.max(0.2, Math.min(0.8, rel));
      setSplitRatio(clamped);
    }
    function onUp() { setDragging(false); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, sidebarOpen]);

  const [pageModal, setPageModal] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);
  const [pageTypes, setPageTypes] = useState(FALLBACK_PAGE_TYPES);
  const [pageTypeManagerOpen, setPageTypeManagerOpen] = useState(false);

  // ── Load admin nav structure (admin only) ──
  // Fetches once on mount; falls back to FALLBACK_ADMIN_NAV if the API is
  // unreachable so the shell never gets stuck in a loading state.
  useEffect(() => {
    if (isMember) return;
    let cancelled = false;
    api.getAdminNav()
      .then((data) => {
        if (cancelled) return;
        const useNav = (data?.views || []).length > 0 ? data : FALLBACK_ADMIN_NAV;
        setAdminNav(useNav);
        // Seed active view: pick the view that owns the current tab, or first.
        const owningView = useNav.views.find((v) => v.tabs.some((t) => t.id === tab));
        setActiveViewId((owningView || useNav.views[0])?.id || null);
      })
      .catch(() => {
        if (cancelled) return;
        setAdminNav(FALLBACK_ADMIN_NAV);
        const owningView = FALLBACK_ADMIN_NAV.views.find((v) => v.tabs.some((t) => t.id === tab));
        setActiveViewId((owningView || FALLBACK_ADMIN_NAV.views[0])?.id || null);
      });
    return () => { cancelled = true; };
  }, [isMember]);

  // ── Load page type registry (both scopes) ──
  // Platform-wide "New Page" taxonomy — members get a read-only view via the
  // mirrored member-config route. Falls back to FALLBACK_PAGE_TYPES (today's
  // single-Hero behavior) if the API is unreachable.
  useEffect(() => {
    let cancelled = false;
    const fetchTypes = isOrg ? () => api.getOrgPageTypes(orgId) : isMember ? api.getMemberPageTypes : api.getPageTypes;
    fetchTypes()
      .then((data) => {
        if (cancelled) return;
        setPageTypes((data?.types || []).length > 0 ? data : FALLBACK_PAGE_TYPES);
      })
      .catch(() => { if (!cancelled) setPageTypes(FALLBACK_PAGE_TYPES); });
    return () => { cancelled = true; };
  }, [isMember, isOrg, orgId]);

  // When the active view changes, ensure `tab` is one of that view's tabs.
  // Without this guard, switching views could leave `tab` pointing at a
  // hidden tab and the workspace would render nothing.
  function switchView(viewId) {
    setActiveViewId(viewId);
    const v = adminNav?.views.find((x) => x.id === viewId);
    if (v && !v.tabs.some((t) => t.id === tab)) {
      const firstTab = [...v.tabs].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
      if (firstTab) setTab(firstTab.id);
    }
  }

  // Lets a child panel (e.g. ChooseYourPathScreen's "public site career
  // layout" link, via CareerMasterEntryPoint) switch the active tab without
  // needing setTab threaded through props.
  useEffect(() => {
    const handler = (e) => { if (e.detail?.tab) setTab(e.detail.tab); };
    window.addEventListener('sb-admin-switch-tab', handler);
    return () => window.removeEventListener('sb-admin-switch-tab', handler);
  }, []);

  // Member-scope equivalent of switchView's guard above: 'tab' must always be
  // one of the member's own memberTabs. The 'content'/'config' fallback
  // branches below are gated off for scope === 'member' (public profile
  // editing stays disabled for members for now, 2026-07-30), so if `tab` ever
  // points outside memberTabs — the sb-admin-switch-tab event above, stale
  // localStorage/URL state, a future bug — this snaps it back to the
  // member's first configured tab instead of leaving the workspace blank.
  useEffect(() => {
    if (scope !== 'member' || !configDraft) return;
    const tabs = (configDraft.navigation?.memberTabs || []).filter((t) => t.enabled !== false);
    if (tabs.length === 0 || tabs.some((t) => t.id === tab)) return;
    const firstTab = [...tabs].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    setTab(firstTab.id);
  }, [scope, configDraft, tab]);

  // ── Load ──
  useEffect(() => {
    const calls = [apis.getSite(), apis.getConfig()];
    if (isMember) {
      // Member needs their slug so the "View My Profile" link works. The
      // members router exposes it via /api/members/me/profile.
      calls.push(
        fetch('/api/members/me/profile', { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
    Promise.all(calls)
      .then(([site, cfg, profile]) => {
        setSavedSite(site);
        setDraft(site);
        setSavedConfig(cfg);
        setConfigDraft(cfg);
        if (profile?.slug) setProfileSlug(profile.slug);
        const firstPage = Object.keys(site.pages || {})[0];
        if (firstPage) setCurrentPageKey(firstPage);
      })
      .catch((e) => toast('Failed to load: ' + e.message));
  }, []);

  // ── Derived ──
  const currentPage = draft?.pages?.[currentPageKey];
  const currentSection = currentPage?.sections?.find((s) => s.id === currentSectionId);
  const siteDirty = useMemo(() => !deepEqual(savedSite, draft), [savedSite, draft]);
  const configDirty = useMemo(() => !deepEqual(savedConfig, configDraft), [savedConfig, configDraft]);
  const dirty = siteDirty || configDirty;

  // ── Mutators (draft only) ──
  function patchDraft(updater) {
    setDraft((d) => updater(JSON.parse(JSON.stringify(d))));
  }

  function updateSection(patch) {
    patchDraft((d) => {
      const pg = d.pages[currentPageKey];
      const idx = pg.sections.findIndex((s) => s.id === currentSectionId);
      if (idx < 0) return d;
      const current = pg.sections[idx];
      // layoutPatch merges into the *live* layout sub-object here (against the
      // freshest draft, inside this functional updater) rather than the caller
      // pre-merging against its own props — two layout controls patched back
      // to back in the same tick (before React re-renders) would otherwise each
      // read a stale `section.layout` closure and clobber each other's change.
      if (patch.layoutPatch) {
        const { layoutPatch, ...rest } = patch;
        pg.sections[idx] = { ...current, ...rest, layout: { ...(current.layout || {}), ...layoutPatch } };
      } else {
        pg.sections[idx] = { ...current, ...patch };
      }
      return d;
    });
  }

  function updatePage(patch) {
    patchDraft((d) => {
      d.pages[currentPageKey] = { ...d.pages[currentPageKey], ...patch };
      return d;
    });
  }

  function updatePageStatus(status) {
    patchDraft((d) => {
      d.pages[currentPageKey].status = status;
      return d;
    });
  }

  function cycleSectionStatus(id) {
    patchDraft((d) => {
      const sec = d.pages[currentPageKey].sections.find((s) => s.id === id);
      if (!sec) return d;
      sec.status = STATUS_CYCLE[(STATUS_CYCLE.indexOf(sec.status) + 1) % 3];
      return d;
    });
  }

  function deleteSection(id) {
    patchDraft((d) => {
      const pg = d.pages[currentPageKey];
      pg.sections = pg.sections.filter((s) => s.id !== id);
      return d;
    });
    if (currentSectionId === id) setCurrentSectionId(null);
  }

  function reorderSections(newSections) {
    patchDraft((d) => {
      d.pages[currentPageKey].sections = newSections;
      return d;
    });
  }

  function deletePage(key) {
    if (Object.keys(draft.pages).length <= 1) {
      toast("Can't delete the only page");
      return;
    }
    patchDraft((d) => {
      delete d.pages[key];
      return d;
    });
    if (currentPageKey === key) {
      setCurrentPageKey(Object.keys(draft.pages).filter((k) => k !== key)[0]);
      setCurrentSectionId(null);
    }
  }

  function addPage({ name, slug, type, status }) {
    const key = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!key) return toast('Page needs a name');
    if (draft.pages[key]) return toast('A page with that slug already exists');
    patchDraft((d) => {
      const order = Object.keys(d.pages).length;
      d.pages[key] = {
        key,
        name,
        slug: slug || key,
        type,
        status,
        order,
        sections: instantiatePageSections(pageTypes, type, key, name),
      };
      return d;
    });
    setCurrentPageKey(key);
    setPageModal(null);
    toast(`"${name}" page created`);
  }

  function addSection({ name, type, columns, bg, status, fields }) {
    if (!name) return toast('Section needs a name');
    const id = `sec-${Date.now()}`;
    const seedFields = fields || { heading: name, intro: 'Add your content here.' };
    patchDraft((d) => {
      d.pages[currentPageKey].sections.push({
        id, type, name, status: status || 'visible', bg: bg || '',
        columns: columns || 1,
        fields: seedFields,
        fieldMeta: {},
      });
      return d;
    });
    setCurrentSectionId(id);
    setSectionModal(null);
    toast(`"${name}" added`);
  }

  // ── Save / Publish / Discard ──
  async function save() {
    try {
      if (siteDirty) {
        await apis.saveSite(draft);
        setSavedSite(draft);
      }
      if (configDirty) {
        await apis.saveConfig(configDraft);
        setSavedConfig(configDraft);
      }
      toast('Draft saved');
    } catch (e) {
      toast('Save failed: ' + e.message);
    }
  }

  async function publish() {
    if (dirty) {
      const yes = confirm(
        'You have unsaved changes. Save first, then publish? (Cancel to abort.)'
      );
      if (!yes) return;
      await save();
    } else {
      const yes = confirm(
        isMember
          ? 'Promote your draft to your public profile?'
          : 'Promote the current draft to the public site?'
      );
      if (!yes) return;
    }
    try {
      await apis.publish();
      toast(isMember ? 'Published ↗ Profile updated' : 'Published ↗ Public site updated');
    } catch (e) {
      toast('Publish failed: ' + e.message);
    }
  }

  function discard() {
    if (!confirm('Discard all unsaved changes since the last save?')) return;
    setDraft(savedSite);
    setConfigDraft(savedConfig);
    toast('Reverted to last saved draft');
  }

  async function logout() {
    // Always land on the login page, even if the logout call fails (expired
    // session, server restart, network blip) — the user asked to leave.
    try {
      await api.logout();
    } catch {
      /* session may already be gone; proceed to login regardless */
    }
    nav('/login', { replace: true });
  }

  if (!draft || !configDraft) return null;

  return (
    <div className="sb-admin-shell" style={styles.shell}>
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {tab === 'content' && (
            <button
              type="button"
              className="sb-admin-mobile-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? 'Hide pages list' : 'Show pages list'}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          )}
          <div>
            <div
              className="sb-display"
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--sb-admin-text)',
              }}
            >
              {isMember ? (configDraft?.site?.ownerName || 'My Profile') : 'Salt Basin Net Works'}
            </div>
            <div
              className="sb-toggle-hide-mobile"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--sb-admin-gold-warm)',
                marginTop: 1,
              }}
            >
              {isMember ? `Operator Console · /u/${profileSlug || ''}` : 'Site Management Console'}
            </div>
          </div>
        </div>
        <div
          className="sb-admin-topbar-actions"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          {/* Member: keep the simple 2-tab strip. Admin: render the view selector
              from the data-driven nav loaded into `nav`. Until nav loads we show
              nothing rather than flashing a stale layout. */}
          {isMember ? (
            <TabToggle
              items={(configDraft?.navigation?.memberTabs || [])
                .filter((item) => item.enabled !== false)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => ({ val: item.id, label: item.label }))}
              active={tab}
              onChange={setTab}
            />
          ) : adminNav ? (
            <TabToggle
              items={[...adminNav.views]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((v) => ({ val: v.id, label: v.label }))}
              active={activeViewId}
              onChange={switchView}
            />
          ) : null}
          {tab === 'content' && (
            <span className="sb-toggle-hide-mobile">
              <TabToggle
                items={[
                  { val: 'split', label: 'Split' },
                  { val: 'editor', label: 'Edit Only' },
                  { val: 'preview', label: 'Preview Only' },
                  { val: 'layout', label: 'Layout' },
                ]}
                active={view}
                onChange={setView}
              />
            </span>
          )}
          {isMember ? (
            <>
              {profileSlug && (
                <a
                  href={`/u/${profileSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sb-btn sb-btn-outline sb-toggle-hide-mobile"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
                >
                  View My Profile
                </a>
              )}
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="sb-btn sb-btn-outline sb-toggle-hide-mobile"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
              >
                Visit Salt Basin ↗
              </a>
            </>
          ) : (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="sb-btn sb-btn-outline sb-toggle-hide-mobile"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
            >
              View Public
            </a>
          )}
          <button
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sub-nav: active view's tab strip. Only rendered for admins (members
          have a flat single-row nav). Hidden when the view has just one tab
          to keep the chrome quiet. */}
      {!isMember && adminNav && (() => {
        const activeView = adminNav.views.find((v) => v.id === activeViewId);
        if (!activeView || activeView.tabs.length <= 1) return null;
        return (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem 1.5rem',
            background: 'var(--sb-admin-surface)',
            borderBottom: '0.5px solid var(--sb-admin-border)',
            flexShrink: 0,
          }}>
            <TabToggle
              items={[...activeView.tabs]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((t) => ({ val: t.id, label: t.label }))}
              active={tab}
              onChange={setTab}
            />
          </div>
        );
      })()}

      <div ref={workspaceRef} className="sb-admin-workspace" style={{ ...styles.workspace, userSelect: dragging ? 'none' : undefined, cursor: dragging ? 'col-resize' : undefined }}>
        {/* Single resolver: figures out which panel/component renders for the
            active tab. Order: registry first (data-driven tabs like Leads,
            Backlog, QA), then the two shell-bound special cases (content
            editor, config panel) which need shell state and can't live in
            the registry. */}
        {(() => {
          // Resolve which component to show. For admins, the nav says which
          // componentId belongs to this tab; for members, the tab id IS the
          // componentId.
          let componentId = isMember
            ? (configDraft?.navigation?.memberTabs || []).find((item) => item.id === tab)?.componentId || tab
            : tab;
          if (!isMember && adminNav) {
            const activeView = adminNav.views.find((v) => v.id === activeViewId);
            const activeTab = activeView?.tabs.find((t) => t.id === tab);
            if (activeTab) componentId = activeTab.componentId;
          }
          // Registry case: simple panels with no shell-state dependency.
          if (!isMember && TAB_COMPONENTS[componentId]) {
            const Entry = TAB_COMPONENTS[componentId];
            return <Entry scope="admin" />;
          }
          // Inline 'content' case: the page/section editor composes the
          // Sidebar + EditorPane + PreviewPane and needs lots of shell state.
          // Gated to scope !== 'member' (2026-07-30): the public profile site
          // editor stays disabled for members for now, and this branch has no
          // TAB_COMPONENTS/isMember guard of its own — anything that ever sets
          // `tab` to 'content' for a member (a stale event, old URL/
          // localStorage state, ...) would otherwise render the full editor
          // regardless of memberTabs. The tab-guard effect above resets `tab`
          // back to a valid member tab in this situation; re-enable alongside
          // the 'content' memberTabs entry.
          if (componentId === 'content' && scope !== 'member') {
            return (
          <>
            <div className={`sb-admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
              <Sidebar
                site={draft}
                currentPageKey={currentPageKey}
                currentSectionId={currentSectionId}
                onSelectPage={(k) => {
                  setCurrentPageKey(k);
                  setCurrentSectionId(null);
                  setSidebarOpen(false);  // auto-close on mobile after selecting
                }}
                onSelectSection={(id) => {
                  setCurrentSectionId(id);
                  setSidebarOpen(false);
                }}
                onExpandSection={(id) => setCurrentSectionId(id)}
                onAddPage={() => setPageModal({ name: '', slug: '', type: pageTypes?.types?.[0]?.id || 'standard', status: 'draft' })}
                onAddSection={() => setSectionModal(true)}
                onDeleteSection={deleteSection}
                onCycleSectionStatus={cycleSectionStatus}
                onDeletePage={deletePage}
                onReorderSections={reorderSections}
                onUpdateSection={updateSection}
              />
            </div>
            {!readOnly && (view === 'split' || view === 'editor') && (
              <div
                className="sb-admin-editor"
                style={
                  view === 'split'
                    ? { display: 'flex', flexBasis: `${splitRatio * 100}%`, flexShrink: 1, flexGrow: 0, minWidth: 280, overflow: 'hidden' }
                    : { display: 'flex', flex: 1, minWidth: 0 }
                }
              >
                <EditorPane
                  section={currentSection}
                  page={currentPage}
                  site={draft}
                  config={configDraft}
                  onUpdateSection={updateSection}
                  onUpdatePageStatus={updatePageStatus}
                  onUpdatePage={updatePage}
                />
              </div>
            )}
            {!readOnly && view === 'split' && (
              <SplitDivider
                dragging={dragging}
                onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
                onDoubleClick={() => setSplitRatio(0.55)}
              />
            )}
            {(readOnly || view === 'split' || view === 'preview') && (
              <div
                className="sb-admin-preview"
                style={
                  view === 'split'
                    ? { display: 'flex', flex: 1, minWidth: 280, overflow: 'hidden' }
                    : { display: 'flex', flex: 1 }
                }
              >
                <PreviewPane site={draft} config={configDraft} currentPageKey={currentPageKey} isMember={isMember} slug={profileSlug} />
              </div>
            )}
            {view === 'layout' && (
              <div className="sb-admin-editor" style={{ display: 'flex', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <PageLayoutView
                  page={currentPage}
                  currentSectionId={currentSectionId}
                  onSelectSection={(id) => setCurrentSectionId(id)}
                  onReorderSections={reorderSections}
                  onUpdateSection={updateSection}
                />
              </div>
            )}
          </>
            );
          }
          if (componentId === 'resume')          return <CareerConsentGate><MyResumePanel scope={scope} /></CareerConsentGate>;
          if (componentId === 'outputTemplates') return <OutputTemplateConfiguratorHub scope={scope} />;
          if (componentId === 'careerMaster')    return <CareerMasterEntryPoint scope={scope} />;
          if (componentId === 'inbox')           return <InboxPanel />;
          if (componentId === 'products')        return <MemberProductsPanel />;
          if (componentId === 'stats')           return <MemberStatsPanel isAdmin={!isMember} />;
          if (componentId === 'audit')           return <MemberAuditPanel isAdmin={!isMember} />;
          if (componentId === 'agent')           return <MemberAgentPanel />;
          if (componentId === 'profiles')        return <ProfileHub isAdmin={!isMember} />;
          if (componentId === 'memberNrm')       return <NrmPanel isAdmin={false} />;
          if (componentId === 'memberAnalytics') return <AnalyticsPanel isAdmin={false} />;
          if (componentId === 'memberPlm')       return <MemberPlmPanel scope={scope} />;
          if (componentId === 'financial')       return <MemberFinancialPanel />;
          if (componentId === 'entitlements')     return <MemberEntitlementsPanel />;
          if (componentId === 'orgDocuments')     return <OrgDocumentsPanel orgId={orgId} />;
          if (componentId === 'proposalExperience') return <ProposalExperiencePanel />;
          if (componentId === 'lonetreeMvp')       return <LonetreeMvpPanel scope={scope} />;
          if (componentId === 'careerPlacementAgents') return <CareerPlacementAgentsPanel scope={scope} />;

          // Inline 'config' case: the panel needs draft + setter + scope from
          // the shell. Treated as the default fallback when nothing else
          // matched. Member site config editing (2026-08-07, World Shell
          // Public Site Configuration island) is now enabled — ConfigPanel
          // is already scope-aware (`scope='member'`), it was only ever
          // gated off here, not incapable of rendering for members.
          return (
            <ConfigPanel config={configDraft} onChange={setConfigDraft} scope={scope} site={draft} />
          );
        })()}
      </div>

      {/* PublishBar is the bottom save/publish strip; only relevant for tabs
          that produce publishable changes (content / config). The data-driven
          set of "non-publish" tabs is derived from the registry — anything
          in TAB_COMPONENTS is a self-contained panel that handles its own
          persistence, so it gets the PublishBar hidden.
          `scope === 'member'` is excluded outright (2026-07-30): the personal
          public profile stays disabled for members for now, and 'content'/
          'config' are already unlinked from memberTabs — but 'proposalExperience'
          (the member's default tab) isn't in TAB_COMPONENTS and isn't a
          self-persisting panel, so without this guard the bar (and its
          Publish button, which promotes member_sites/member_configs straight
          to published) would render underneath it. Org portal scopes
          (org-admin) still need PublishBar for their own site/config publish,
          so this only excludes personal member scope, not `isMember` broadly. */}
      {!readOnly && scope !== 'member' && !TAB_COMPONENTS[(() => {
        if (!adminNav || isMember) return tab;
        const v = adminNav.views.find((x) => x.id === activeViewId);
        const t = v?.tabs.find((x) => x.id === tab);
        return t?.componentId || tab;
      })()] && !['stats', 'audit', 'agent', 'profiles', 'resume', 'memberNrm', 'memberAnalytics', 'memberPlm', 'financial', 'governance', 'careerPlacementAgents'].includes(tab) && (
        <PublishBar
          dirty={dirty}
          siteDirty={siteDirty}
          configDirty={configDirty}
          onSave={save}
          onDiscard={discard}
          onPublish={publish}
        />
      )}

      {pageModal && (
        <PageModal
          value={pageModal}
          onChange={setPageModal}
          onSubmit={() => addPage(pageModal)}
          onCancel={() => setPageModal(null)}
          pageTypes={pageTypes}
          isMember={isMember}
          onManageTypes={() => setPageTypeManagerOpen(true)}
        />
      )}
      {pageTypeManagerOpen && !isMember && (
        <PageTypeManagerPanel
          pageTypes={pageTypes}
          onSave={async (types) => {
            await api.updatePageTypes(types);
            setPageTypes(types);
            toast('Page types saved');
          }}
          onClose={() => setPageTypeManagerOpen(false)}
        />
      )}
      {sectionModal && (
        <SectionTemplateModal
          onConfirm={(data) => addSection(data)}
          onClose={() => setSectionModal(null)}
        />
      )}
    </div>
  );
}

function PublishBar({ dirty, siteDirty, configDirty, onSave, onDiscard, onPublish }) {
  const status = dirty
    ? `Unsaved: ${siteDirty ? 'content' : ''}${siteDirty && configDirty ? ' + ' : ''}${
        configDirty ? 'config' : ''
      }`
    : 'All changes saved';
  return (
    <div style={styles.saveBar}>
      <span style={{ flex: 1, fontSize: '0.78rem', color: dirty ? 'var(--sb-admin-gold-warm)' : 'var(--sb-admin-success)' }}>
        {status}
      </span>
      <button
        className="sb-btn sb-btn-outline"
        style={{ padding: '0.5rem 1.1rem', fontSize: '0.72rem' }}
        onClick={onDiscard}
        disabled={!dirty}
      >
        Discard
      </button>
      <button
        className="sb-btn sb-btn-outline"
        style={{ padding: '0.5rem 1.1rem', fontSize: '0.72rem' }}
        onClick={onSave}
        disabled={!dirty}
      >
        Save Draft
      </button>
      <button
        className="sb-btn sb-btn-gold"
        style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem' }}
        onClick={onPublish}
      >
        Publish ↗
      </button>
    </div>
  );
}

// Vertical divider with a draggable grip between the editor and preview
// panes. Mouse-down arms drag (handled by the parent's effect); double-click
// resets the ratio to the default 55/45 split.
function SplitDivider({ dragging, onMouseDown, onDoubleClick }) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title="Drag to resize · double-click to reset"
      style={{
        width: 6,
        flexShrink: 0,
        cursor: 'col-resize',
        background: dragging ? 'rgba(196,132,58,0.4)' : 'rgba(196,132,58,0.12)',
        borderLeft: '0.5px solid rgba(196,132,58,0.2)',
        borderRight: '0.5px solid rgba(196,132,58,0.2)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: dragging ? 'none' : 'background 0.15s',
      }}
    >
      <div
        style={{
          width: 2,
          height: 36,
          background: dragging ? 'var(--sb-gold)' : 'rgba(196,132,58,0.5)',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function TabToggle({ items, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        border: '0.5px solid var(--sb-admin-border)',
        borderRadius: 'var(--sb-radius)',
        overflow: 'hidden',
      }}
    >
      {items.map((it) => (
        <button
          key={it.val}
          onClick={() => onChange(it.val)}
          style={{
            padding: '0.4rem 0.9rem',
            background: active === it.val ? 'var(--sb-admin-gold)' : 'transparent',
            color: active === it.val ? '#FFFDF8' : 'var(--sb-admin-text-soft)',
            border: 'none',
            fontFamily: 'var(--sb-font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onCancel, onSubmit, submitLabel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--sb-admin-surface-alt)',
          border: '0.5px solid var(--sb-admin-gold)',
          borderRadius: 'var(--sb-radius)',
          padding: '1.75rem',
          width: '100%',
          maxWidth: 460,
        }}
      >
        <div className="sb-display" style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--sb-admin-text)' }}>
          {title}
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="sb-btn sb-btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="sb-btn sb-btn-gold" onClick={onSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageModal({ value, onChange, onSubmit, onCancel, pageTypes, isMember, onManageTypes }) {
  const types = pageTypes?.types?.length ? pageTypes.types : FALLBACK_PAGE_TYPES.types;
  const selectedType = types.find((t) => t.id === value.type);
  return (
    <Modal title="Add New Page" onCancel={onCancel} onSubmit={onSubmit} submitLabel="Create Page">
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Page Name</label>
        <input
          className="sb-input"
          value={value.name}
          autoFocus
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>URL Slug</label>
        <input
          className="sb-input"
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
          placeholder="e.g. portfolio"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Type</label>
          <select className="sb-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Initial Status</label>
          <select className="sb-input" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="soon">Coming Soon</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>
      {selectedType?.description && (
        <div style={{ fontSize: '0.7rem', color: 'var(--sb-admin-text-soft)', lineHeight: 1.5, marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
          {selectedType.description}
        </div>
      )}
      {!isMember && (
        <button
          type="button"
          onClick={onManageTypes}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.72rem', color: 'var(--sb-gold)', textDecoration: 'underline' }}
        >
          Manage Page Types →
        </button>
      )}
    </Modal>
  );
}

function SectionModal({ value, onChange, onSubmit, onCancel }) {
  return (
    <Modal title="Add New Section" onCancel={onCancel} onSubmit={onSubmit} submitLabel="Add Section">
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Section Name</label>
        <input
          className="sb-input"
          value={value.name}
          autoFocus
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Type</label>
          <select className="sb-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
            <optgroup label="Content">
              <option value="text">Text</option>
              <option value="twoCol">Two Column</option>
              <option value="hero">Hero</option>
              <option value="cards">Cards</option>
              <option value="cta">Call to Action</option>
            </optgroup>
            <optgroup label="Profile / Portfolio">
              <option value="resume">Resume / Experience</option>
              <option value="domains">Domains of Expertise</option>
              <option value="caseStudies">Case Studies</option>
              <option value="referencesRequest">References</option>
            </optgroup>
            <optgroup label="Visuals">
              <option value="statGrid">Stat Grid</option>
              <option value="process">Process / Steps</option>
              <option value="columns">Columns</option>
              <option value="iconGrid">Icon Grid</option>
            </optgroup>
            <optgroup label="Site">
              <option value="contact">Contact Form</option>
              <option value="socialGrid">Social Grid</option>
              <option value="scripture">Scripture Band</option>
              <option value="netWorksBanner">Net Works Banner (member cards)</option>
              <option value="joinNetwork">Join the Network CTA</option>
            </optgroup>
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Background</label>
          <select className="sb-input" value={value.bg} onChange={(e) => onChange({ ...value, bg: e.target.value })}>
            <option value="ivory">Ivory</option>
            <option value="navy">Navy</option>
            <option value="linen">Linen</option>
            <option value="teal">Teal</option>
            <option value="cream">Cream</option>
          </select>
        </div>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Initial Status</label>
        <select className="sb-input" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="soon">Coming Soon</option>
          <option value="live">Live</option>
        </select>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Intro / description</label>
        <textarea
          className="sb-input sb-textarea"
          value={value.desc}
          onChange={(e) => onChange({ ...value, desc: e.target.value })}
        />
      </div>
    </Modal>
  );
}
