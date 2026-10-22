export type MathQuestion = { text: string; spoken: string; answer: number }

const additions: MathQuestion[] = []
const subtractions = new Map<string, MathQuestion>()

for (let a = 2; a <= 9; a++) {
  for (let b = 1; b <= 8; b++) {
    additions.push({ text: `${a} + ${b}`, spoken: `${a} plus ${b}`, answer: a + b })
    const high = Math.max(a, b)
    const low = Math.min(a, b)
    const text = `${high} \u2212 ${low}`
    subtractions.set(text, { text, spoken: `${high} minus ${low}`, answer: high - low })
  }
}

const subtractionQuestions = [...subtractions.values()]

export function makeQuestion(previousText = ''): MathQuestion {
  const pool = (Math.random() < 0.6 ? additions : subtractionQuestions)
    .filter((question) => question.text !== previousText)
  return pool[Math.floor(Math.random() * pool.length)]
}
