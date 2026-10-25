import React, { useState, useEffect } from 'react';
import { DEFAULT_BIODATA, DEFAULT_THEME } from './data/defaultBiodata';
import { BiodataContent, ThemeSettings } from './types/biodata';
import { BackgroundCanvas } from './components/public/BackgroundCanvas';
import { CustomCursor } from './components/public/CustomCursor';
import { SolarAvatar } from './components/public/SolarAvatar';
import { FloatingFX } from './components/public/FloatingFX';
import { SectionCard } from './components/public/SectionCard';
import { PersonalGrid } from './components/public/PersonalGrid';
import { ProfessionalSection } from './components/public/ProfessionalSection';
import { FamilyGrid } from './components/public/FamilyGrid';
import { GallerySection } from './components/public/GallerySection';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPage } from './components/admin/LoginPage';
import { AIChatbot } from './components/public/AIChatbot';
import { Shield, Globe, Lock, LockKeyhole } from 'lucide-react';
import {
  saveBiodataToFirestore,
  loadBiodataFromFirestore,
  testFirestoreConnection,
} from './utils/firebase';

const STORAGE_KEY_BIODATA = 'nasir_biodata_content_v1';
const STORAGE_KEY_THEME = 'nasir_biodata_theme_v1';
const STORAGE_KEY_AUTH = 'nasir_admin_auth_session';
const ADMIN_EMAIL = 'nasir.developer.bd@gmail.com';

