'use server';

/**
 * @fileOverview Explains a given question using the AI assistant.
 *
 * - explainQuestion - A function that explains a given question.
 * - ExplainQuestionInput - The input type for the explainQuestion function.
 * - ExplainQuestionOutput - The return type for the explainQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainQuestionInputSchema = z.object({
  question: z.string().describe('The question to be explained.'),
});
export type ExplainQuestionInput = z.infer<typeof ExplainQuestionInputSchema>;

const ExplainQuestionOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the question.'),
});
export type ExplainQuestionOutput = z.infer<typeof ExplainQuestionOutputSchema>;

export async function explainQuestion(input: ExplainQuestionInput): Promise<ExplainQuestionOutput> {
  return explainQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainQuestionPrompt',
  input: {schema: ExplainQuestionInputSchema},
  output: {schema: ExplainQuestionOutputSchema},
  prompt: `Explain the following question in detail, providing step-by-step instructions and clarifying any complex concepts:

Question: {{{question}}}`, 
});

const explainQuestionFlow = ai.defineFlow(
  {
    name: 'explainQuestionFlow',
    inputSchema: ExplainQuestionInputSchema,
    outputSchema: ExplainQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
