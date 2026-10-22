import assert from 'node:assert/strict'
import { test } from 'node:test'
import { makeQuestion } from '../src/lib/math-question.ts'

test('each refresh differs from the previous question, even with repeated random values', () => {
  const originalRandom = Math.random
  try {
    for (const random of [0, 0.3, 0.6, 0.99]) {
      Math.random = () => random
      let previous = ''
      for (let i = 0; i < 100; i++) {
        const question = makeQuestion(previous)
        assert.notEqual(question.text, previous)
        const [a, operator, b] = question.text.split(' ')
        assert.equal(question.answer, operator === '+' ? Number(a) + Number(b) : Number(a) - Number(b))
        assert(question.answer >= 0)
        previous = question.text
      }
    }
  } finally {
    Math.random = originalRandom
  }
})
