export interface PersonalDetail {
  id: string;
  label: string;
  labelBn?: string;
  value: string;
  valueBn?: string;
  icon?: string;
  highlight?: boolean;
}

export interface OccupationDuty {
  id: string;
  text: string;
  textBn?: string;
}

export interface OccupationData {
  grade: string;
  gradeBn?: string;
  title: string;
  titleBn?: string;
  organization: string;
  organizationBn?: string;
  duties: OccupationDuty[];
}

export interface EducationItem {
  id: string;
  institution: string;
  institutionBn?: string;
  degree: string;
  degreeBn?: string;
  year?: string;
  highlight?: boolean;
}

export interface FamilyMember {
  id: string;
  role: string;
  roleBn?: string;
  name: string;
  nameBn?: string;
  note: string;
  noteBn?: string;
  highlight?: boolean;
  statusBadge?: string;
}

export interface HobbyItem {
  id: string;
  label: string;
  labelBn?: string;
  icon?: string;
  colorClass: 'hobby1' | 'hobby2' | 'hobby3';
}

export interface PartnerPref {
  id: string;
  icon: string;
  label: string;
  labelBn?: string;
  value: string;
  valueBn?: string;
}

export interface StrengthsData {
  strengths: string[];
  strengthsBn?: string[];
  growthAreas: string[];
  growthAreasBn?: string[];
}

export interface ContactData {
  name: string;
  nameBn?: string;
  role: string;
  roleBn?: string;
  phone: string;
  email: string;
  showPhone: boolean;
  showEmail: boolean;
  location: string;
  locationBn?: string;
  badges: string[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  captionBn?: string;
  isFeatured?: boolean;
  visible: boolean;
  dateAdded?: string;
}

export interface CustomSectionItem {
  id: string;
  label: string;
  labelBn?: string;
  value: string;
  valueBn?: string;
  note?: string;
  icon?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  titleBn?: string;
  accent: 'gold' | 'rose' | 'teal' | 'lavender' | 'mint' | 'sky';
  pcol: string;
  icon: string;
  type: 'grid' | 'timeline' | 'list' | 'text';
  content?: string;
  contentBn?: string;
  items: CustomSectionItem[];
  visible: boolean;
  order: number;
}

export interface SectionVisibility {
  header: boolean;
  personal: boolean;
  occupation: boolean;
  education: boolean;
  intro: boolean;
  strengths: boolean;
  family: boolean;
  hobbies: boolean;
  partner: boolean;
  contact: boolean;
  footer: boolean;
  gallery: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface BiodataContent {
  header: {
    bismillah: string;
    bismillahBn?: string;
    label: string;
    labelBn?: string;
    name: string;
    nameBn?: string;
    title: string;
    titleBn?: string;
    subTitle: string;
    subTitleBn?: string;
    photoUrl: string;
    badges: string[];
    badgesBn?: string[];
  };
  personal: PersonalDetail[];
  occupation: OccupationData;
  education: EducationItem[];
  intro: {
    bodyEn: string;
    bodyBn: string;
  };
  strengths: StrengthsData;
  family: FamilyMember[];
  hobbies: HobbyItem[];
  partnerPreferences: PartnerPref[];
  partnerIntro: {
    en: string;
    bn?: string;
  };
  contact: ContactData;
  footer: {
    text: string;
    textBn?: string;
  };
  gallery: GalleryImage[];
  sectionVisibility: SectionVisibility;
  sectionOrder?: string[];
  customSections?: CustomSection[];
  activityLogs?: ActivityLogItem[];
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  bg2Color: string;
  textColor: string;
  softColor: string;
  glassBg: string;
  borderColor: string;
  headingFont: string;
  bodyFont: string;
  bengaliFont: string;
  enableAnimations: boolean;
  enableParticles: boolean;
  enableFloatingEmojis: boolean;
  enableCustomCursor: boolean;
}
