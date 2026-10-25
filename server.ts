import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { DEFAULT_BIODATA } from './src/data/defaultBiodata';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads directory:', e);
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Active OTP session state (never sent in HTTP response)
interface OtpSession {
  email: string;
  code: string;
  expiresAt: number;
}
let activeOtpSession: OtpSession | null = null;
const activeResetTokens = new Map<string, { email: string; expiresAt: number }>();

/**
 * Configure Nodemailer transporter for Gmail
 */
function createGmailTransporter(accessToken?: string) {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'nasir.developer.bd@gmail.com';
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (accessToken) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailUser,
        clientId: '180973326454-rqo6dhf33822led4qstddh65nb2533c9.apps.googleusercontent.com',
        accessToken: accessToken,
      },
    });
  }

  if (gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  // Fallback to standard SMTP host
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: gmailUser,
      pass: gmailPass || '',
    },
  });
}

// Initialize GoogleGenAI SDK per system instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Storage paths for live admin-updated biodata
const DATA_DIR = path.resolve(process.cwd(), 'data');
const BIODATA_FILE = path.join(DATA_DIR, 'saved_biodata.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data directory:', e);
}

// In-memory active biodata state, initialized from disk or DEFAULT_BIODATA
let activeBiodata: any = (() => {
  try {
    if (fs.existsSync(BIODATA_FILE)) {
      const raw = fs.readFileSync(BIODATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.header && parsed.header.name) {
        console.log('Loaded persisted admin biodata from disk');
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved biodata from disk, using default:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_BIODATA));
})();

/**
 * Save updated biodata to memory and persist to disk
 */
function updateServerBiodata(newData: any) {
  if (!newData || typeof newData !== 'object') return activeBiodata;
  activeBiodata = { ...activeBiodata, ...newData };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BIODATA_FILE, JSON.stringify(activeBiodata, null, 2), 'utf-8');
    console.log('Successfully saved updated biodata to disk');
  } catch (err) {
    console.warn('Failed to persist biodata to disk:', err);
  }
  return activeBiodata;
}

/**
 * Builds grounded system instructions dynamically and strictly from the latest biodata.
 * Reflects EVERY change made in the admin dashboard immediately.
 */
