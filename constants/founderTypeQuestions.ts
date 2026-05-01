export const FOUNDER_TYPE_QUESTIONS = [
  {
    id: 'q1',
    text: "Be honest: How many things have you started but not finished in the last year?",
    options: [
      "0-1: I finish what I start",
      "2-3: I have a couple in progress", 
      "4-6: I start a lot but struggle to finish",
      "7+: I have a graveyard of half-started ideas"
    ],
    scoring: {
      "0-1: I finish what I start": { type: 'Finisher', points: 3 },
      "2-3: I have a couple in progress": { type: 'Balanced', points: 1 },
      "4-6: I start a lot but struggle to finish": { type: 'Scattered', points: -1 },
      "7+: I have a graveyard of half-started ideas": { type: 'Chronic Starter', points: -3 }
    }
  },
  {
    id: 'q2',
    text: "You set a goal to launch something by Friday. It's Thursday night and you're behind. What happens?",
    options: [
      "I push through and ship it—even if it's rough",
      "I extend the deadline because \"it's not ready yet\"",
      "I feel bad but no one's waiting, so I let it slide",
      "I abandon it and start planning something new"
    ],
    scoring: {
      "I push through and ship it—even if it's rough": { type: 'Self-Driven Executor', points: 0 },
      "I extend the deadline because \"it's not ready yet\"": { type: 'Perfectionist', points: 0 },
      "I feel bad but no one's waiting, so I let it slide": { type: 'Needs Accountability', points: 0 },
      "I abandon it and start planning something new": { type: 'Idea Hopper', points: 0 }
    }
  },
  {
    id: 'q3',
    text: "Someone offers to pay you today for something you're working on. How do you feel?",
    options: [
      "Excited—this proves people want it",
      "Nervous—I don't think it's good enough yet",
      "Uncomfortable—feels weird to charge before it's perfect",
      "Ready—I should've been charging from the start"
    ],
    scoring: {
      "Excited—this proves people want it": { type: 'Validation Seeker', points: 0 },
      "Nervous—I don't think it's good enough yet": { type: 'Perfectionist', points: 0 },
      "Uncomfortable—feels weird to charge before it's perfect": { type: 'The Giver', points: 0 },
      "Ready—I should've been charging from the start": { type: 'Mercenary', points: 0 }
    }
  },
  {
    id: 'q4',
    text: "What timeline actually gets you to finish and launch?",
    options: [
      "1-7 days: I need fast results or I lose steam",
      "30 days: Enough time to build something real without burning out",
      "3-6 months: I'm patient and can work toward something bigger",
      "I don't finish—I keep improving things forever"
    ],
    scoring: {
      "1-7 days: I need fast results or I lose steam": { type: 'The Sprint Starter', points: 0 },
      "30 days: Enough time to build something real without burning out": { type: 'The 30-Day Executor', points: 0 },
      "3-6 months: I'm patient and can work toward something bigger": { type: 'The Patient Builder', points: 0 },
      "I don't finish—I keep improving things forever": { type: 'The Perfectionist', points: 0 }
    }
  },
  {
    id: 'q5',
    text: "When do you feel confident enough to launch and charge money?",
    options: [
      "After I've talked to 20+ people who say they'd pay",
      "After I've built something working that people can use",
      "After I see others successfully doing something similar",
      "Never—I just ship it despite the doubt"
    ],
    scoring: {
      "After I've talked to 20+ people who say they'd pay": { type: 'The Researcher', points: 0 },
      "After I've built something working that people can use": { type: 'Builder', points: 0 },
      "After I see others successfully doing something similar": { type: 'Follower', points: 0 },
      "Never—I just ship it despite the doubt": { type: 'Confident Shipper', points: 0 }
    }
  },
  {
    id: 'q6',
    text: "You launch. Nobody buys. What's your honest next move?",
    options: [
      "Quit and try something completely different",
      "Panic and rebuild the whole thing from scratch",
      "Talk to the few people who tried it and adjust",
      "Double down on marketing—people just don't know about it"
    ],
    scoring: {
      "Quit and try something completely different": { type: 'Low Resilience', points: 0 },
      "Panic and rebuild the whole thing from scratch": { type: 'Overreactor', points: 0 },
      "Talk to the few people who tried it and adjust": { type: 'Learner', points: 0 },
      "Double down on marketing—people just don't know about it": { type: 'Stubborn Optimist', points: 0 }
    }
  },
  {
    id: 'q7',
    text: "Think about the last time you committed to building or launching something. What happened?",
    options: [
      "I finished it and launched publicly",
      "I built most of it but never actually launched",
      "I started strong but lost momentum halfway",
      "I switched to a different idea before finishing"
    ],
    scoring: {
      "I finished it and launched publicly": { type: 'Proven Finisher', points: 0 },
      "I built most of it but never actually launched": { type: 'Launch Fear', points: 0 },
      "I started strong but lost momentum halfway": { type: 'Needs Accountability', points: 0 },
      "I switched to a different idea before finishing": { type: 'The Scattered Starter', points: 0 }
    }
  }
];

