export async function generateAIResponse(charId: string, userInput: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`（${charId} 微微一怔，眼神复杂地看着你，沉默片刻后轻声说：“你总是这么出人意料。”）`);
    }, 800);
  });
}
