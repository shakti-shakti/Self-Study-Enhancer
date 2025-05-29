// src/ai/flows/generate-random-questions.ts
'use server';
/**
 * @fileOverview An AI agent for generating random practice questions in a multiple-choice format.
 *
 * - generateRandomQuestion - A function that generates a random question based on the provided criteria.
 * - GenerateRandomQuestionInput - The input type for the generateRandomQuestion function.
 * - GenerateRandomQuestionOutput - The return type for the generateRandomQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRandomQuestionInputSchema = z.object({
  subject: z.string().describe('The subject of the question (e.g., Physics, Chemistry, Biology).'),
  topic: z.string().describe('The specific topic within the subject.'),
  source: z.string().describe('The source material for the question (e.g., NCERT, Previous Year Papers, Exemplar).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the question.'),
});

export type GenerateRandomQuestionInput = z.infer<typeof GenerateRandomQuestionInputSchema>;

const GenerateRandomQuestionOutputSchema = z.object({
  question: z.string().describe('The text of the generated multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('An array of exactly four distinct string options for the multiple-choice question.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer within the "options" array.'),
  explanation: z.string().describe('A concise explanation for why the correct answer is correct.'),
});

export type GenerateRandomQuestionOutput = z.infer<typeof GenerateRandomQuestionOutputSchema>;

export async function generateRandomQuestion(input: GenerateRandomQuestionInput): Promise<GenerateRandomQuestionOutput> {
  return generateRandomQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRandomQuestionPrompt',
  input: {schema: GenerateRandomQuestionInputSchema},
  output: {schema: GenerateRandomQuestionOutputSchema},
  prompt: `You are an expert question generator for NEET (National Eligibility cum Entrance Test) exam preparation.
Your task is to generate a challenging, relevant multiple-choice question based on the following criteria.
The question must have exactly four distinct options.
You must clearly identify the correct answer among the four options.
You must provide a brief explanation for the correct answer.

Subject: {{{subject}}}
Topic: {{{topic}}}
Source: {{{source}}}
{{#if difficulty}}
Difficulty: {{{difficulty}}}
{{/if}}

Generate the question content, four options, the 0-based index of the correct option, and an explanation.
Ensure the options are plausible and test understanding of the topic.
The output MUST be a JSON object adhering to the specified output schema.
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
    // Ensure the output exists and conforms, though the schema validation should handle this.
    if (!output || !output.options || output.options.length !== 4 || output.correctAnswerIndex === undefined) {
        throw new Error('AI did not generate a valid multiple-choice question with 4 options and a correct answer index.');
    }
    return output;
  }
);