export const FOUNDER_TYPE_RESULTS = {
  'The Sprint Starter': {
    triggers: [
      { question: 'q4', answer: "1-7 days: I need fast results or I lose steam" },
      { question: 'q1', answer: ["0-1: I finish what I start", "2-3: I have a couple in progress"] }
    ],
    headline: "You're a Sprint Starter",
    truth: "You need fast wins or you lose steam. Long-term projects kill your momentum. You're wired for speed, not patience.",
    fits: [
      "Weekend launches and quick offers",
      "Rapid testing and iteration", 
      "Short-deadline client work",
      "Info products you can ship in days"
    ],
    quits: [
      "SaaS or anything requiring 6+ months",
      "Patient growth strategies",
      "Long-term content plays"
    ],
    nextMove: "Post a 7-day sprint commitment. Make it public so you actually finish one thing."
  },
  'The 30-Day Executor': {
    triggers: [
      { question: 'q4', answer: "30 days: Enough time to build something real without burning out" },
      { question: 'q2', answer: "I feel bad but no one's waiting, so I let it slide" }
    ],
    headline: "You're a 30-Day Executor",
    truth: "You can finish things when there's a deadline and someone's watching. Without accountability, you let deadlines slide.",
    fits: [
      "Structured 30-day launches",
      "Client work with clear milestones",
      "Public commitments with consequences",
      "MVPs you can ship in a month"
    ],
    quits: [
      "Open-ended projects with no deadline",
      "Solo work with zero accountability",
      "\"Someday\" ideas with no timeline"
    ],
    nextMove: "Post a 30-day commitment right now. Make it public or you'll quit like you always do."
  },
  'The Patient Builder': {
    triggers: [
      { question: 'q4', answer: "3-6 months: I'm patient and can work toward something bigger" },
      { question: 'q6', answer: "Talk to the few people who tried it and adjust" }
    ],
    headline: "You're a Patient Builder",
    truth: "You're wired for long-term plays. You don't need quick wins. You can grind for months without instant gratification.",
    fits: [
      "SaaS and subscription businesses",
      "Content empires that compound",
      "Long-term client relationships",
      "Businesses that take 6-12 months to pay off"
    ],
    quits: [
      "Get-rich-quick schemes",
      "Impatient pivots when growth is slow",
      "Hype-driven launches"
    ],
    nextMove: "Post a 90-day commitment with weekly milestones. You can handle the grind."
  },
  'The Giver': {
    triggers: [
      { question: 'q3', answer: "Uncomfortable—feels weird to charge before it's perfect" },
      { question: 'q5', answer: ["After I've talked to 20+ people who say they'd pay", "After I've built something working that people can use"] }
    ],
    headline: "You're a Giver",
    truth: "You love building and helping people. You hate charging money. You'll work for free forever if no one forces you to monetize.",
    fits: [
      "Community-driven products",
      "Education and teaching",
      "Tools that solve real problems",
      "Anything that helps people (once you learn to charge)"
    ],
    quits: [
      "High-pressure sales",
      "Aggressive monetization strategies",
      "Anything that feels \"salesy\""
    ],
    nextMove: "Post a commitment to charge $1 for something this week. Force yourself to monetize before you build anything else."
  },
  'The Researcher': {
    triggers: [
      { question: 'q5', answer: "After I've talked to 20+ people who say they'd pay" },
      { question: 'q1', answer: ["4-6: I start a lot but struggle to finish", "7+: I have a graveyard of half-started ideas"] }
    ],
    headline: "You're a Researcher",
    truth: "You're stuck in validation mode. You research, plan, and talk to people instead of building. You'll never feel \"ready enough\" to launch.",
    fits: [
      "Strategy and planning (once you force yourself to SHIP)",
      "Market research and positioning",
      "High-quality launches (if you ever launch)"
    ],
    quits: [
      "Everything—because you never start"
    ],
    nextMove: "Post a 7-day build sprint with ZERO customer interviews allowed. Ship something broken, then iterate."
  },
  'The Scattered Starter': {
    triggers: [
      { question: 'q1', answer: "7+: I have a graveyard of half-started ideas" },
      { question: 'q7', answer: "I switched to a different idea before finishing" }
    ],
    headline: "You're a Scattered Starter",
    truth: "You have a graveyard of half-built ideas. You start strong, then switch to something newer and shinier. You've never finished anything.",
    fits: [
      "Nothing until you finish ONE thing",
      "Forced constraints that kill distractions",
      "Public accountability with consequences"
    ],
    quits: [
      "Anything that lets you \"explore options\"",
      "Open-ended projects",
      "Solo work with no deadlines"
    ],
    nextMove: "Post ONE 30-day commitment. Delete every other idea. If you abandon this, it stays public forever."
  },
  'The Perfectionist': {
    triggers: [
      { question: 'q4', answer: "I don't finish—I keep improving things forever" },
      { question: 'q3', answer: "Nervous—I don't think it's good enough yet" }
    ],
    headline: "You're a Perfectionist",
    truth: "You never ship because it's \"not ready yet.\" You keep improving things forever. Your fear of launching broken work is killing your progress.",
    fits: [
      "Quality-driven offers (once you accept \"good enough\")",
      "Premium positioning",
      "High-touch services"
    ],
    quits: [
      "Fast iteration and scrappy MVPs",
      "Shipping before you feel ready"
    ],
    nextMove: "Post a commitment to ship something embarrassingly imperfect in 48 hours. Then iterate publicly."
  }
};

export function calculateFounderType(answers: Record<string, string>): string {
  const typeScores: Record<string, number> = {};
  
  // Count trigger matches for each type
  Object.entries(FOUNDER_TYPE_RESULTS).forEach(([type, result]) => {
    let matches = 0;
    result.triggers.forEach(trigger => {
      const userAnswer = answers[trigger.question];
      if (Array.isArray(trigger.answer)) {
        if (trigger.answer.includes(userAnswer)) matches++;
      } else {
        if (userAnswer === trigger.answer) matches++;
      }
    });
    typeScores[type] = matches;
  });
  
  // Find type with most matches
  let bestType = 'The 30-Day Executor'; // Default
  let highestScore = 0;
  
  Object.entries(typeScores).forEach(([type, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestType = type;
    }
  });
  
  return bestType;
}
