// Filipino Foul Language Filter (Tagalog + Kapampangan) - Backend Version
// Real-time detection and censorship system for Node.js

// Comprehensive list of Filipino foul language and offensive terms
const filipinoFoulWords = {
  // Tagalog Curse Words & Offensive Terms
  tagalog: [
    // Strong curse words
    "putang ina",
    "putangina",
    "puta",
    "putang",
    "puta ka",
    "putang ina mo",
    "tang ina",
    "tangina",
    "tang ina mo",
    "tangina mo",
    "tang ina nila",
    "tang ina nyo",
    "tangina nyo",
    "tang ina nila",
    "tangina nila",

    // Variations with numbers/symbols
    "put@ng ina",
    "put@ngina",
    "put@",
    "put@ng",
    "put@ ka",
    "t@ng ina",
    "t@ngina",
    "t@ng ina mo",
    "t@ngina mo",
    "put4ng ina",
    "put4ngina",
    "put4",
    "put4ng",
    "put4 ka",
    "t4ng ina",
    "t4ngina",
    "t4ng ina mo",
    "t4ngina mo",

    // Common insults
    "gago",
    "gagong",
    "gago ka",
    "gagong ka",
    "gago ka talaga",
    "bobo",
    "bobong",
    "bobo ka",
    "bobong ka",
    "bobo ka talaga",
    "tanga",
    "tangang",
    "tanga ka",
    "tangang ka",
    "tanga ka talaga",
    "ulol",
    "ulol ka",
    "ulol ka talaga",
    "ulol ka rin",

    // Physical appearance insults
    "pangit",
    "pangit ka",
    "pangit ka talaga",
    "mukhang pangit",
    "taba",
    "mataba",
    "tabachingching",
    "tabachoy",
    "taba ka",
    "payat",
    "payatot",
    "patpatin",
    "buto't balat",
    "payat ka",
    "itim",
    "itim ka",
    "mukhang uling",
    "mukhang itim",

    // Intelligence/ability insults
    "walang utak",
    "walang alam",
    "hindi marunong",
    "mangmang",
    "mangmang ka",
    "walang kwenta",
    "walang silbi",
    "walang halaga",
    "hindi marunong",
    "hindi alam",
    "hindi gets",
    "hindi naintindihan",

    // Social status insults
    "mahirap",
    "mahirap ka",
    "walang pera",
    "squatter",
    "squatter ka",
    "probinsyano",
    "probinsyana",
    "promdi",
    "promdi ka",
    "bakya",
    "bakya ka",
    "jologs",
    "jologs ka",
    "baduy",
    "baduy ka",

    // Sexual/offensive terms
    "kantot",
    "kantutan",
    "kantot ka",
    "kantutan tayo",
    "jakol",
    "jakol ka",
    "jakol tayo",
    "jakol mo",
    "titi",
    "titi mo",
    "titi ko",
    "titi nila",
    "pepe",
    "pepe mo",
    "pepe ko",
    "pepe nila",
    "puke",
    "puke mo",
    "puke ko",
    "puke nila",

    // Family insults
    "anak ng puta",
    "anak ng puta ka",
    "anak ng puta mo",
    "anak ng tanga",
    "anak ng tanga ka",
    "anak ng tanga mo",
    "anak ng gago",
    "anak ng gago ka",
    "anak ng gago mo",
    "anak ng bobo",
    "anak ng bobo ka",
    "anak ng bobo mo",

    // Threatening language
    "patayin kita",
    "patayin ka",
    "sasaktan kita",
    "sasaktan ka",
    "bugbog kita",
    "bugbog ka",
    "suntukin kita",
    "suntukin ka",
    "awayin kita",
    "awayin ka",
    "sabunutan kita",
    "sabunutan ka",
    "patayin mo sarili mo",
    "magpakamatay ka",
    "kamatayan mo",

    // Extreme offensive terms
    "leche",
    "leche ka",
    "leche mo",
    "leche nila",
    "bwisit",
    "bwisit ka",
    "bwisit mo",
    "bwisit nila",
    "sira ulo",
    "sira ulo ka",
    "may topak",
    "may topak ka",
    "may sakit sa ulo",
    "may sakit sa ulo ka",
    "may problema sa ulo",
  ],

  // Kapampangan Curse Words & Offensive Terms
  kapampangan: [
    // Strong curse words
    "putang ina",
    "putangina",
    "puta",
    "putang",
    "puta ka",
    "putang ina mo",
    "tang ina",
    "tangina",
    "tang ina mo",
    "tangina mo",
    "tang ina nila",
    "tang ina nyo",
    "tangina nyo",
    "tang ina nila",
    "tangina nila",

    // Kapampangan specific insults
    "gago",
    "gagung",
    "gago ka",
    "gagung ka",
    "gago ka talaga",
    "bobo",
    "bobung",
    "bobo ka",
    "bobung ka",
    "bobo ka talaga",
    "tanga",
    "tangang",
    "tanga ka",
    "tangang ka",
    "tanga ka talaga",
    "ulol",
    "ulol ka",
    "ulol ka talaga",
    "ulol ka rin",

    // Physical appearance insults
    "pangit",
    "pangit ka",
    "pangit ka talaga",
    "mukhang pangit",
    "taba",
    "mataba",
    "tabachingching",
    "tabachoy",
    "taba ka",
    "payat",
    "payatot",
    "patpatin",
    "buto't balat",
    "payat ka",
    "itim",
    "itim ka",
    "mukhang uling",
    "mukhang itim",

    // Intelligence/ability insults
    "walang utak",
    "walang alam",
    "hindi marunong",
    "mangmang",
    "mangmang ka",
    "walang kwenta",
    "walang silbi",
    "walang halaga",
    "hindi marunong",
    "hindi alam",
    "hindi gets",
    "hindi naintindihan",

    // Social status insults
    "mahirap",
    "mahirap ka",
    "walang pera",
    "squatter",
    "squatter ka",
    "probinsyano",
    "probinsyana",
    "promdi",
    "promdi ka",
    "bakya",
    "bakya ka",
    "jologs",
    "jologs ka",
    "baduy",
    "baduy ka",

    // Sexual/offensive terms
    "kantot",
    "kantutan",
    "kantot ka",
    "kantutan tayo",
    "jakol",
    "jakol ka",
    "jakol tayo",
    "jakol mo",
    "titi",
    "titi mo",
    "titi ko",
    "titi nila",
    "pepe",
    "pepe mo",
    "pepe ko",
    "pepe nila",
    "puke",
    "puke mo",
    "puke ko",
    "puke nila",

    // Family insults
    "anak ng puta",
    "anak ng puta ka",
    "anak ng puta mo",
    "anak ng tanga",
    "anak ng tanga ka",
    "anak ng tanga mo",
    "anak ng gago",
    "anak ng gago ka",
    "anak ng gago mo",
    "anak ng bobo",
    "anak ng bobo ka",
    "anak ng bobo mo",

    // Threatening language
    "patayin kita",
    "patayin ka",
    "sasaktan kita",
    "sasaktan ka",
    "bugbog kita",
    "bugbog ka",
    "suntukin kita",
    "suntukin ka",
    "awayin kita",
    "awayin ka",
    "sabunutan kita",
    "sabunutan ka",
    "patayin mo sarili mo",
    "magpakamatay ka",
    "kamatayan mo",

    // Extreme offensive terms
    "leche",
    "leche ka",
    "leche mo",
    "leche nila",
    "bwisit",
    "bwisit ka",
    "bwisit mo",
    "bwisit nila",
    "sira ulo",
    "sira ulo ka",
    "may topak",
    "may topak ka",
    "may sakit sa ulo",
    "may sakit sa ulo ka",
    "may problema sa ulo",
  ],

  // Common variations and misspellings
  variations: [
    // Number substitutions
    "put4ng ina",
    "put4ngina",
    "put4",
    "put4ng",
    "put4 ka",
    "t4ng ina",
    "t4ngina",
    "t4ng ina mo",
    "t4ngina mo",
    "g4go",
    "g4gong",
    "g4go ka",
    "g4gong ka",
    "b0b0",
    "b0bong",
    "b0b0 ka",
    "b0bong ka",
    "t4nga",
    "t4ngang",
    "t4nga ka",
    "t4ngang ka",

    // Symbol substitutions
    "put@ng ina",
    "put@ngina",
    "put@",
    "put@ng",
    "put@ ka",
    "t@ng ina",
    "t@ngina",
    "t@ng ina mo",
    "t@ngina mo",
    "g@g0",
    "g@gong",
    "g@g0 ka",
    "g@gong ka",
    "b0b0",
    "b0bong",
    "b0b0 ka",
    "b0bong ka",
    "t@nga",
    "t@ngang",
    "t@nga ka",
    "t@ngang ka",

    // Mixed substitutions
    "put4ng1na",
    "put4ng1na",
    "put4",
    "put4ng",
    "put4 ka",
    "t4ng1na",
    "t4ng1na",
    "t4ng1na mo",
    "t4ng1na mo",
    "g4g0",
    "g4g0ng",
    "g4g0 ka",
    "g4g0ng ka",
    "b0b0",
    "b0b0ng",
    "b0b0 ka",
    "b0b0ng ka",
    "t4ng4",
    "t4ng4ng",
    "t4ng4 ka",
    "t4ng4ng ka",
  ],

  // Bullying and harassment patterns
  bullying: [
    // Exclusion and isolation
    "walang kaibigan",
    "walang friends",
    "nag-iisa ka",
    "nag-iisa lang",
    "hindi ka belong",
    "outcast ka",
    "walang pumapansin",
    "walang may pake",
    "walang kwenta",
    "walang silbi",
    "walang halaga",
    "walang saysay",
    "hindi ka welcome",
    "hindi ka kasama",
    "exclude ka",
    "ignore ka",

    // Repeated insults
    "ulit ulit",
    "paulit ulit",
    "walang tigil",
    "hindi tumitigil",
    "patuloy na",
    "walang katapusan",
    "hindi na matapos",
    "sawa na ako",

    // Group bullying
    "lahat kami",
    "kami lahat",
    "kaming lahat",
    "hindi ka kasama",
    "exclude ka namin",
    "ignore ka namin",
    "walang pake kami sayo",
    "hindi ka belong sa amin",
    "hindi ka kasama sa grupo",
  ],
};

