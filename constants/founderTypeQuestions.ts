export const FOUNDER_TYPE_QUESTIONS = [
  {
    id: 'q1',
    text: "How many unfinished projects do you have from the last year?",
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
    text: "When are you confident enough to charge money for something?",
    options: [
      "After I've talked to 20+ people who say they'd pay",
      "After I've built something working that people can use",
      "After I see other people succeeding with similar things",
      "I ship it anyway despite having doubts"
    ],
    scoring: {
      "After I've talked to 20+ people who say they'd pay": { type: 'The Researcher', points: 0 },
      "After I've built something working that people can use": { type: 'Builder', points: 0 },
      "After I see other people succeeding with similar things": { type: 'Follower', points: 0 },
      "I ship it anyway despite having doubts": { type: 'Confident Shipper', points: 0 }
    }
  },
  {
    id: 'q6',
    text: "You launch something and nobody buys. What's your first move?",
    options: [
      "Assume it's not working and start something new",
      "Panic and rebuild the whole thing",
      "Talk to the few people who tried it and adjust",
      "Double down on marketing and push harder"
    ],
    scoring: {
      "Assume it's not working and start something new": { type: 'Low Resilience', points: 0 },
      "Panic and rebuild the whole thing": { type: 'Overreactor', points: 0 },
      "Talk to the few people who tried it and adjust": { type: 'Learner', points: 0 },
      "Double down on marketing and push harder": { type: 'Stubborn Optimist', points: 0 }
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
      { question: 'q4', answer: 'A' }, // 1-7 days timeline
      { question: 'q7', answer: 'C' }  // Lost momentum halfway
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
      { question: 'q4', answer: 'B' }, // 30 days timeline
      { question: 'q2', answer: 'C' }  // Let it slide when no one's waiting
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
      { question: 'q4', answer: 'C' }, // 3-6 months timeline
      { question: 'q6', answer: 'C' }  // Talk to users and adjust
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
      { question: 'q3', answer: 'C' }, // Uncomfortable charging
      { question: 'q5', answer: 'B' }  // Launch after building working product
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
      { question: 'q5', answer: 'A' }, // Need 20+ validations
      { question: 'q1', answer: ['C', 'D'] } // 4-6 or 7+ unfinished
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
      { question: 'q1', answer: 'D' }, // 7+ unfinished graveyard
      { question: 'q7', answer: 'D' }  // Switched to different idea
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
      { question: 'q4', answer: 'D' }, // Never finish, keep improving
      { question: 'q3', answer: 'B' }, // Nervous, not good enough
      { question: 'q7', answer: 'B' }  // Built most but never launched
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
      // Convert user answer to letter key (A, B, C, D)
      const answerKey = getAnswerKey(trigger.question, userAnswer);
      if (Array.isArray(trigger.answer)) {
        if (trigger.answer.includes(answerKey)) matches++;
      } else {
        if (answerKey === trigger.answer) matches++;
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

// Helper function to convert answer text to letter key
function getAnswerKey(questionId: string, answerText: string): string {
  const question = FOUNDER_TYPE_QUESTIONS.find(q => q.id === questionId);
  if (!question) return '';
  
  const answerIndex = question.options.indexOf(answerText);
  if (answerIndex === -1) return '';
  
  // Convert index to letter: 0 -> A, 1 -> B, 2 -> C, 3 -> D
  return String.fromCharCode(65 + answerIndex);
}
