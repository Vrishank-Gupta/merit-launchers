export const playbookSections = [
  {
    id: "whatsapp",
    label: "WhatsApp scripts",
    description: "Short outreach copy for first contact, follow-up, and fee framing.",
    entries: [
      {
        title: "First outreach",
        when: "Use after getting a lead from a school, classmate, or coaching group.",
        script:
          "Hi {{name}}, Merit Launchers has structured prep support for exams like CUET, CTET, CLAT, and IPMAT. If you want, I can share the exact course page and free preview paper that matches your exam.",
      },
      {
        title: "Follow-up after interest",
        when: "Send when a lead has asked for details but has not acted in 24 hours.",
        script:
          "Following up in case you missed this earlier. The best way to judge fit is to look at the course outline, fee, and preview paper together. Tell me your exam and I will send the right page directly.",
      },
      {
        title: "Fee objection",
        when: "Use when a lead likes the course but hesitates on price.",
        script:
          "The decision should not be based on fee alone. Compare the structure, test quality, and guidance against what you would otherwise spend on scattered material. If you want, I can help you compare options clearly.",
      },
    ],
  },
  {
    id: "calls",
    label: "Call scripts",
    description: "Talk tracks for quick discovery and parent conversations.",
    entries: [
      {
        title: "Discovery call opener",
        when: "Use in the first 3 minutes of a call.",
        script:
          "Before I suggest anything, tell me your exam target, current class or graduation stage, and whether you need structured tests, concept support, or only revision guidance.",
      },
      {
        title: "Parent reassurance",
        when: "Use when the parent is evaluating trust and seriousness.",
        script:
          "I am not asking you to decide blindly. Please review the course page, fee structure, and preview paper first. That will show whether the program is serious and suitable for your child.",
      },
    ],
  },
  {
    id: "social",
    label: "Social captions",
    description: "Ready-to-post copy for Instagram, Telegram, and college groups.",
    entries: [
      {
        title: "Exam-focused post",
        when: "Use with a poster, reel, or PDF teaser.",
        script:
          "Serious prep starts with clarity, not random material. If you are targeting {{exam}}, DM me for the course page, fee details, and free preview paper.",
      },
      {
        title: "Urgency caption",
        when: "Use around registrations, new batches, or mock test launches.",
        script:
          "Do not wait until the exam is near to start structured practice. Ask me for the latest Merit Launchers course link and preview paper for {{exam}}.",
      },
    ],
  },
  {
    id: "playbook",
    label: "Operating playbook",
    description: "Simple repeatable habits for consistent partner output.",
    entries: [
      {
        title: "Daily rhythm",
        when: "Use as your default working cadence.",
        script:
          "1. Share one focused course link. 2. Follow up every warm lead due today. 3. Log every conversation in the leads board. 4. Review what converted and reuse that messaging.",
      },
      {
        title: "First 7 days plan",
        when: "Use when a partner is just getting started.",
        script:
          "Day 1 profile. Day 2 share first student link. Day 3 add five leads. Day 4 use one script. Day 5 follow up. Day 6 invite one partner. Day 7 review clicks and refine outreach.",
      },
    ],
  },
];

export const outreachChannels = [
  {
    title: "High-intent channels",
    detail: "Direct WhatsApp, warm referrals, and parent conversations convert faster than broad posting.",
  },
  {
    title: "Proof-led messaging",
    detail: "Lead with course structure, preview paper, and outcomes instead of only saying 'join now'.",
  },
  {
    title: "Follow-up discipline",
    detail: "Most partner revenue is won in follow-up, not the first touch.",
  },
];