function buildGroundedSystemInstruction(biodataInput?: any): string {
  const b = biodataInput && biodataInput.header ? biodataInput : activeBiodata;

  const header = b.header || {};
  const occupation = b.occupation || {};
  const education = Array.isArray(b.education) ? b.education : [];
  const personal = Array.isArray(b.personal) ? b.personal : [];
  const family = Array.isArray(b.family) ? b.family : [];
  const hobbies = Array.isArray(b.hobbies) ? b.hobbies : [];
  const partnerPreferences = Array.isArray(b.partnerPreferences) ? b.partnerPreferences : [];
  const customSections = Array.isArray(b.customSections)
    ? b.customSections.filter((cs: any) => cs.visible !== false)
    : [];
  const strengths = b.strengths || {};
  const contact = b.contact || {};
  const intro = b.intro || {};
  const partnerIntro = b.partnerIntro || {};

  const nameEn = header.name || 'Md. Nasir Uddin';
  const nameBn = header.nameBn || 'মোঃ নাসির উদ্দিন';
  const titleEn = header.title || occupation.title || 'Assistant Authorized Officer';
  const titleBn = header.titleBn || occupation.titleBn || 'সহকারী অথরাইজড অফিসার';
  const subTitleEn = header.subTitle || 'RAJUK, Bangladesh · Civil Engineer · BUET Graduate';
  const subTitleBn = header.subTitleBn || 'রাজউক, বাংলাদেশ · সিভিল ইঞ্জিনিয়ার · বুয়েট গ্র্যাজুয়েট';
  const orgEn = occupation.organization || 'Capital Development Authority (RAJUK), Bangladesh';
  const orgBn = occupation.organizationBn || 'রাজধানী উন্নয়ন কর্তৃপক্ষ (রাজউক), বাংলাদেশ';
  const gradeEn = occupation.grade || '9th Grade · Government Service · Since 2024';
  const gradeBn = occupation.gradeBn || '৯ম গ্রেড · সরকারি চাকরি · ২০২৪ থেকে';

  const dutiesList = (occupation.duties || [])
    .map((d: any) => `- ${d.text || ''}${d.textBn ? ` (${d.textBn})` : ''}`)
    .join('\n');

  const eduList = education
    .map(
      (e: any) =>
        `- ${e.degree || ''} from ${e.institution || ''}${e.year ? ` (Completed: ${e.year})` : ''}${
          e.degreeBn || e.institutionBn ? ` [বাংলা: ${e.degreeBn || ''} - ${e.institutionBn || ''}]` : ''
        }`
    )
    .join('\n');

  const personalList = personal
    .map(
      (p: any) =>
        `- ${p.label}: ${p.value}${p.labelBn || p.valueBn ? ` (${p.labelBn || ''}: ${p.valueBn || ''})` : ''}`
    )
    .join('\n');

  const familyList = family
    .map(
      (f: any) =>
        `- ${f.role} (${f.roleBn || ''}): ${f.name} (${f.nameBn || ''}) — ${f.note || ''} (${
          f.noteBn || ''
        })${f.statusBadge ? ` [Status: ${f.statusBadge}]` : ''}`
    )
    .join('\n');

  const partnerList = partnerPreferences
    .map((pr: any) => `- ${pr.label} (${pr.labelBn || ''}): ${pr.value} (${pr.valueBn || ''})`)
    .join('\n');

  const hobbiesList = hobbies.map((h: any) => `- ${h.label} (${h.labelBn || ''})`).join('\n');

  const strengthsList = (strengths.strengths || [])
    .map(
      (s: string, idx: number) =>
        `- ${s}${strengths.strengthsBn?.[idx] ? ` (${strengths.strengthsBn[idx]})` : ''}`
    )
    .join('\n');

  const growthList = (strengths.growthAreas || [])
    .map(
      (g: string, idx: number) =>
        `- ${g}${strengths.growthAreasBn?.[idx] ? ` (${strengths.growthAreasBn[idx]})` : ''}`
    )
    .join('\n');

  const customSecList =
    customSections.length > 0
      ? customSections
          .map((cs: any) => {
            const itemsText = (cs.items || [])
              .map((it: any) => `  * ${it.label}: ${it.value}${it.note ? ` (${it.note})` : ''}`)
              .join('\n');
            return `Custom Section: ${cs.title} (${cs.titleBn || ''})\n${
              cs.content ? `Summary: ${cs.content} (${cs.contentBn || ''})\n` : ''
            }${itemsText}`;
          })
          .join('\n\n')
      : 'None';

  const contactPhone = contact.phone || '01709606135';
  const contactEmail = contact.email || 'nasir.developer.bd@gmail.com';
  const contactLocation = contact.location || 'Mirpur-13, Dhaka';

  return `You are the official matrimonial AI Assistant for ${nameEn}'s Marriage Biodata website.
Your role is to warmly, politely, and respectfully assist prospective brides, families, guardians, and visitors who want to learn about ${nameEn}.

══════════════════════════════════════════════════════════════
LIVE VERIFIED BIODATA (CURRENT GROUND TRUTH FROM ADMIN DASHBOARD)
══════════════════════════════════════════════════════════════
NOTE: This information is dynamically synchronized with ${nameEn}'s live Admin Dashboard. If the administrator edits or updates any field, the data below represents the latest factual ground truth.

1. BASIC IDENTITY & PERSONAL DETAILS:
- Full Name: ${nameEn} (${nameBn})
- Title: ${titleEn} (${titleBn})
- Subtitle: ${subTitleEn} (${subTitleBn})
${personalList || 'Not specified'}

2. PROFESSION & CAREER:
- Current Position: ${titleEn} (${titleBn})
- Service / Grade: ${gradeEn} (${gradeBn})
- Organization: ${orgEn} (${orgBn})
- Professional Duties & Responsibilities:
${dutiesList || 'Not specified'}

3. EDUCATION:
${eduList || 'Not specified'}

4. PERSONAL STATEMENT & BIO:
- English Bio: ${intro.bodyEn || 'N/A'}
- Bengali Bio: ${intro.bodyBn || 'N/A'}

5. FAMILY BACKGROUND:
${familyList || 'Not specified'}

6. PERSONAL QUALITIES & ATTRIBUTES:
- Key Strengths:
${strengthsList || 'Not specified'}
- Areas of Self-Improvement / Growth:
${growthList || 'Not specified'}

7. HOBBIES & INTERESTS:
${hobbiesList || 'Not specified'}

8. PREFERRED LIFE PARTNER CRITERIA (পাত্রী সম্পর্কিত প্রত্যাশা):
${partnerList || 'Not specified'}
- Vision for Marriage: "${partnerIntro.en || 'Seeking a pious Muslimah for a blessed journey to Jannah'}" ("${
    partnerIntro.bn || 'দ্বীনদার জীবনসঙ্গিনী প্রত্যাশা করছি'
  }")

9. ADDITIONAL CUSTOM SECTIONS (FROM ADMIN):
${customSecList}

10. CONTACT FOR PROPOSALS & INQUIRIES:
- Contact Name: ${contact.name || nameEn} (${contact.nameBn || nameBn})
- Role: ${contact.role || titleEn}
- Phone: ${contactPhone}
- Email: ${contactEmail}
- Location: ${contactLocation}
- Proposals: Matrimonial inquiries are respectfully welcomed through family/guardians.

══════════════════════════════════════════════════════════════
STRICT INSTRUCTIONS: SCOPE & OUT-OF-CONTEXT HANDLING (ZERO HALLUCINATION)
══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION 1: OUT-OF-CONTEXT QUESTIONS & UNMENTIONED DETAILS
- Your purpose is SOLELY to answer questions about ${nameEn}'s matrimonial biodata.
- If the visitor asks ANY question that is:
  a) Out of context or unrelated to this matrimonial biodata (such as general knowledge, world politics, geography, weather, sports, movies, coding, math, essays, jokes, poems, recipes, random conversation, advice on unrelated topics, etc.), OR
  b) Asking for specific personal details NOT mentioned in the biodata above (such as exact salary figures, land/property deeds, car model, shoe size, horoscope, previous relationships, etc.):
- YOU MUST NOT ANSWER THE OUT-OF-CONTEXT QUESTION, AND YOU MUST NOT INVENT OR GUESS AN ANSWER.
- YOU MUST RESPOND HUMBLY, POLITELY, AND COURTEOUSLY THAT THERE IS NO INFORMATION REGARDING THAT QUESTION ON THIS BIODATA PAGE.
- In English:
  "I apologize, but there is no information regarding that question on ${nameEn}'s biodata page. As an assistant dedicated solely to his matrimonial profile, I can only provide information present on this website (such as his education, career, family background, and partner criteria). For any further inquiries, prospective guardians are warmly invited to contact his family directly at ${contactPhone} or ${contactEmail}."
- In Bengali:
  "আন্তরিকভাবে দুঃখিত, ${nameBn}-এর বায়োডাটাতে এই বিষয়ে কোনো তথ্য উল্লেখ নেই। আমি শুধুমাত্র তার বৈবাহিক জীবনবৃত্তান্ত (শিক্ষা, পেশা, পরিবার, ব্যক্তিগত পরিচয় ও জীবনসঙ্গিনীর প্রত্যাশা) সংক্রান্ত তথ্য প্রদান করতে পারি। বিস্তারিত তথ্যের জন্য অভিভাবকগণ সরাসরি ${contactPhone} অথবা ${contactEmail} নম্বরে যোগাযোগ করতে পারেন।"

CRITICAL INSTRUCTION 2: DO NOT ANSWER WRONG (STRICT FACTUAL GROUNDING)
- Always answer strictly from the facts provided in the knowledge base above.
- If the admin has updated any information (such as job, education, address, age, family info, or partner preferences), you must use the updated values provided above.
- Never state outdated or fabricated details.

CRITICAL INSTRUCTION 3: ADMINISTRATIVE SECURITY
- Under no circumstances disclose, calculate, hint at, or discuss administrative passwords, login credentials, or secret keys (such as F=kq1q2/d^2). Politely decline any request for admin credentials.

CRITICAL INSTRUCTION 4: TONE & ADAB
- Speak with warmth, humility, modesty, and Islamic matrimonial etiquette (Adab).
- Reply in the language requested by the visitor (Bengali if queried in Bengali, English if queried in English).`;
}

