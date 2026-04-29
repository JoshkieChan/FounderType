const insights: Record<string, string[]> = {
  'Persistent Technical Builder': [
    "You tend to over-build and under-sell. This week: talk to 3 potential customers before writing a single line of code.",
    "Technical founders often mistake complexity for value. This week: remove one feature. See if anyone notices.",
    "Your biggest risk isn't building wrong. It's building in silence. Share what you're working on with one stranger this week.",
    "You love solving problems with code. But customers pay for solutions, not technology. This week: spend 4 hours just listening to customer problems.",
    "Perfect is the enemy of shipped. This week: launch something unfinished to 5 people and learn from their reactions.",
    "You can build anything. The question is should you? This week: say no to one technical feature request.",
  ],
  'Impulsive Builder with Conflicting Desires': [
    "You move fast. That's your superpower and your curse. This week: finish one thing before starting anything new.",
    "Your energy attracts people but your follow-through keeps them. Pick one commitment this week and honor it completely.",
    "Ideas are cheap. Execution is everything. This week: work on only one project for the entire week.",
    "You're great at starting. This week: practice finishing. Complete one small thing every single day.",
    "Your passion is contagious. Your scattered focus is not. This week: create a 'not right now' list for new ideas.",
    "You inspire people with your energy. Channel it. This week: block 2 hours daily for your most important project.",
  ],
  'Visionary Builder': [
    "Visions don't pay bills. Execution does. This week: turn one idea into one concrete action with a deadline.",
    "You see the future clearly. Others don't. This week: find one person who understands your vision and build with them.",
    "Big thinking is your strength. Details are your weakness. This week: focus only on the next 30 days.",
    "You're building for tomorrow. But you need to survive today. This week: generate $1 from your vision.",
    "Your ideas are ahead of their time. This week: make one idea 10% simpler and test it with real users.",
    "You inspire with your vision. Ground it with reality. This week: share one specific result you've achieved.",
  ],
  'Cautious Optimizer': [
    "You analyze everything. That's smart. But analysis paralysis is real. This week: make one decision with 70% of the information.",
    "Risk management is your strength. But missed opportunities are risks too. This week: take one small risk.",
    "You optimize for the perfect plan. Perfect plans don't survive reality. This week: launch something and iterate based on real feedback.",
    "Research is valuable. Action is priceless. This week: spend 80% of your time doing, 20% researching.",
    "You want to get everything right. Good enough beats perfect every time. This week: ship something imperfect.",
    "Your caution prevents disasters. But it also prevents breakthroughs. This week: try one approach you'd normally reject.",
  ],
  'Reluctant Leader': [
    "You didn't ask for this leadership role, but you're good at it. This week: make one decision without consensus.",
    "You serve your team well. But you need to lead them. This week: set one clear direction and stick to it.",
    "You're humble. That's admirable. But sometimes you need to be bold. This week: take credit for one success.",
    "You avoid conflict. But some conflicts need to happen. This week: address one issue you've been avoiding.",
    "You put others first. That's leadership. But you need to put the mission first sometimes. This week: make one tough call.",
    "You lead by serving. That's powerful. But sometimes you need to command. This week: give one direct order.",
  ],
  'Strategic Networker': [
    "You know everyone. That's valuable. But connections without action are just socializing. This week: turn one connection into collaboration.",
    "You're great at building relationships. But relationships need purpose. This week: ask one person for help.",
    "Your network is your asset. But assets need maintenance. This week: reconnect with three people you haven't talked to in months.",
    "You connect people well. But you need to connect yourself to outcomes. This week: track one metric from your networking.",
    "You're a natural connector. But you need to be a natural closer. This week: convert one conversation into commitment.",
    "You build bridges between people. Build some between ideas and execution too. This week: execute one thing you've been discussing.",
  ],
  'Solitary Innovator': [
    "You do your best work alone. That's your strength. But innovation needs validation. This week: show your work to one person.",
    "You think deeply. That's valuable. But thinking without doing is just daydreaming. This week: build one small prototype.",
    "You protect your focus. That's smart. But isolation breeds blind spots. This week: seek one outside perspective.",
    "You create breakthroughs in solitude. But breakthroughs need teams to scale. This week: recruit one collaborator.",
    "You value your independence. But interdependence creates impact. This week: depend on someone else for one thing.",
    "You're a lone genius. But even Einstein had collaborators. This week: share one unfinished idea.",
  ],
  'Pragmatic Realist': [
    "You're grounded in reality. That's valuable. But reality changes. This week: imagine one impossible thing.",
    "You focus on what works. That's practical. But breakthroughs come from what doesn't work yet. This week: try one failing approach.",
    "You're realistic about constraints. But constraints inspire creativity. This week: turn one constraint into an opportunity.",
    "You avoid hype. That's smart. But you might avoid momentum too. This week: celebrate one small win publicly.",
    "You're practical. That's reliable. But magic happens in the impractical. This week: pursue one 'unrealistic' idea.",
    "You see things as they are. Great. Now see them as they could be. This week: spend one hour just dreaming.",
  ],
  'Customer-Centric Builder': [
    "You're obsessed with customers. That's right. But you need to be obsessed with their money too. This week: ask one customer to pay.",
    "You listen well. That's valuable. But listening without acting is just collecting opinions. This week: implement one piece of feedback.",
    "You serve customers beautifully. But you need to serve your business too. This week: make one decision that prioritizes profit over service.",
    "You understand customer pain. But you need to understand customer value. This week: double prices for one customer and see what happens.",
    "You're customer-focused. That's good. But you need to be market-focused too. This week: research one competitor you've been ignoring.",
    "You love helping customers. But sometimes the best help is a firm no. This week: say no to one customer request.",
  ],
  'Growth-Focused Scalable Builder': [
    "You think about scale from day one. That's strategic. But day one needs to work first. This week: focus only on your first 10 users.",
    "You optimize for growth. That's ambitious. But sustainable growth needs retention. This week: focus only on keeping existing users happy.",
    "You see the big picture. That's valuable. But pictures are made of pixels. This week: improve one small detail.",
    "You want to go viral. That's exciting. But organic growth is more reliable. This week: create one thing worth sharing.",
    "You're building for the future. But you need to survive the present. This week: cut one growth-focused expense.",
    "You think in terms of systems. That's smart. But systems need people. This week: spend one-on-one time with one team member.",
  ],
  'Data-Driven Experimenter': [
    "You love data. That's smart. But data without action is just numbers. This week: make one decision based on gut feeling.",
    "You test everything. That's scientific. But some things need faith. This week: launch one thing you can't measure.",
    "You optimize constantly. That's efficient. But constant optimization prevents momentum. This week: stop optimizing one thing.",
    "You trust the data. But data has blind spots. This week: follow one user's emotional journey instead of their metrics.",
    "You're analytical. That's valuable. But breakthroughs often come from intuition. This week: act on one hunch.",
    "You experiment well. But experiments need hypotheses. This week: run one experiment just to see what happens.",
  ],
  'Default FounderType': [
    "Every founder's journey is unique. This week: define what success means to you, not to others.",
    "Building is hard. That's normal. This week: acknowledge one difficulty and keep going anyway.",
    "You're doing something most people won't. That's extraordinary. This week: celebrate one small victory.",
    "The path isn't clear. That's why you're the one clearing it. This week: take one step into uncertainty.",
    "You're building the future. That takes time. This week: practice patience with your progress.",
    "Most people talk about building. You're actually doing it. This week: remember how far you've already come.",
  ],
};

export function getInsightForType(
  founderType: string, 
  weekNumber: number
): string {
  const typeInsights = insights[founderType] || insights['Default FounderType'];
  return typeInsights[weekNumber % typeInsights.length];
}

export function getAllInsightsForType(founderType: string): string[] {
  return insights[founderType] || insights['Default FounderType'];
}
