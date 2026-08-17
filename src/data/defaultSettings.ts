import { SchoolSettings } from '../types';

export const SAMPLE_SCHOOL_LOGOS: { id: string; name: string; category: string; dataUrl: string }[] = [
  {
    id: 'heritage-crest',
    name: 'Heritage Gold & Navy Heraldic Shield',
    category: 'Traditional Academy',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%231e1b4b"/>
          <stop offset="100%" stop-color="%23312e81"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23fbbf24"/>
          <stop offset="100%" stop-color="%23d97706"/>
        </linearGradient>
      </defs>
      <!-- Shield Outer -->
      <path d="M60 6 C85 6 106 18 106 48 C106 82 60 112 60 112 C60 112 14 82 14 48 C14 18 35 6 60 6 Z" fill="url(%23g1)" stroke="url(%23gold)" stroke-width="4"/>
      <!-- Shield Inner Border -->
      <path d="M60 14 C80 14 98 24 98 48 C98 76 60 102 60 102 C60 102 22 76 22 48 C22 24 40 14 60 14 Z" fill="none" stroke="%23fbbf24" stroke-width="1.5" stroke-dasharray="3,2"/>
      <!-- Open Book -->
      <path d="M38 58 C46 54 54 55 60 59 C66 55 74 54 82 58 L82 76 C74 72 66 73 60 77 C54 73 46 72 38 76 Z" fill="%23ffffff" stroke="url(%23gold)" stroke-width="1.5"/>
      <line x1="60" y1="59" x2="60" y2="77" stroke="%23d97706" stroke-width="1.5"/>
      <!-- Torch / Flame -->
      <path d="M60 26 C64 33 67 36 65 43 C63 48 57 48 55 43 C53 36 56 33 60 26 Z" fill="%23f59e0b"/>
      <path d="M60 30 C62 34 64 36 63 40 C62 43 58 43 57 40 C56 36 58 34 60 30 Z" fill="%23ef4444"/>
      <polygon points="56,45 64,45 62,54 58,54" fill="url(%23gold)"/>
      <!-- Three Stars -->
      <polygon points="40,38 41.5,42 46,42 42.5,44.5 44,48.5 40,46 36,48.5 37.5,44.5 34,42 38.5,42" fill="%23fbbf24"/>
      <polygon points="80,38 81.5,42 86,42 82.5,44.5 84,48.5 80,46 76,48.5 77.5,44.5 74,42 78.5,42" fill="%23fbbf24"/>
      <polygon points="60,88 61.5,91 65,91 62,93 63.5,96 60,94 56.5,96 58,93 55,91 58.5,91" fill="%23fbbf24"/>
    </svg>`,
  },
  {
    id: 'apex-stem',
    name: 'Apex STEM & Innovation Atom Emblem',
    category: 'STEM & Technology',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%230f172a"/>
          <stop offset="100%" stop-color="%230284c7"/>
        </linearGradient>
        <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%2338bdf8"/>
          <stop offset="100%" stop-color="%2306b6d4"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(%23g2)" stroke="%2338bdf8" stroke-width="4"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke="%23ffffff" stroke-width="1" stroke-opacity="0.3"/>
      <!-- Atom Orbits -->
      <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(%23cyan)" stroke-width="2.5" transform="rotate(30 60 60)"/>
      <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(%23cyan)" stroke-width="2.5" transform="rotate(-30 60 60)"/>
      <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(%23cyan)" stroke-width="2.5" transform="rotate(90 60 60)"/>
      <!-- Core & Nucleus -->
      <circle cx="60" cy="60" r="10" fill="%23fbbf24" stroke="%23ffffff" stroke-width="2"/>
      <circle cx="34" cy="45" r="3.5" fill="%23ffffff"/>
      <circle cx="86" cy="45" r="3.5" fill="%23ffffff"/>
      <circle cx="60" cy="94" r="3.5" fill="%23ffffff"/>
    </svg>`,
  },
  {
    id: 'royal-crest',
    name: 'Royal Crown & Laurel Wreath Seal',
    category: 'International Preparatory',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23881337"/>
          <stop offset="100%" stop-color="%23be123c"/>
        </linearGradient>
        <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23fde047"/>
          <stop offset="100%" stop-color="%23ca8a04"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(%23g3)" stroke="url(%23gold2)" stroke-width="4"/>
      <!-- Laurel Wreath -->
      <path d="M30 75 C24 55 35 35 48 30 C45 42 40 56 46 68 Z" fill="url(%23gold2)"/>
      <path d="M90 75 C96 55 85 35 72 30 C75 42 80 56 74 68 Z" fill="url(%23gold2)"/>
      <!-- Royal Crown -->
      <path d="M40 70 L42 48 L52 58 L60 42 L68 58 L78 48 L80 70 Z" fill="url(%23gold2)" stroke="%23713f12" stroke-width="1"/>
      <rect x="40" y="70" width="40" height="6" rx="2" fill="url(%23gold2)"/>
      <circle cx="42" cy="46" r="2.5" fill="%23ffffff"/>
      <circle cx="60" cy="40" r="3" fill="%23ffffff"/>
      <circle cx="78" cy="46" r="2.5" fill="%23ffffff"/>
      <!-- Star -->
      <polygon points="60,86 62,91 67,91 63,94 65,99 60,96 55,99 57,94 53,91 58,91" fill="url(%23gold2)"/>
    </svg>`,
  },
  {
    id: 'classical-tome',
    name: 'Veritas Classical Shield & Laurels',
    category: 'Classical & Grammar School',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23064e3b"/>
          <stop offset="100%" stop-color="%23047857"/>
        </linearGradient>
      </defs>
      <path d="M60 8 C84 8 104 18 104 46 C104 80 60 110 60 110 C60 110 16 80 16 46 C16 18 36 8 60 8 Z" fill="url(%23g4)" stroke="%23fbbf24" stroke-width="4"/>
      <!-- Cross / Dividing Lines -->
      <line x1="60" y1="20" x2="60" y2="94" stroke="%23fbbf24" stroke-width="2"/>
      <line x1="28" y1="52" x2="92" y2="52" stroke="%23fbbf24" stroke-width="2"/>
      <!-- Icons in quadrants -->
      <circle cx="44" cy="36" r="5" fill="%23ffffff"/>
      <polygon points="76,30 78,35 83,35 79,38 81,43 76,40 71,43 73,38 69,35 74,35" fill="%23fbbf24"/>
      <!-- Open Book -->
      <path d="M36 68 C40 66 45 66 48 68 L48 78 C45 76 40 76 36 78 Z" fill="%23ffffff"/>
      <!-- Lamp of Learning -->
      <ellipse cx="76" cy="74" rx="8" ry="4" fill="%23fbbf24"/>
      <path d="M82 72 Q86 68 84 64" stroke="%23f97316" stroke-width="2" fill="none"/>
    </svg>`,
  },
  {
    id: 'capital-eagle',
    name: 'National Excellence & Civic Eagle Crest',
    category: 'Federal & Model School',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%230f172a"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(%23g5)" stroke="%2310b981" stroke-width="4"/>
      <!-- Green-White-Green Banner -->
      <rect x="25" y="78" width="23" height="8" rx="2" fill="%2310b981"/>
      <rect x="48" y="78" width="24" height="8" fill="%23ffffff"/>
      <rect x="72" y="78" width="23" height="8" rx="2" fill="%2310b981"/>
      <!-- Eagle / Wings Shape -->
      <path d="M60 30 C50 36 32 38 24 50 C38 48 48 55 54 64 C56 58 58 52 60 48 C62 52 64 58 66 64 C72 55 82 48 96 50 C88 38 70 36 60 30 Z" fill="%23fbbf24"/>
      <!-- Star -->
      <polygon points="60,62 61.5,66 66,66 62.5,69 64,73 60,70.5 56,73 57.5,69 54,66 58.5,66" fill="%23ffffff"/>
    </svg>`,
  },
  {
    id: 'modern-academy',
    name: 'Modern Futuristic Hex Academy Badge',
    category: 'Contemporary International',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%234338ca"/>
          <stop offset="100%" stop-color="%236366f1"/>
        </linearGradient>
      </defs>
      <polygon points="60,8 106,34 106,86 60,112 14,86 14,34" fill="url(%23g6)" stroke="%23a5b4fc" stroke-width="3"/>
      <!-- Mortarboard Hat -->
      <polygon points="60,38 90,50 60,62 30,50" fill="%23ffffff"/>
      <polygon points="46,57 46,70 60,76 74,70 74,57 60,63" fill="%23e0e7ff"/>
      <path d="M84 53 L88 68 L85 70 L82 68 Z" fill="%23fbbf24"/>
      <!-- 3 Accent Dots -->
      <circle cx="50" cy="90" r="3" fill="%23fbbf24"/>
      <circle cx="60" cy="90" r="3" fill="%23ffffff"/>
      <circle cx="70" cy="90" r="3" fill="%23fbbf24"/>
    </svg>`,
  },
];

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'Heritage of Excellence Academy',
  shortName: 'HEA',
  logoUrl: SAMPLE_SCHOOL_LOGOS[0].dataUrl,
  motto: 'Virtus et Scientia (Virtue and Knowledge)',
  academicSession: '2026/2027 Academic Session',
  currentTerm: 'First Term (Harmattan Term)',
  campusAddress: 'Plot 410, Mississippi St, Maitama District, Abuja FCT',
  stateCity: 'Abuja, Federal Capital Territory',
  contactEmail: 'info@heritage-abuja.sch.ng',
  contactPhone: '+234 803 100 2000',
  website: 'www.heritage-abuja.sch.ng',
  principalName: 'Dr. Mrs. Funmilayo Adeleke-Kano',
  principalTitle: 'Executive Principal & Director of Academics',
  bursarName: 'Alhaji Ibrahim Dantata',
  bursarTitle: 'Chief Bursar & Financial Controller',
  morningCutoffTime: '07:45',
  dismissalTime: '15:30',
  lateGracePeriodMinutes: 10,
  requireTemperatureCheck: true,
  autoSendPushOnScan: true,
  autoSendSmsOnLate: true,
  gateLocations: [
    'Main Gate (Maitama Campus)',
    'Junior Wing Gate',
    'Staff Executive Gate',
    'Hostel & Bus Turnstile',
    'Sports Complex Gate',
  ],
  statutoryPensionRate: 8, // 8%
  currencySymbol: '₦',
  workingDaysPerMonth: 22,
  latePenaltyPerOccurrence: 3500,
  unexcusedAbsencePenaltyDaily: 15000,
  disbursementBankDefault: 'Zenith Bank PLC',
  houses: [
    { name: 'Emerald', color: '#10B981', badgeColor: 'bg-emerald-600' },
    { name: 'Sapphire', color: '#3B82F6', badgeColor: 'bg-blue-600' },
    { name: 'Ruby', color: '#EF4444', badgeColor: 'bg-red-600' },
    { name: 'Topaz', color: '#F59E0B', badgeColor: 'bg-amber-500' },
  ],
};

