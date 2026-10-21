import React from 'react';
import { OccupationData, EducationItem } from '../../types/biodata';
import { SectionCard } from './SectionCard';

interface ProfessionalSectionProps {
  occupation: OccupationData;
  education: EducationItem[];
  lang?: 'en' | 'bn';
  showOccupation?: boolean;
  showEducation?: boolean;
}

export const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({
  occupation,
  education,
  lang = 'en',
  showOccupation = true,
  showEducation = true,
}) => {
  if (!showOccupation && !showEducation) return null;

  const occGrade = lang === 'bn' && occupation.gradeBn ? occupation.gradeBn : occupation.grade;
  const occTitle = lang === 'bn' && occupation.titleBn ? occupation.titleBn : occupation.title;
  const occOrg = lang === 'bn' && occupation.organizationBn ? occupation.organizationBn : occupation.organization;

  return (
    <div className="space-y-6">
      {/* Occupation Card Section */}
      {showOccupation && (
        <SectionCard
          accent="rose"
          pcol="232,84,122"
          icon="💼"
          title={lang === 'bn' ? 'পেশাগত বিবরণ' : 'Occupation'}
          titleGradientClass="grad-text"
        >
          <div className="occ-card">
            <div className="occ-grade">{occGrade}</div>
            <div className="occ-title">
              <span className="grad-text">{occTitle}</span>
            </div>
            <div className="occ-org">{occOrg}</div>

            <div className="occ-duties">
              {occupation.duties.map((duty) => (
                <div key={duty.id} className="occ-duty">
                  <div className="duty-dot" />
                  <span>{lang === 'bn' && duty.textBn ? duty.textBn : duty.text}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Education Timeline Section */}
      {showEducation && (
        <SectionCard
          accent="teal"
          pcol="56,217,192"
          icon="🎓"
          title={lang === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education'}
          titleGradientClass="grad-text-2"
        >
          <div className="edu-timeline">
            {education.map((item) => {
              const inst = lang === 'bn' && item.institutionBn ? item.institutionBn : item.institution;
              const deg = lang === 'bn' && item.degreeBn ? item.degreeBn : item.degree;

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
      )}
    </div>
  );
};

