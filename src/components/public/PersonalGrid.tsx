import React from 'react';
import { PersonalDetail } from '../../types/biodata';

interface PersonalGridProps {
  details: PersonalDetail[];
  lang?: 'en' | 'bn';
}

export const PersonalGrid: React.FC<PersonalGridProps> = ({ details, lang = 'en' }) => {
  return (
    <div className="details-grid">
      {details.map((item) => {
        const label = lang === 'bn' && item.labelBn ? item.labelBn : item.label;
        const val = lang === 'bn' && item.valueBn ? item.valueBn : item.value;

        return (
          <div
            key={item.id}
            className={`det group transition-all duration-300 ${
              item.highlight ? 'border-[rgba(240,184,64,0.35)] bg-[rgba(240,184,64,0.06)]' : ''
            }`}
          >
            <div className="det-label flex items-center gap-1.5">
              {item.icon && <span className="text-xs opacity-70 group-hover:scale-110 transition-transform">{item.icon}</span>}
              <span>{label}</span>
            </div>
            <div className="det-val font-medium text-[var(--text)]">
              {item.highlight ? (
                <span className="grad-text-gold font-semibold">{val}</span>
              ) : item.label === 'Marital Status' ? (
                <span style={{ color: 'var(--mint)' }} className="font-semibold">{val}</span>
              ) : (
                val
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