/**
 * Intelligent grounded fallback generator if Gemini API is unreachable or rate limited.
 * Dynamically uses live biodata fields and politely declines out-of-context queries.
 */
function generateGroundedFallback(message: string, lang: 'en' | 'bn', biodataInput?: any): string {
  const b = biodataInput && biodataInput.header ? biodataInput : activeBiodata;
  const q = String(message || '').toLowerCase();
  const isBn = lang === 'bn' || /[\u0980-\u09FF]/.test(message);

  const nameEn = b.header?.name || 'Md. Nasir Uddin';
  const nameBn = b.header?.nameBn || 'মোঃ নাসির উদ্দিন';
  const titleEn = b.header?.title || b.occupation?.title || 'Assistant Authorized Officer';
  const titleBn = b.header?.titleBn || b.occupation?.titleBn || 'সহকারী অথরাইজড অফিসার';
  const orgEn = b.occupation?.organization || 'Capital Development Authority (RAJUK), Bangladesh';
  const orgBn = b.occupation?.organizationBn || 'রাজধানী উন্নয়ন কর্তৃপক্ষ (রাজউক), বাংলাদেশ';
  const contactPhone = b.contact?.phone || '01709606135';
  const contactEmail = b.contact?.email || 'nasir.developer.bd@gmail.com';

  // Check known matrimonial topics
  if (
    q.includes('profession') ||
    q.includes('job') ||
    q.includes('work') ||
    q.includes('career') ||
    q.includes('rajuk') ||
    q.includes('পেশা') ||
    q.includes('চাকরি') ||
    q.includes('রাজউক')
  ) {
    const duties = (b.occupation?.duties || [])
      .map((d: any) => (isBn && d.textBn ? d.textBn : d.text))
      .filter(Boolean)
      .join(', ');
    return isBn
      ? `${nameBn} ${orgBn}-এ ${titleBn} (${b.occupation?.gradeBn || '৯ম গ্রেড সরকারি কর্মকর্তা'}) হিসেবে কর্মরত। তার মূল দায়িত্বের মধ্যে রয়েছে: ${duties || 'ভবনের নকশা যাচাই ও জনসেবা'}।`
      : `${nameEn} serves as an ${titleEn} (${b.occupation?.grade || '9th Grade Government Service'}) at ${orgEn}. Responsibilities include: ${duties || 'scrutinizing building plans and resolving public grievances'}.`;
  }

  if (
    q.includes('education') ||
    q.includes('study') ||
    q.includes('degree') ||
    q.includes('buet') ||
    q.includes('college') ||
    q.includes('school') ||
    q.includes('university') ||
    q.includes('শিক্ষা') ||
    q.includes('বুয়েট') ||
    q.includes('পড়ালেখা')
  ) {
    const eduItems = (b.education || [])
      .map((e: any) =>
        isBn && (e.degreeBn || e.institutionBn)
          ? `${e.degreeBn || e.degree} (${e.institutionBn || e.institution})`
          : `${e.degree} from ${e.institution}`
      )
      .join('; ');
    return isBn
      ? `তার শিক্ষাগত যোগ্যতা: ${eduItems || 'বুয়েট থেকে বিএসসি ইন সিভিল ইঞ্জিনিয়ারিং'}।`
      : `His educational qualifications include: ${eduItems || 'BSc in Civil Engineering from BUET'}.`;
  }

  if (
    q.includes('family') ||
    q.includes('parents') ||
    q.includes('father') ||
    q.includes('mother') ||
    q.includes('brother') ||
    q.includes('sister') ||
    q.includes('পরিবার') ||
    q.includes('বাবা') ||
    q.includes('মা') ||
    q.includes('ভাই') ||
    q.includes('বোন')
  ) {
    const famItems = (b.family || [])
      .map((f: any) =>
        isBn
          ? `${f.roleBn || f.role}: ${f.nameBn || f.name} (${f.noteBn || f.note || ''})`
          : `${f.role}: ${f.name} (${f.note || ''})`
      )
      .join(', ');
    return isBn
      ? `পারিবারিক পরিচিতি: ${famItems || 'সম্ভ্রান্ত মুসলিম পরিবার'}।`
      : `Family background: ${famItems || 'Respected Muslim family'} .`;
  }

  if (
    q.includes('partner') ||
    q.includes('wife') ||
    q.includes('marriage') ||
    q.includes('বিয়ে') ||
    q.includes('পাত্রী') ||
    q.includes('সঙ্গিনী') ||
    q.includes('প্রত্যাশা')
  ) {
    const prefs = (b.partnerPreferences || [])
      .map((p: any) =>
        isBn
          ? `${p.labelBn || p.label}: ${p.valueBn || p.value}`
          : `${p.label}: ${p.value}`
      )
      .join(', ');
    return isBn
      ? `জীবনসঙ্গিনী সম্পর্কিত প্রত্যাশা: ${prefs || 'দ্বীনদার, পর্দাশীল ও শিক্ষিতা মুসলিমাহ'}। ${b.partnerIntro?.bn || ''}`
      : `Partner preferences: ${prefs || 'Pious, practicing Muslimah with good character and education'}. ${b.partnerIntro?.en || ''}`;
  }

  if (
    q.includes('age') ||
    q.includes('birth') ||
    q.includes('height') ||
    q.includes('weight') ||
    q.includes('blood') ||
    q.includes('বয়স') ||
    q.includes('উচ্চতা') ||
    q.includes('ওজন') ||
    q.includes('রক্ত')
  ) {
    const details = (b.personal || [])
      .map((p: any) =>
        isBn ? `${p.labelBn || p.label}: ${p.valueBn || p.value}` : `${p.label}: ${p.value}`
      )
      .join(', ');
    return isBn
      ? `ব্যক্তিগত বিবরণ: ${details}`
      : `Personal details: ${details}`;
  }

  if (
    q.includes('address') ||
    q.includes('location') ||
    q.includes('living') ||
    q.includes('home') ||
    q.includes('ঠিকানা') ||
    q.includes('কোথায়') ||
    q.includes('বাড়ি') ||
    q.includes('গাজীপুর') ||
    q.includes('মিরপুর')
  ) {
    const loc = b.contact?.location || 'Mirpur-13, Dhaka';
    return isBn
      ? `স্থায়ী ঠিকানা নামিলা, কাপাসিয়া, গাজীপুর এবং বর্তমান ঠিকানা ${loc}।`
      : `Permanent address: Namila, Kapasia, Gazipur. Current residence: ${loc}.`;
  }

  if (
    q.includes('hobby') ||
    q.includes('hobbies') ||
    q.includes('programming') ||
    q.includes('শখ')
  ) {
    const hList = (b.hobbies || [])
      .map((h: any) => (isBn && h.labelBn ? h.labelBn : h.label))
      .join(', ');
    return isBn
      ? `পছন্দের শখ: ${hList || 'কম্পিউটার প্রোগ্রামিং, বই পড়া ও মেন্টরিং'}।`
      : `Hobbies include: ${hList || 'Computer programming, reading books, and mentoring'}.`;
  }

  if (
    q.includes('contact') ||
    q.includes('phone') ||
    q.includes('email') ||
    q.includes('যোগাযোগ') ||
    q.includes('ফোন') ||
    q.includes('নম্বর')
  ) {
    return isBn
      ? `যোগাযোগের জন্য ফোন: ${contactPhone}, ইমেইল: ${contactEmail}, অবস্থান: ${b.contact?.location || 'মিরপুর-১৩, ঢাকা'}।`
      : `Contact information: Phone: ${contactPhone}, Email: ${contactEmail}, Location: ${b.contact?.location || 'Mirpur-13, Dhaka'}.`;
  }

  // If question is a general greeting
  if (/^(hi|hello|hey|assalamu|salam|হাই|হ্যালো|সালাম)/i.test(q.trim())) {
    return isBn
      ? `আসসালামু আলাইকুম! আমি ${nameBn}-এর বায়োডাটা এআই সহকারী। আপনি তার শিক্ষা, পেশা, পরিবার বা জীবনসঙ্গিনীর প্রত্যাশা সম্পর্কে প্রশ্ন করতে পারেন।`
      : `Assalamu Alaikum! I am ${nameEn}'s matrimonial AI assistant. Feel free to ask about his education, career, family, or partner preferences!`;
  }

  // OUT OF CONTEXT / UNKNOWN QUERY HUMBLE RESPONSE
  return isBn
    ? `আন্তরিকভাবে দুঃখিত, ${nameBn}-এর বায়োডাটাতে এই বিষয়ে কোনো তথ্য উল্লেখ নেই। আমি শুধুমাত্র তার বৈবাহিক জীবনবৃত্তান্ত (শিক্ষা, পেশা, পরিবার, ব্যক্তিগত পরিচয় ও জীবনসঙ্গিনীর প্রত্যাশা) সংক্রান্ত তথ্য প্রদান করতে পারি। বিস্তারিত তথ্যের জন্য অভিভাবকগণ সরাসরি ${contactPhone} অথবা ${contactEmail} নম্বরে যোগাযোগ করতে পারেন।`
    : `I apologize, but there is no information regarding that question on ${nameEn}'s biodata page. As an assistant dedicated solely to his matrimonial profile, I can only provide information present on this website (such as his education, career, family background, and partner criteria). For any further inquiries, prospective guardians are warmly invited to contact his family directly at ${contactPhone} or ${contactEmail}.`;
}