export default function App() {
  const [biodata, setBiodata] = useState<BiodataContent>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BIODATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.header?.bismillah &&
          (parsed.header.bismillah.includes('ন') ||
            parsed.header.bismillah.includes('শ') ||
            !parsed.header.bismillah.includes('الرَّحْمَٰنِ'))
        ) {
          parsed.header.bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached biodata, using defaults');
    }
    return DEFAULT_BIODATA;
  });

  const [theme, setTheme] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read cached theme, using defaults');
    }
    return DEFAULT_THEME;
  });

  const [lang, setLang] = useState<'en' | 'bn'>('en');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [resetTokenParam, setResetTokenParam] = useState<string | null>(null);

  // Auto-detect password reset token or /login URL route in browser
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('reset_token');
      const hashMatch = window.location.hash.match(/reset_token=([^&]+)/);
      const token = queryToken || (hashMatch ? hashMatch[1] : null);
      if (token) {
        setResetTokenParam(token);
        setIsLoginModalOpen(true);
      }
    } catch (e) {
      console.warn('URL token parse issue', e);
    }

    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const isLogin =
        path === '/login' ||
        path === '/admin' ||
        hash === '#/login' ||
        hash === '#login' ||
        hash === '#/admin' ||
        hash === '#admin';

      if (isLogin) {
        if (isAuthenticated) {
          setIsAdminOpen(true);
          setIsLoginModalOpen(false);
        } else {
          setIsLoginModalOpen(true);
        }
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, [isAuthenticated]);

  // Apply theme variables to root style
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--gold', theme.primaryColor);
    root.style.setProperty('--rose', theme.secondaryColor);
    root.style.setProperty('--teal', theme.accentColor);
    root.style.setProperty('--bg', theme.bgColor);
    root.style.setProperty('--bg2', theme.bg2Color);
  }, [theme]);

  const handleOpenAdmin = () => {
    if (isAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
    } catch (e) {
      console.error(e);
    }
    setIsLoginModalOpen(false);
    setIsAdminOpen(true);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/login' || path === '/admin') {
      window.history.replaceState({}, '', '/');
    }
    if (hash.includes('login') || hash.includes('admin')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error(e);
    }
    setIsAdminOpen(false);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/login' || path === '/admin') {
      window.history.replaceState({}, '', '/');
    }
    if (hash.includes('login') || hash.includes('admin')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Synchronize Firestore, server biodata, and local storage on mount
  useEffect(() => {
    // Test Firestore connection on boot
    testFirestoreConnection().catch(() => {});

    // First try loading latest biodata directly from Firestore
    loadBiodataFromFirestore()
      .then((firestoreData) => {
        if (firestoreData && firestoreData.header && firestoreData.header.name) {
          if (
            firestoreData.header.bismillah &&
            (firestoreData.header.bismillah.includes('ন') ||
              firestoreData.header.bismillah.includes('শ') ||
              !firestoreData.header.bismillah.includes('الرَّحْمَٰنِ'))
          ) {
            firestoreData.header.bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
          }
          setBiodata(firestoreData);
          try {
            localStorage.setItem(STORAGE_KEY_BIODATA, JSON.stringify(firestoreData));
          } catch {}
          return;
        }

        // Fallback to server API if Firestore document not yet created
        fetch('/api/biodata')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.biodata && data.biodata.header) {
              if (
                data.biodata.header.bismillah &&
                (data.biodata.header.bismillah.includes('ন') ||
                  data.biodata.header.bismillah.includes('শ') ||
                  !data.biodata.header.bismillah.includes('الرَّحْمَٰنِ'))
              ) {
                data.biodata.header.bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
              }
              const saved = localStorage.getItem(STORAGE_KEY_BIODATA);
              if (!saved) {
                setBiodata(data.biodata);
              } else {
                try {
                  const parsed = JSON.parse(saved);
                  if (
                    parsed.header?.bismillah &&
                    (parsed.header.bismillah.includes('ন') ||
                      parsed.header.bismillah.includes('শ') ||
                      !parsed.header.bismillah.includes('الرَّحْمَٰنِ'))
                  ) {
                    parsed.header.bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
                  }
                  fetch('/api/biodata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ biodata: parsed }),
                  }).catch(() => {});
                } catch {}
              }
            }
          })
          .catch((err) => console.log('Biodata server sync check:', err));
      })
      .catch(() => {});
  }, []);

  const handleUpdateBiodata = (updated: BiodataContent) => {
    setBiodata(updated);
    // Persist to Firestore
    saveBiodataToFirestore(updated).catch((err) =>
      console.warn('Could not save to Firestore immediately:', err)
    );
    fetch('/api/biodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata: updated }),
    }).catch(() => {});
  };

  const handlePublish = (updated: BiodataContent) => {
    setBiodata(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BIODATA, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
    } catch (e) {
      console.error('Failed to persist published data', e);
    }
    // Save to Firestore
    saveBiodataToFirestore(updated).catch((err) =>
      console.warn('Could not save to Firestore during publish:', err)
    );
    fetch('/api/biodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata: updated }),
    }).catch(() => {});
  };

  const handleRestoreDefault = () => {
    setBiodata(DEFAULT_BIODATA);
    setTheme(DEFAULT_THEME);
    localStorage.removeItem(STORAGE_KEY_BIODATA);
    localStorage.removeItem(STORAGE_KEY_THEME);
    saveBiodataToFirestore(DEFAULT_BIODATA).catch(() => {});
    fetch('/api/biodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata: DEFAULT_BIODATA }),
    }).catch(() => {});
  };

  const bismillah = lang === 'bn' && biodata.header.bismillahBn ? biodata.header.bismillahBn : biodata.header.bismillah;
  const headerLabel = lang === 'bn' && biodata.header.labelBn ? biodata.header.labelBn : biodata.header.label;
  const name = lang === 'bn' && biodata.header.nameBn ? biodata.header.nameBn : biodata.header.name;
  const title = lang === 'bn' && biodata.header.titleBn ? biodata.header.titleBn : biodata.header.title;
  const subTitle = lang === 'bn' && biodata.header.subTitleBn ? biodata.header.subTitleBn : biodata.header.subTitle;
  const badges = lang === 'bn' && biodata.header.badgesBn ? biodata.header.badgesBn : biodata.header.badges;

  const vis = biodata.sectionVisibility || {
    header: true,
    personal: true,
    occupation: true,
    education: true,
    intro: true,
    strengths: true,
    family: true,
    hobbies: true,
    partner: true,
    contact: true,
    footer: true,
    gallery: true,
  };

  return (
    <div className="relative min-h-screen text-[var(--text)]">
      {/* ══ ATMOSPHERIC VISUAL EFFECTS ══ */}
      {theme.enableCustomCursor && <CustomCursor />}
      {theme.enableParticles && <BackgroundCanvas />}
      {theme.enableFloatingEmojis && <FloatingFX />}

      {/* ══ TOP FLOATING CONTROLS (LANGUAGE & ADMIN DASHBOARD) ══ */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 no-print">
        {/* Language Switcher */}
        <button
          onClick={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
          className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] text-[var(--text)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-black/40 cursor-pointer"
          title="Toggle Language"
        >
          <Globe size={13} className="text-[var(--teal)]" />
          <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Admin Dashboard Access (Visible ONLY when logged in; Login button is hidden publicly and accessible via /login URL) */}
        {isAuthenticated && (
          <button
            onClick={handleOpenAdmin}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-gradient-to-r from-[rgba(240,184,64,0.18)] to-[rgba(232,84,122,0.18)] border border-[rgba(240,184,64,0.35)] text-[var(--gold)] hover:brightness-125 transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-black/40 cursor-pointer"
            title="Open Admin Dashboard"
          >
            <Shield size={13} className="text-[var(--gold)]" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </button>
        )}
      </div>

      {/* ══ MAIN PAGE CONTENT ══ */}
      <div className="page">
        {/* ══ HEADER ══ */}
        {vis.header !== false && (
          <header className="header">
            <div
              className="bismillah"
              dir={lang === 'bn' ? 'ltr' : 'rtl'}
              lang={lang === 'bn' ? 'bn' : 'ar'}
            >
              {bismillah}
            </div>
            <p className="header-label">{headerLabel}</p>

            {/* SOLAR SYSTEM AVATAR WITH ROTATING SHELLS */}
            <SolarAvatar photoUrl={biodata.header.photoUrl} name={name} />

            {/* NAME & DESIGNATION */}
            <h1>
              <span className="grad-text">{name}</span>
            </h1>
            <p className="header-title-plain">
              <span className="shimmer">{title}</span>
            </p>
            <p className="header-sub">{subTitle}</p>

            {/* BADGES ROW */}
            <div className="badge-row">
              {badges.map((badge, idx) => (
                <span key={idx} className="badge">
                  {badge}
                </span>
              ))}
            </div>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-gem">✦</span>
              <div className="divider-line" />
            </div>
          </header>
        )}

        {/* ══ DYNAMICALLY ORDERED BIODATA SECTIONS ══ */}
        {(() => {
          const DEFAULT_ORDER = [
            'personal',
            'occupation',
            'education',
            'intro',
            'strengths',
            'family',
            'hobbies',
            'gallery',
            'partner',
            'contact',
          ];

          const baseOrder =
            biodata.sectionOrder && biodata.sectionOrder.length > 0
              ? biodata.sectionOrder
              : DEFAULT_ORDER;

          // Include any custom sections not explicitly listed in order
          const customIds = (biodata.customSections || []).map((s) => s.id);
          const fullOrder = [
            ...baseOrder,
            ...customIds.filter((id) => !baseOrder.includes(id)),
          ];

          const renderSectionCard = (secKey: string) => {
            switch (secKey) {
              case 'personal':
                return vis.personal !== false ? (
                  <SectionCard
                    key="personal"
                    accent="gold"
                    pcol="255,184,64"
                    icon="👤"
                    title={lang === 'bn' ? 'ব্যক্তিগত তথ্যাবলী' : 'Personal Details'}
                    titleGradientClass="grad-text-gold"
                    id="personal-details"
                  >
                    <PersonalGrid details={biodata.personal} lang={lang} />
                  </SectionCard>
                ) : null;

              case 'occupation':
                return vis.occupation !== false ? (
                  <SectionCard
                    key="occupation"
                    accent="rose"
                    pcol="232,84,122"
                    icon="💼"
                    title={lang === 'bn' ? 'পেশাগত বিবরণ' : 'Occupation'}
                    titleGradientClass="grad-text"
                    id="occupation"
                  >
                    <div className="occ-card">
                      <div className="occ-grade">
                        {lang === 'bn' && biodata.occupation.gradeBn
                          ? biodata.occupation.gradeBn
                          : biodata.occupation.grade}
                      </div>
                      <div className="occ-title">
                        <span className="grad-text">
                          {lang === 'bn' && biodata.occupation.titleBn
                            ? biodata.occupation.titleBn
                            : biodata.occupation.title}
                        </span>
                      </div>
                      <div className="occ-org">
                        {lang === 'bn' && biodata.occupation.organizationBn
                          ? biodata.occupation.organizationBn
                          : biodata.occupation.organization}
                      </div>
                      <div className="occ-duties">
                        {biodata.occupation.duties.map((duty) => (
                          <div key={duty.id} className="occ-duty">
                            <div className="duty-dot" />
                            <span>{lang === 'bn' && duty.textBn ? duty.textBn : duty.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                ) : null;

              case 'education':
                return vis.education !== false ? (
                  <SectionCard
                    key="education"
                    accent="teal"
                    pcol="56,217,192"
                    icon="🎓"
                    title={lang === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education'}
                    titleGradientClass="grad-text-2"
                    id="education"
                  >
                    <div className="edu-timeline">
                      {biodata.education.map((item) => {
                        const inst =
                          lang === 'bn' && item.institutionBn ? item.institutionBn : item.institution;
                        const deg =
                          lang === 'bn' && item.degreeBn ? item.degreeBn : item.degree;

                        return (
                          <div key={item.id} className="edu-item">
                            <div className="edu-left">
                              <div className="edu-node" />
                              <div className="edu-line" />
                            </div>
                            <div className="edu-content">
                              <div className="edu-inst">
                                {item.highlight ? (
                                  <span className="grad-text-gold">{inst}</span>
                                ) : (
                                  inst
                                )}
                              </div>
                              <div className="edu-deg">{deg}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                ) : null;

              case 'intro':
                return vis.intro !== false ? (
                  <SectionCard
                    key="intro"
                    accent="lavender"
                    pcol="176,127,255"
                    icon="🗣️"
                    title={lang === 'bn' ? 'আত্মপরিচয়' : 'Self Introduction'}
                    titleGradientClass="grad-text-2"
                    id="self-intro"
                  >
                    <p className="intro-body">{biodata.intro.bodyEn}</p>
                    <div className="bangla-box">
                      <span className="bangla-lbl">🇧🇩 বাংলা সংস্করণ</span>
                      {biodata.intro.bodyBn}
                    </div>
                  </SectionCard>
                ) : null;

              case 'strengths':
                return vis.strengths !== false ? (
                  <SectionCard
                    key="strengths"
                    accent="mint"
                    pcol="86,227,160"
                    icon="⚖️"
                    title={lang === 'bn' ? 'দক্ষতা ও উন্নতির ক্ষেত্র' : 'Strengths & Growth'}
                    titleGradientClass="grad-text"
                    id="strengths"
                  >
                    <div className="sw-grid">
                      <div className="sw-card str">
                        <div className="sw-ctitle" style={{ color: 'var(--mint)' }}>
                          💪 {lang === 'bn' ? 'দক্ষতাসমূহ' : 'Strengths'}
                        </div>
                        <ul className="sw-list">
                          {(lang === 'bn' && biodata.strengths.strengthsBn
                            ? biodata.strengths.strengthsBn
                            : biodata.strengths.strengths
                          ).map((str, idx) => (
                            <li key={idx}>
                              <div className="sw-dot" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="sw-card wk">
                        <div className="sw-ctitle" style={{ color: 'var(--gold)' }}>
                          🔧 {lang === 'bn' ? 'উন্নতির ক্ষেত্রসমূহ' : 'Growth Areas'}
                        </div>
                        <ul className="sw-list">
                          {(lang === 'bn' && biodata.strengths.growthAreasBn
                            ? biodata.strengths.growthAreasBn
                            : biodata.strengths.growthAreas
                          ).map((wk, idx) => (
                            <li key={idx}>
                              <div className="sw-dot" />
                              <span>{wk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </SectionCard>
                ) : null;

              case 'family':
                return vis.family !== false ? (
                  <SectionCard
                    key="family"
                    accent="sky"
                    pcol="79,195,247"
                    icon="👨‍👩‍👧‍👦"
                    title={lang === 'bn' ? 'পারিবারিক পরিচয়' : 'Family Details'}
                    titleGradientClass="grad-text-2"
                    id="family-details"
                  >
                    <FamilyGrid family={biodata.family} lang={lang} />
                  </SectionCard>
                ) : null;

              case 'hobbies':
                return vis.hobbies !== false ? (
                  <SectionCard
                    key="hobbies"
                    accent="gold"
                    pcol="255,184,64"
                    icon="⭐"
                    title={lang === 'bn' ? 'শখ ও আগ্রহ' : 'Hobbies & Interests'}
                    titleGradientClass="grad-text-gold"
                    id="hobbies"
                  >
                    <div className="hobby-row">
                      {biodata.hobbies.map((h) => (
                        <div key={h.id} className={`hobby ${h.colorClass}`}>
                          <span>{h.icon}</span>
                          <span>{lang === 'bn' && h.labelBn ? h.labelBn : h.label}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null;

              case 'gallery':
                return vis.gallery !== false && biodata.gallery && biodata.gallery.length > 0 ? (
                  <GallerySection key="gallery" gallery={biodata.gallery} lang={lang} />
                ) : null;

              case 'partner':
                return vis.partner !== false ? (
                  <SectionCard
                    key="partner"
                    accent="teal"
                    pcol="56,217,192"
                    icon="💍"
                    title={lang === 'bn' ? 'জীবনসঙ্গিনী সম্পর্কে প্রত্যাশা' : 'Preferred Partner'}
                    titleGradientClass="grad-text-2"
                    id="preferred-partner"
                  >
                    <p className="intro-body mb-5">
                      {lang === 'bn' && biodata.partnerIntro.bn ? (
                        biodata.partnerIntro.bn
                      ) : (
                        <>
                          Seeking a <span className="grad-text-2">pious, practicing Muslimah</span> as a life partner. I would like to extend this beautiful relationship to <span className="grad-text-2">Jannah.</span>
                        </>
                      )}
                    </p>
                    <div className="pref-grid">
                      {biodata.partnerPreferences.map((pref) => (
                        <div key={pref.id} className="pref-card">
                          <div className="pref-ico">{pref.icon}</div>
                          <div className="pref-lbl">{lang === 'bn' && pref.labelBn ? pref.labelBn : pref.label}</div>
                          <div className="pref-val">{lang === 'bn' && pref.valueBn ? pref.valueBn : pref.value}</div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null;

              case 'contact':
                return vis.contact !== false ? (
                  <div key="contact" className="contact" id="contact">
                    <div className="font-['Scheherazade_New'] text-[1.7rem] text-[var(--gold)] mb-3.5 drop-shadow-[0_0_10px_rgba(240,184,64,0.5)]">
                      بِسْمِ اللهِ
                    </div>
                    <div className="contact-name">
                      <span className="grad-text">{biodata.contact.name}</span>
                    </div>
                    <div className="contact-role">{biodata.contact.role}</div>
                    <div className="c-badges">
                      {biodata.contact.badges.map((b, idx) => (
                        <span key={idx} className="c-badge">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Respect Phone and Email Privacy Flags */}
                    <div className="c-links">
                      {biodata.contact.showPhone !== false && (
                        <a href={`tel:${biodata.contact.phone}`} className="c-link phone">
                          📞 {biodata.contact.phone}
                        </a>
                      )}

                      {biodata.contact.showEmail !== false && (
                        <a href={`mailto:${biodata.contact.email}`} className="c-link email">
                          ✉️ {biodata.contact.email}
                        </a>
                      )}

                      {biodata.contact.showPhone === false && biodata.contact.showEmail === false && (
                        <div className="p-3 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 flex items-center gap-2">
                          <LockKeyhole size={14} className="text-[var(--gold)]" />
                          <span>
                            {lang === 'bn'
                              ? 'পারিবারিক আলোচনার ভিত্তিতে পারস্পরিক সম্মতিতে মোবাইল নম্বর ও ইমেইল প্রদান করা হবে।'
                              : 'Direct contact details are kept private and provided upon mutual family request.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;

              default: {
                // Check if custom section
                const customSec = (biodata.customSections || []).find((s) => s.id === secKey);
                if (!customSec || customSec.visible === false) return null;

                return (
                  <SectionCard
                    key={customSec.id}
                    accent={customSec.accent}
                    pcol={customSec.pcol || '56,217,192'}
                    icon={customSec.icon || '✨'}
                    title={lang === 'bn' && customSec.titleBn ? customSec.titleBn : customSec.title}
                    titleGradientClass="grad-text"
                    id={customSec.id}
                  >
                    {customSec.type === 'grid' && (
                      <div className="details-grid">
                        {customSec.items.map((item) => (
                          <div key={item.id} className="det">
                            <div className="det-label flex items-center gap-1.5">
                              {item.icon && <span>{item.icon}</span>}
                              <span>{lang === 'bn' && item.labelBn ? item.labelBn : item.label}</span>
                            </div>
                            <div className="det-val font-medium text-[var(--text)]">
                              {lang === 'bn' && item.valueBn ? item.valueBn : item.value}
                            </div>
                            {item.note && (
                              <div className="text-[11px] text-[var(--soft)] mt-1">{item.note}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {customSec.type === 'timeline' && (
                      <div className="edu-timeline">
                        {customSec.items.map((item) => (
                          <div key={item.id} className="edu-item">
                            <div className="edu-left">
                              <div className="edu-node" />
                              <div className="edu-line" />
                            </div>
                            <div className="edu-content">
                              <div className="edu-inst flex items-center gap-1.5">
                                {item.icon && <span>{item.icon}</span>}
                                <span>{lang === 'bn' && item.labelBn ? item.labelBn : item.label}</span>
                              </div>
                              <div className="edu-deg text-sm text-[var(--soft)]">
                                {lang === 'bn' && item.valueBn ? item.valueBn : item.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {customSec.type === 'list' && (
                      <div className="space-y-2">
                        {customSec.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-[var(--glass2)] border border-[var(--border)] flex items-start gap-2.5"
                          >
                            <span className="text-base shrink-0">{item.icon || '✦'}</span>
                            <div>
                              <div className="text-xs font-semibold text-[var(--gold)]">
                                {lang === 'bn' && item.labelBn ? item.labelBn : item.label}
                              </div>
                              <div className="text-xs text-[var(--text)] mt-0.5">
                                {lang === 'bn' && item.valueBn ? item.valueBn : item.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                );
              }
            }
          };

          return fullOrder.map((key) => (
            <React.Fragment key={key}>{renderSectionCard(key)}</React.Fragment>
          ));
        })()}

        {/* ══ FOOTER ══ */}
        {vis.footer !== false && (
          <footer className="footer">
            {lang === 'bn' && biodata.footer.textBn ? biodata.footer.textBn : biodata.footer.text}
          </footer>
        )}
      </div>

      {/* ══ LOGIN PAGE MODAL (EMAIL / PASSWORD) ══ */}
      {isLoginModalOpen && (
        <LoginPage
          authorizedEmail={ADMIN_EMAIL}
          initialResetToken={resetTokenParam}
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => {
            setIsLoginModalOpen(false);
            setResetTokenParam(null);
            const path = window.location.pathname.toLowerCase();
            const hash = window.location.hash.toLowerCase();
            if (path === '/login' || path === '/admin') {
              window.history.replaceState({}, '', '/');
            }
            if (hash.includes('login') || hash.includes('admin') || window.location.search.includes('reset_token')) {
              window.history.replaceState({}, '', '/');
            }
          }}
        />
      )}

      {/* ══ ADMIN DASHBOARD MODAL SUITE ══ */}
      {isAdminOpen && (
        <AdminDashboard
          biodata={biodata}
          onUpdateBiodata={handleUpdateBiodata}
          onPublish={handlePublish}
          onRestoreDefault={handleRestoreDefault}
          theme={theme}
          onUpdateTheme={setTheme}
          onClose={() => setIsAdminOpen(false)}
          onLogout={handleLogout}
          adminEmail={ADMIN_EMAIL}
        />
      )}

      {/* ══ MATRIMONIAL AI CHATBOT (VOICE & TEXT) ══ */}
      <AIChatbot lang={lang} biodata={biodata} />
    </div>
  );
}
