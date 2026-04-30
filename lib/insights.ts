const getInsightByKeyword = (
  founderType: string
): string[] => {
  const type = founderType.toLowerCase();
  
  if (type.includes('comfort') || type.includes('reluctant')) {
    return [
      "You build well. You sell poorly. This week: one outreach message to one stranger. Not a blast. One real conversation.",
      "Comfort is the enemy of revenue. This week: do the one thing you've been avoiding because it feels like selling.",
      "Your product won't find its audience by itself. This week: go find three people who need what you built and ask them directly if they'd pay."
    ];
  }
  
  if (type.includes('sprint') || type.includes('impulsive') || type.includes('quick')) {
    return [
      "You started strong. The question is whether you're still here in 30 days. This week: no new ideas. Execute only on what you already committed to.",
      "Your energy is real. Your follow-through is the variable. This week: finish something before you start anything new.",
      "Speed without direction is just movement. This week: measure one thing that proves you're getting closer to your goal."
    ];
  }
  
  if (type.includes('unmonetized') || type.includes('maker') || type.includes('builder')) {
    return [
      "You know how to build. You don't know if anyone will pay. This week: ask five people what they'd pay for what you're building. Not if they like it. What they'd pay.",
      "Building without a buyer is a hobby. This week: identify one person with the exact problem you're solving and have a real conversation with them.",
      "Your catastrophic weakness is assuming quality sells itself. This week: practice asking for money out loud to someone who isn't a friend."
    ];
  }
  
  if (type.includes('unfulfilled') || type.includes('architect') || type.includes('visionary')) {
    return [
      "You have the vision. You lack the reps. This week: ship something incomplete rather than nothing perfect.",
      "The gap between your vision and your output is execution debt. This week: pick the smallest possible version of your idea and finish it.",
      "Plans don't compound. Actions do. This week: one concrete thing that didn't exist before you started."
    ];
  }
  
  // Default for any unmatched type
  return [
    "You're in the building phase. Most people never get here. This week: the one action you've been postponing is the one that matters most.",
    "Information is not the bottleneck. Execution is. This week: do something that would embarrass you if you didn't follow through.",
    "The pattern that stopped you before is still present. This week: notice it without acting on it."
  ];
};

export function getInsightForType(
  founderType: string,
  weekNumber: number
): string {
  const insights = getInsightByKeyword(founderType);
  return insights[weekNumber % insights.length];
}