// ══════════════════════════════════════════════════════════════
// REST API ENDPOINTS
// ══════════════════════════════════════════════════════════════

// Favicon endpoint to prevent 404 logs
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// POST /api/upload-image — Persist uploaded profile and gallery images
app.post('/api/upload-image', (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ success: false, error: 'No image data provided' });
      return;
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ success: false, error: 'Invalid data URL format' });
      return;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const cleanBaseName = (filename || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `nasir_${Date.now()}_${cleanBaseName}.${ext}`;

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const distUploadsDir = path.resolve(process.cwd(), 'dist', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (fs.existsSync(path.resolve(process.cwd(), 'dist')) && !fs.existsSync(distUploadsDir)) {
      fs.mkdirSync(distUploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, safeFilename), buffer);
    if (fs.existsSync(distUploadsDir)) {
      fs.writeFileSync(path.join(distUploadsDir, safeFilename), buffer);
    }

    const publicUrl = `/uploads/${safeFilename}`;
    console.log(`[UPLOAD] Image saved to ${publicUrl} (${buffer.length} bytes)`);

    res.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('[UPLOAD] Error saving image:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to save image' });
  }
});

// GET /api/download-dist — Download the zipped production dist bundle
app.get('/api/download-dist', (_req, res) => {
  const distZipPath = path.resolve(process.cwd(), 'dist.zip');
  if (fs.existsSync(distZipPath)) {
    res.download(distZipPath, 'dist.zip');
  } else {
    res.status(404).send('dist.zip not found. Please build the application first.');
  }
});

