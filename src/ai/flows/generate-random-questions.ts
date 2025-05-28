// src/ai/flows/generate-random-questions.ts
'use server';
/**
 * @fileOverview An AI agent for generating random practice questions.
 *
 * - generateRandomQuestion - A function that generates a random question based on the provided criteria.
 * - GenerateRandomQuestionInput - The input type for the generateRandomQuestion function.
 * - GenerateRandomQuestionOutput - The return type for the generateRandomQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRandomQuestionInputSchema = z.object({
  subject: z.string().describe('The subject of the question.'),
  topic: z.string().describe('The topic of the question.'),
  source: z.string().describe('The source of the question (e.g., textbook, exam).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the question.'),
});

export type GenerateRandomQuestionInput = z.infer<typeof GenerateRandomQuestionInputSchema>;

const GenerateRandomQuestionOutputSchema = z.object({
  question: z.string().describe('The generated question.'),
  answer: z.string().describe('The answer to the generated question.'),
  explanation: z.string().describe('An explanation of the answer.'),
});

export type GenerateRandomQuestionOutput = z.infer<typeof GenerateRandomQuestionOutputSchema>;

export async function generateRandomQuestion(input: GenerateRandomQuestionInput): Promise<GenerateRandomQuestionOutput> {
  return generateRandomQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRandomQuestionPrompt',
  input: {schema: GenerateRandomQuestionInputSchema},
  output: {schema: GenerateRandomQuestionOutputSchema},
  prompt: `You are an expert question generator for NEET exam preparation.

You will generate a random question based on the following criteria:

Subject: {{{subject}}}
Topic: {{{topic}}}
Source: {{{source}}}
Difficulty: {{{difficulty}}}

Include the answer and explanation to the generated question.

Format the response as a JSON object with the following keys:
- question: The generated question.
- answer: The answer to the generated question.
- explanation: An explanation of the answer.
`,
});

const generateRandomQuestionFlow = ai.defineFlow(
  {
    name: 'generateRandomQuestionFlow',
    inputSchema: GenerateRandomQuestionInputSchema,
    outputSchema: GenerateRandomQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