export const PRESET_SCHOOL_CONFIGS: { id: string; label: string; description: string; settings: Partial<SchoolSettings> }[] = [
  {
    id: 'heritage_default',
    label: 'Heritage of Excellence Abuja (Standard)',
    description: 'Premier K-12 Academy in Maitama Abuja with standard British-Nigerian curriculum.',
    settings: DEFAULT_SCHOOL_SETTINGS,
  },
  {
    id: 'abuja_stem_college',
    label: 'Apex STEM & Innovation College Abuja',
    description: 'Specialized science, technology, and engineering secondary academy in Asokoro/Guzape.',
    settings: {
      schoolName: 'Apex STEM & Innovation College Abuja',
      shortName: 'APEX',
      logoUrl: SAMPLE_SCHOOL_LOGOS[1].dataUrl,
      motto: 'Innovate, Discover, Excel',
      campusAddress: '14 Nelson Mandela Crescent, Asokoro District, Abuja FCT',
      stateCity: 'Abuja, FCT',
      contactEmail: 'admissions@apexstem-abuja.sch.ng',
      contactPhone: '+234 812 559 8812',
      website: 'www.apexstem-abuja.sch.ng',
      principalName: 'Prof. Chinedu Ezeh (Ph.D)',
      principalTitle: 'Provost & Chief Academic Officer',
      bursarName: 'Mrs. Fatima Aliyu Garba',
      bursarTitle: 'Director of Finance & Operations',
      morningCutoffTime: '07:30',
      statutoryPensionRate: 8,
      latePenaltyPerOccurrence: 4000,
      unexcusedAbsencePenaltyDaily: 18000,
    },
  },
  {
    id: 'royal_crest_preparatory',
    label: 'Royal Crest International Academy',
    description: 'Early years, primary and junior secondary boarding and day school in Wuse II Abuja.',
    settings: {
      schoolName: 'Royal Crest International Academy Abuja',
      shortName: 'RCIA',
      logoUrl: SAMPLE_SCHOOL_LOGOS[2].dataUrl,
      motto: 'Leadership Through Excellence & Integrity',
      campusAddress: 'Plot 789, Aminu Kano Crescent, Wuse II, Abuja FCT',
      stateCity: 'Abuja, FCT',
      contactEmail: 'contact@royalcrest-abuja.sch.ng',
      contactPhone: '+234 809 332 5510',
      website: 'www.royalcrest-abuja.sch.ng',
      principalName: 'Lady Victoria Adeyemi (M.Ed)',
      principalTitle: 'Head of School & Executive Directress',
      bursarName: 'Mr. Jude Chukwuma',
      bursarTitle: 'Senior Bursar',
      morningCutoffTime: '08:00',
      statutoryPensionRate: 8,
      latePenaltyPerOccurrence: 3000,
      unexcusedAbsencePenaltyDaily: 12000,
    },
  },
];