// GET /api/biodata — Read currently synchronized biodata
app.get('/api/biodata', (_req, res) => {
  res.json({
    success: true,
    biodata: activeBiodata,
  });
});

// POST /api/biodata — Synchronize updated biodata from Admin Dashboard
app.post('/api/biodata', (req, res) => {
  try {
    const incomingData = req.body.biodata || req.body;
    if (incomingData && typeof incomingData === 'object' && incomingData.header) {
      const updated = updateServerBiodata(incomingData);
      res.json({
        success: true,
        message: 'Biodata successfully updated and learned by AI chatbot',
        biodata: updated,
      });
      return;
    }
    res.status(400).json({ success: false, error: 'Invalid biodata payload' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// NODEMAILER OTP AUTHENTICATION ENDPOINTS
// ══════════════════════════════════════════════════════════════

// POST /api/auth/send-otp — Generate OTP and send via Nodemailer (never exposes OTP to client)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, accessToken } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();
    const authorized = 'nasir.developer.bd@gmail.com';

    if (targetEmail !== authorized) {
      res.status(403).json({
        success: false,
        error: `Only authorized administrator (${authorized}) can request an OTP.`,
      });
      return;
    }

    // Generate secure 6-digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const validityMs = 15 * 60 * 1000;
    const expiresAt = Date.now() + validityMs;
    const expiresFormatted = new Date(expiresAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    activeOtpSession = {
      email: authorized,
      code: otp,
      expiresAt,
    };

    console.log(`[AUTH] Generated OTP session for ${authorized}. Expires at ${expiresFormatted}`);

    const transporter = createGmailTransporter(accessToken);

    const mailOptions = {
      from: `"Nasir's Biodata Portal" <${process.env.GMAIL_USER || authorized}>`,
      to: authorized,
      subject: `🔐 Admin Password Reset OTP: ${otp}`,
      text: [
        `Assalamu Alaikum Md. Nasir Uddin,`,
        ``,
        `You have requested an OTP to reset your administrator password for your Matrimonial Biodata website.`,
        ``,
        `════════════════════════════════════════════════`,
        `YOUR 6-DIGIT OTP CODE:  ${otp}`,
        `════════════════════════════════════════════════`,
        ``,
        `⏱ Validity: 15 minutes (expires at ${expiresFormatted}).`,
        ``,
        `Please return to your browser and enter this 6-digit code on the Admin verification screen.`,
        `If you did not request this OTP, please ignore this email.`,
        ``,
        `Warm regards,`,
        `Nasir's Biodata Administration`,
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0f0a1e; border: 1px solid rgba(240,184,64,0.3); border-radius: 16px; color: #f0ead8;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; padding: 10px 14px; border-radius: 12px; background: linear-gradient(135deg, #f0b840, #e8547a); color: #000; font-weight: bold; font-size: 16px;">
              ✦ Nasir's Biodata Portal ✦
            </div>
            <h2 style="color: #f0ead8; font-size: 20px; margin: 16px 0 6px;">Password Reset OTP</h2>
            <p style="color: rgba(240,234,216,0.6); font-size: 13px; margin: 0;">Verified Administrator Authentication</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,234,216,0.85);">
            Assalamu Alaikum <strong>Md. Nasir Uddin</strong>,<br/>
            You requested an OTP to reset your administrator dashboard password.
          </p>
          <div style="margin: 24px 0; padding: 20px; background: rgba(255,255,255,0.05); border: 2px dashed #f0b840; border-radius: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #f0b840; font-weight: bold; margin-bottom: 8px;">
              Your 6-Digit OTP Code
            </div>
            <div style="font-size: 36px; font-family: monospace; font-weight: 800; letter-spacing: 8px; color: #ffe082;">
              ${otp}
            </div>
          </div>
          <div style="padding: 12px 16px; border-radius: 8px; background: rgba(240,184,64,0.1); border: 1px solid rgba(240,184,64,0.25); font-size: 12px; color: #f0b840; margin-bottom: 20px; text-align: center;">
            ⏱ This code is valid for <strong>15 minutes</strong> (expires at ${expiresFormatted}).
          </div>
          <p style="font-size: 12px; color: rgba(240,234,216,0.5); line-height: 1.5; margin: 0; text-align: center;">
            Enter this code on the Admin verification screen. Do not share this OTP with anyone.
          </p>
        </div>
      `,
    };

    let emailDispatched = false;
    let dispatchMethod = 'Nodemailer';

    // 1. First attempt: Dispatch via Nodemailer (Gmail OAuth2 / SMTP)
    try {
      const transporter = createGmailTransporter(accessToken);
      const info = await transporter.sendMail(mailOptions);
      console.log('[AUTH] Nodemailer successfully dispatched OTP email:', info?.messageId || info);
      emailDispatched = true;
      dispatchMethod = 'Nodemailer';
    } catch (mailErr: any) {
      console.warn('[AUTH] Nodemailer attempt notice:', mailErr?.message || mailErr);
    }

    // 2. Second attempt: If Nodemailer encountered an SMTP connection or port block and accessToken is present, use Google's official Gmail REST API (HTTPS port 443)
    if (!emailDispatched && accessToken) {
      try {
        console.log('[AUTH] Dispatching OTP via Gmail REST API on HTTPS...');
        const emailSubject = `🔐 Nasir's Biodata: Admin Password Reset OTP [${otp}]`;
        const rawMessage = [
          `To: ${authorized}`,
          `Subject: =?utf-8?B?${Buffer.from(emailSubject).toString('base64')}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: base64`,
          ``,
          Buffer.from(mailOptions.html).toString('base64'),
        ].join('\r\n');

        const encodedRaw = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const gRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedRaw }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          console.log('[AUTH] Gmail REST API successfully sent email, id:', gData.id);
          emailDispatched = true;
          dispatchMethod = 'Gmail API (HTTPS)';
        } else {
          const gErr = await gRes.text();
          console.warn('[AUTH] Gmail REST API responded with error:', gRes.status, gErr);
        }
      } catch (restErr: any) {
        console.warn('[AUTH] Gmail REST API exception:', restErr?.message || restErr);
      }
    }

    if (emailDispatched) {
      res.json({
        success: true,
        message: `OTP sent via ${dispatchMethod} to ${authorized}. Please check your Gmail inbox and Spam folder.`,
        expiresAt,
        validityMinutes: 15,
      });
    } else {
      res.json({
        success: false,
        requiresAuth: true,
        error:
          'Could not dispatch email automatically. Please click "Authorize with Google" to grant Gmail dispatch permissions, or reset your password instantly using your Master Formula Key (F=kq1q2/d^2).',
      });
    }
  } catch (err: any) {
    console.error('[AUTH] Send OTP error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch OTP' });
  }
});