// Function to censor foul language with asterisks
export const censorFoulLanguage = (text) => {
  if (!text || typeof text !== "string")
    return { censoredText: text, censoredCount: 0, hasFoulLanguage: false };

  let censoredText = text;
  let censoredCount = 0;

  // Combine all foul word categories
  const allFoulWords = [
    ...filipinoFoulWords.tagalog,
    ...filipinoFoulWords.kapampangan,
    ...filipinoFoulWords.variations,
    ...filipinoFoulWords.bullying,
  ];

  // Sort by length (longest first) to avoid partial matches
  allFoulWords.sort((a, b) => b.length - a.length);

  // Replace foul words with asterisks
  allFoulWords.forEach((word) => {
    const regex = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    if (regex.test(censoredText)) {
      const asterisks = "*".repeat(word.length);
      censoredText = censoredText.replace(regex, asterisks);
      censoredCount++;
    }
  });

  return {
    censoredText,
    censoredCount,
    hasFoulLanguage: censoredCount > 0,
  };
};

// Function to check if text contains foul language
export const containsFoulLanguage = (text) => {
  if (!text || typeof text !== "string") return false;

  const allFoulWords = [
    ...filipinoFoulWords.tagalog,
    ...filipinoFoulWords.kapampangan,
    ...filipinoFoulWords.variations,
    ...filipinoFoulWords.bullying,
  ];

  return allFoulWords.some((word) => {
    const regex = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    return regex.test(text);
  });
};

// Function to get foul language statistics
export const getFoulLanguageStats = (text) => {
  if (!text || typeof text !== "string") return { count: 0, categories: {} };

  const stats = {
    count: 0,
    categories: {
      tagalog: 0,
      kapampangan: 0,
      variations: 0,
      bullying: 0,
    },
  };

  // Check each category
  Object.entries(filipinoFoulWords).forEach(([category, words]) => {
    words.forEach((word) => {
      const regex = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      if (regex.test(text)) {
        stats.count++;
        stats.categories[category]++;
      }
    });
  });

  return stats;
};

// Function to get censored preview (for real-time feedback)
export const getCensoredPreview = (text, maxLength = 100) => {
  const censored = censorFoulLanguage(text);

  if (censored.censoredText.length <= maxLength) {
    return censored.censoredText;
  }

  return censored.censoredText.substring(0, maxLength) + "...";
};

export default {
  censorFoulLanguage,
  containsFoulLanguage,
  getFoulLanguageStats,
  getCensoredPreview,
  foulWords: filipinoFoulWords,
};


