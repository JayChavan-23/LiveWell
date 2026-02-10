export const nudgeRules = [
    {
      id: "steps_reminder",
      frequency: "daily",
      condition: ({ frailty, now }) =>
        frailty?.steps < 6000 && now.getHours() >= 18,
      buildMessage: ({ frailty }) =>
        `You’ve done ${frailty.steps || 0} steps today — just ${
          6000 - (frailty.steps || 0)
        } more to hit your goal!`
    },
  
    {
      id: "movement_break",
      frequency: "hourly",
      condition: ({ frailty }) => frailty?.sedentaryHours >= 2,
      buildMessage: () => "You’ve been sedentary for 2 hours — time to stretch!"
    },
  
    {
      id: "hydration_reminder",
      frequency: "daily",
      condition: ({ hydrationLog, profile }) => {
        const water = hydrationLog?.hydration || 0;
        const target = profile?.preferences?.hydrationTarget || 6;
        return water < target;
      },
      buildMessage: ({ hydrationLog, profile }) => {
        const water = hydrationLog?.hydration || 0;
        const target = profile?.preferences?.hydrationTarget || 6;
        return `You’ve logged ${water} glasses of water today. Try hitting ${target}!`;
      }
    },
  
    {
      id: "goal_reminder",
      frequency: "daily",
      condition: ({ goals }) => goals?.length > 0,
      buildMessage: ({ goals }) =>
        `Don't forget your goal: ${goals[0].title}`
    },
  
    {
      id: "mood_checkin",
      frequency: "daily",
      condition: ({ lastMood }) =>
        lastMood?.value?.toLowerCase().includes("low") ||
        lastMood?.value?.toLowerCase().includes("sad"),
      buildMessage: () =>
        "You seemed low yesterday — want to share how you’re feeling today?"
    }
  ];
  