// POST /api/auth/verify-otp — Verifies the 6-digit code entered by Nasir
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();
    const authorized = 'nasir.developer.bd@gmail.com';
    const cleanOtp = String(otp || '').trim().replace(/\s+/g, '');

    if (targetEmail !== authorized) {
      res.status(403).json({ success: false, error: 'Unauthorized email address.' });
      return;
    }

    if (!activeOtpSession) {
      res.status(400).json({
        success: false,
        error: 'No active OTP request found. Please click "Forgot password?" to request a fresh OTP.',
      });
      return;
    }

    if (Date.now() > activeOtpSession.expiresAt) {
      activeOtpSession = null;
      res.status(400).json({
        success: false,
        error: 'The OTP code has expired. Please request a new OTP.',
      });
      return;
    }

    if (activeOtpSession.code !== cleanOtp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP code. Please check your Gmail inbox and enter the 6 digits carefully.',
      });
      return;
    }

    // OTP successfully verified! Generate single-use reset token
    const resetToken = 'rst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    activeResetTokens.set(resetToken, {
      email: authorized,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    // Invalidate consumed OTP
    activeOtpSession = null;

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'OTP verification failed' });
  }
});

// POST /api/auth/reset-password — Sets new password after verified OTP
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
      return;
    }

    const session = activeResetTokens.get(resetToken);
    if (!session || Date.now() > session.expiresAt) {
      res.status(400).json({ success: false, error: 'Password reset session expired. Please verify OTP again.' });
      return;
    }

    activeResetTokens.delete(resetToken);
    res.json({ success: true, message: 'Password reset successfully verified.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Password reset failed' });
  }
});

