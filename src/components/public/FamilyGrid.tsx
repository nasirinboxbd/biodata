import React from 'react';
import { FamilyMember } from '../../types/biodata';

interface FamilyGridProps {
  family: FamilyMember[];
  lang?: 'en' | 'bn';
}

export const FamilyGrid: React.FC<FamilyGridProps> = ({ family, lang = 'en' }) => {
  return (
    <div className="family-grid">
      {family.map((member) => {
        const role = lang === 'bn' && member.roleBn ? member.roleBn : member.role;
        const name = lang === 'bn' && member.nameBn ? member.nameBn : member.name;
        const note = lang === 'bn' && member.noteBn ? member.noteBn : member.note;

        // Special highlight styling for Parents
        const isFather = member.role.toLowerCase().includes('father');
        const isMother = member.role.toLowerCase().includes('mother');

        let cardBorderClass = 'border-[var(--border)] bg-[var(--glass2)]';
        if (isFather) {
          cardBorderClass = 'border-[rgba(240,184,64,0.35)] bg-[rgba(240,184,64,0.06)] shadow-[0_4px_20px_rgba(240,184,64,0.08)]';
        } else if (isMother) {
          cardBorderClass = 'border-[rgba(56,217,192,0.35)] bg-[rgba(56,217,192,0.05)] shadow-[0_4px_20px_rgba(56,217,192,0.08)]';
        }

        return (
          <div
            key={member.id}
            className={`fam-card ${cardBorderClass} relative group transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(176,127,255,0.4)]`}
          >
            {member.statusBadge && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[0.62rem] rounded-full bg-[rgba(176,127,255,0.18)] text-[var(--lavender)] border border-[rgba(176,127,255,0.3)]">
                {member.statusBadge}
              </span>
            )}
            <div className="fam-role text-[0.65rem] tracking-[0.2em] uppercase font-bold text-[var(--lavender)] mb-1">
              {role}
            </div>
            <div className="fam-name font-serif text-[clamp(0.92rem,2.2vw,1.05rem)] font-semibold text-[var(--text)] mb-1">
              {name}
            </div>
            <div className="fam-note text-[0.78rem] text-[var(--soft)] font-light">
              {note}
            </div>
          </div>
        );
      })}
    </div>
  );
};
