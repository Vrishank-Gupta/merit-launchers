export const SITE_ORIGIN = "https://www.meritlaunchers.com";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export type StaticSeoEntry = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  h1?: string;
};

export const pageSeo = {
  home: {
    title:
      "Online CUET, CLAT, NDA, IPMAT, and Many More Entrance Exam Mock Test | Merit Launchers",
    description:
      "Welcome to Merit Launchers, your trusted platform for online CUET, CLAT, NDA, IPMAT, and many more entrance exam mock tests. Practice with exam-pattern mock tests, improve your performance, and prepare smarter with Merit Launchers mock test packages.",
    canonical: `${SITE_ORIGIN}/`,
    keywords:
      "cuet mock test online, clat mock, online nda mock test, ipmat mock test, ipmat online mock test",
    h1: "Best Online Mock Tests for CUET, CLAT, NDA & IPMAT Preparation",
  },
  cuet: {
    title:
      "CUET Mock Test 2026 & Online CUET Test Series for Real Exam Practice | Merit Launchers",
    description:
      "Prepare confidently with CUET Mock Test 2026 at Merit Launchers. Access online CUET mock test, CUET practice test, and CUET exam mock test designed to match the real exam pattern. Improve accuracy with expert-level CUET online test series and detailed performance analysis. Start practicing today.",
    canonical: `${SITE_ORIGIN}/courses/cuet`,
    keywords:
      "cuet mock test 2026, online cuet mock test, cuet online test series, best cuet mock test, cuet practice test",
    h1: "Best Online Mock Tests for CUET Exam Preparation",
  },
  ctet1: {
    title:
      "CTET Paper 1 Mock Test Series Online for Teacher Exam Practice | Merit Launchers",
    description:
      "Prepare for CTET Paper 1 with the online CTET mock test series at Merit Launchers. Practice CTET exam mock tests based on the latest exam pattern to improve speed and accuracy. Take CTET practice tests online and track progress with detailed performance analysis.",
    canonical: `${SITE_ORIGIN}/courses/ctet-1`,
    keywords:
      "ctet mock test, ctet paper 1 mock test, online ctet mock test, ctet practice test, ctet exam mock test",
    h1: "Best Online Mock Tests for CTET Paper 1 Preparation",
  },
  jee: {
    title:
      "JEE Mock Test Series Online for Real Exam Practice & Analysis | Merit Launchers",
    description:
      "Prepare effectively for JEE with the advanced JEE mock test series at Merit Launchers. Practice JEE online mock tests designed according to the latest exam pattern to improve speed, accuracy, and problem-solving skills. Track performance and strengthen preparation with detailed exam-level analysis.",
    canonical: `${SITE_ORIGIN}/courses/jee`,
    keywords:
      "jee mock test, jee online mock test, jee practice test, jee mock test series, jee exam mock test",
    h1: "Best Online Mock Tests for JEE Exam Preparation",
  },
  ssc: {
    title:
      "SSC Mock Test Series Online for CGL CHSL & Other SSC Exams | Merit Launchers",
    description:
      "Prepare for SSC exams with the SSC mock test series at Merit Launchers. Practice SSC online mock tests designed for exams like CGL and CHSL to improve speed and accuracy. Take SSC practice tests based on the latest exam pattern and track performance with detailed analysis.",
    canonical: `${SITE_ORIGIN}/courses/ssc`,
    keywords:
      "ssc mock test, ssc online mock test, ssc test series, ssc practice test, ssc exam mock test",
    h1: "Best Online Mock Tests for SSC Exam Preparation",
  },
  ipmat: {
    title:
      "IPMAT Online Mock Test Series for IIM Entrance Preparation | Merit Launchers",
    description:
      "Prepare for IIM entrance exams with the IPMAT online mock test series at Merit Launchers. Practice IPMAT mock tests designed according to the latest exam pattern to improve speed and accuracy. Take online mock test for IPMAT and analyze performance with detailed reports.",
    canonical: `${SITE_ORIGIN}/courses/ipmat`,
    keywords:
      "ipmat online mock test, ipmat mock test, online mock test for ipmat, ipmat practice test, ipmat exam mock test",
    h1: "Best Online Mock Tests for IPMAT Preparation",
  },
  clat: {
    title:
      "CLAT Online Mock Test Series for Law Entrance Exam Practice | Merit Launchers",
    description:
      "Prepare for the CLAT law entrance exam with the CLAT online mock test series at Merit Launchers. Practice CLAT mock tests designed according to the latest exam pattern to improve accuracy and logical reasoning. Track progress with detailed performance insights.",
    canonical: `${SITE_ORIGIN}/courses/clat`,
    keywords:
      "clat mock test, clat online mock test, clat test series, clat online mock test series, clat practice test",
    h1: "Best Online Mock Tests for CLAT Law Entrance Preparation",
  },
  ctet2: {
    title:
      "CTET Paper 2 Mock Test Series Online for Teacher Exam Practice | Merit Launchers",
    description:
      "Prepare for CTET Paper 2 with the online CTET mock test series at Merit Launchers. Practice CTET Paper 2 mock tests based on the latest exam pattern to improve speed and accuracy. Take CTET practice tests online and track progress with detailed performance insights.",
    canonical: `${SITE_ORIGIN}/courses/ctet-2`,
    keywords:
      "ctet paper 2 mock test, ctet mock test, ctet online mock test, ctet practice test, ctet exam mock test",
    h1: "Best Online Mock Tests for CTET Paper 2 Preparation",
  },
  neet: {
    title:
      "NEET Mock Test Series Online for Medical Entrance Exam Practice | Merit Launchers",
    description:
      "Prepare for the NEET medical entrance exam with the NEET mock test series at Merit Launchers. Practice NEET online mock tests designed as per the latest exam pattern to improve accuracy and speed. Track performance with detailed analysis and real exam practice tests.",
    canonical: `${SITE_ORIGIN}/courses/neet`,
    keywords:
      "neet mock test, neet online mock test, neet practice test, neet mock test series, neet exam mock test",
    h1: "Best Online Mock Tests for NEET Medical Entrance",
  },
  dsssb: {
    title:
      "DSSSB Mock Test Series Online for Teacher and Govt Exams | Merit Launchers",
    description:
      "Prepare for DSSSB recruitment exams with the DSSSB mock test series at Merit Launchers. Practice DSSSB online mock tests based on the latest exam pattern to improve speed and accuracy. Track performance and strengthen preparation with detailed analysis.",
    canonical: `${SITE_ORIGIN}/courses/dsssb`,
    keywords:
      "dsssb mock test, dsssb online mock test, dsssb test series, dsssb practice test, dsssb exam mock test",
    h1: "Best Online Mock Tests for DSSSB Exam Preparation",
  },
  about: {
    title:
      "About Merit Launchers - Online Mock Test Platform for Competitive Exams",
    description:
      "Learn about Merit Launchers, a trusted online mock test platform helping students prepare for competitive exams like CUET, CLAT, IPMAT, SSC, and NEET. Discover our mission, expert educators, and exam-level practice tests designed to improve accuracy and confidence.",
    canonical: `${SITE_ORIGIN}/about`,
    keywords:
      "about merit launchers, online mock test platform, exam preparation platform, competitive exam mock test, merit launchers",
    h1: "Best Platform for Competitive Exam Mock Test Preparation",
  },
  blog: {
    title:
      "Competitive Exam Preparation Tips & Study Guides Blog | Merit Launchers",
    description:
      "Explore the Merit Launchers blog for expert tips, preparation strategies, and study guides for competitive exams like CUET, CLAT, IPMAT, SSC, and NEET. Discover useful insights, mock test strategies, and preparation techniques to improve exam performance.",
    canonical: `${SITE_ORIGIN}/blog`,
    keywords:
      "competitive exam blog, exam preparation tips, study guides competitive exams, mock test strategies, merit launchers blog",
    h1: "Exam Preparation Tips & Mock Test Strategy Guides",
  },
  contact: {
    title: "Contact Merit Launchers for Mock Test Support & Exam Help",
    description:
      "Get in touch with Merit Launchers for assistance related to online mock tests and competitive exam preparation. Contact our team for guidance about mock test series, exam preparation resources, and platform support for exams like CUET, CLAT, SSC, and NEET.",
    canonical: `${SITE_ORIGIN}/contact`,
    keywords:
      "contact merit launchers, mock test support, exam preparation help, online mock test platform contact, merit launchers contact",
    h1: "Contact Us for Mock Test Support & Exam Guidance",
  },
  faq: {
    title:
      "Frequently Asked Questions About Online Mock Tests | Merit Launchers",
    description:
      "Find answers to common questions about online mock tests and competitive exam preparation at Merit Launchers. Learn how mock test series work, how to access practice tests, and how they help improve speed, accuracy, and exam performance.",
    canonical: `${SITE_ORIGIN}/faq`,
    keywords:
      "mock test faq, online mock test questions, exam preparation faq, competitive exam mock test faq, merit launchers faq",
    h1: "Common Questions About Online Mock Tests & Exams",
  },
  feeStructure: {
    title:
      "Mock Test Series Fee Structure for Competitive Exams | Merit Launchers",
    description:
      "View the Merit Launchers mock test series fee structure for competitive exams like CUET, CLAT, IPMAT, SSC, and NEET. Explore affordable pricing plans designed to give students access to high-quality practice tests and exam-level performance analysis.",
    canonical: `${SITE_ORIGIN}/fee-structure`,
    keywords:
      "mock test fees, exam mock test pricing, mock test series fee structure, competitive exam mock test fees, merit launchers fees",
    h1: "Mock Test Series Fees for Competitive Exams",
  },
  ourTeam: {
    title:
      "Meet the Expert Team Behind Online Mock Test Platform | Merit Launchers",
    description:
      "Meet the expert educators and exam specialists behind Merit Launchers who design high-quality online mock tests for competitive exams. Learn about the experienced team working to create accurate practice tests and exam preparation resources for students.",
    canonical: `${SITE_ORIGIN}/our-team`,
    keywords:
      "merit launchers team, exam experts team, competitive exam educators, mock test creators, merit launchers faculty",
    h1: "Meet the Experts Behind Our Mock Test Platform",
  },
  videos: {
    title: "Exam Preparation Videos & Mock Test Guidance | Merit Launchers",
    description:
      "Watch exam preparation videos by Merit Launchers to improve strategies for competitive exams like CUET, CLAT, IPMAT, SSC, and NEET. Learn mock test techniques, preparation tips, and expert guidance designed to help students improve exam performance.",
    canonical: `${SITE_ORIGIN}/videos`,
    keywords:
      "exam preparation videos, mock test strategy videos, competitive exam guidance videos, exam preparation tips video, merit launchers videos",
    h1: "Exam Preparation & Mock Test Strategy Videos",
  },
  externalLinks: {
    title:
      "Useful External Resources for Competitive Exams | Merit Launchers",
    description:
      "Explore helpful external resources curated by Merit Launchers to support competitive exam preparation. Access trusted educational links and useful study resources that help students strengthen concepts and improve exam preparation.",
    canonical: `${SITE_ORIGIN}/external-links`,
    keywords:
      "competitive exam resources, exam preparation links, study resources online, exam learning resources, merit launchers resources",
    h1: "Useful Study Resources for Competitive Exams",
  },
  returnPolicy: {
    title:
      "Return and Refund Policy for Mock Test Purchases | Merit Launchers",
    description:
      "Read the return and refund policy of Merit Launchers for online mock test purchases. Understand the eligibility conditions, refund process, and policies related to cancellations and purchases for mock test series and exam preparation services.",
    canonical: `${SITE_ORIGIN}/return-policy`,
    keywords:
      "mock test refund policy, merit launchers return policy, mock test purchase policy, refund policy mock tests, exam platform refund policy",
    h1: "Return & Refund Policy for Mock Test Purchases",
  },
  privacyPolicy: {
    title: "Privacy Policy for Online Mock Test Platform | Merit Launchers",
    description:
      "Read the privacy policy of Merit Launchers to understand how user data is collected, stored, and protected on our online mock test platform. Learn about data usage, security practices, and privacy protection while using exam preparation services.",
    canonical: `${SITE_ORIGIN}/privacy-policy`,
    keywords:
      "privacy policy mock test platform, merit launchers privacy policy, data protection policy, exam platform privacy policy, online learning privacy policy",
    h1: "Privacy Policy for Our Mock Test Platform",
  },
  termsConditions: {
    title:
      "Terms and Conditions for Using Mock Test Platform | Merit Launchers",
    description:
      "Review the terms and conditions for using the Merit Launchers online mock test platform. Understand service rules, platform usage policies, and user responsibilities related to accessing mock test series and exam preparation resources.",
    canonical: `${SITE_ORIGIN}/terms-conditions`,
    keywords:
      "mock test terms and conditions, merit launchers terms, exam platform user terms, mock test platform rules, education platform terms",
    h1: "Terms & Conditions for Using Our Mock Test Platform",
  },
  importantTips: {
    title:
      "Important Exam Preparation Tips for Competitive Exams | Merit Launchers",
    description:
      "Discover important exam preparation tips from Merit Launchers to improve performance in competitive exams like CUET, CLAT, IPMAT, SSC, and NEET. Learn effective study strategies, time management techniques, and mock test preparation tips.",
    canonical: `${SITE_ORIGIN}/important-tips`,
    keywords:
      "competitive exam tips, exam preparation strategies, mock test preparation tips, study tips for competitive exams, merit launchers tips",
    h1: "Important Tips for Competitive Exam Preparation",
  },
} satisfies Record<string, StaticSeoEntry>;

export function buildPageSeo(key: keyof typeof pageSeo) {
  return pageSeo[key];
}

export function buildBlogPostSeo(input: {
  title: string;
  description?: string | null;
  slug: string;
  featuredImage?: string | null;
}) {
  const description =
    input.description?.trim() ||
    `Read ${input.title} on the Merit Launchers blog for competitive exam preparation insights and study guidance.`;

  return {
    title: `${input.title} | Merit Launchers Blog`,
    description,
    canonical: `${SITE_ORIGIN}/blog/${input.slug}`,
    image: input.featuredImage || DEFAULT_OG_IMAGE,
  };
}