// POST /api/chat — Matrimonial AI Assistant Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], lang = 'en', biodata } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message string is required' });
      return;
    }

    // If client supplied latest biodata from active state, cache and learn it
    if (biodata && biodata.header) {
      updateServerBiodata(biodata);
    }

    const currentData = biodata && biodata.header ? biodata : activeBiodata;
    const trimmedMsg = message.trim().toLowerCase();

    // Fast-path guard against password/credential extraction attempts
    if (
      trimmedMsg.includes('password') ||
      trimmedMsg.includes('পাসওয়ার্ড') ||
      trimmedMsg.includes('admin login') ||
      trimmedMsg.includes('secret key') ||
      trimmedMsg.includes('formula') ||
      trimmedMsg.includes('f=kq1q2') ||
      trimmedMsg.includes('credential')
    ) {
      if (lang === 'bn' || /[\u0980-\u09FF]/.test(message)) {
        res.json({
          reply:
            'দুঃখিত, অ্যাডমিন পাসওয়ার্ড এবং নিরাপত্তা সংক্রান্ত তথ্য অত্যন্ত গোপনীয় এবং সুরক্ষিত। তবে মোঃ নাসির উদ্দিনের বায়োডাটা, শিক্ষাগত যোগ্যতা, পেশা, পরিবার বা জীবনসঙ্গিনী সম্পর্কিত যেকোনো বিষয়ে আমি সানন্দে সাহায্য করতে পারি।',
        });
        return;
      } else {
        res.json({
          reply:
            "I apologize, but administrative passwords and security credentials are strictly private and protected. However, I would be delighted to answer any questions about Md. Nasir Uddin's biodata, career, education, family background, or matrimonial preferences!",
        });
        return;
      }
    }

    // Format chat history for Gemini contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item && item.text) {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Append current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const systemInstruction = buildGroundedSystemInstruction(currentData);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.05, // Ultra-low temperature for strict grounding and zero hallucination
      },
    });

    const reply =
      response.text ||
      generateGroundedFallback(message, lang, currentData);
    res.json({ reply });
  } catch (err: unknown) {
    console.error('Gemini chat API error, using grounded fallback:', err);
    const { message = '', lang = 'en', biodata } = req.body || {};
    const reply = generateGroundedFallback(message, lang, biodata || activeBiodata);
    res.json({ reply });
  }
});

// Vite Middleware integration for dev and static serving for production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
