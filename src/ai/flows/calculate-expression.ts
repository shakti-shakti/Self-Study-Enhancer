'use server';
/**
 * @fileOverview An AI-powered calculator tool.
 *
 * - calculateExpression - A function that calculates the result of a mathematical expression.
 * - CalculateExpressionInput - The input type for the calculateExpression function.
 * - CalculateExpressionOutput - The return type for the calculateExpression function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateExpressionInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to calculate.'),
});
export type CalculateExpressionInput = z.infer<typeof CalculateExpressionInputSchema>;

const CalculateExpressionOutputSchema = z.object({
  result: z.number().describe('The calculated result of the expression.'),
});
export type CalculateExpressionOutput = z.infer<typeof CalculateExpressionOutputSchema>;

export async function calculateExpression(input: CalculateExpressionInput): Promise<CalculateExpressionOutput> {
  return calculateExpressionFlow(input);
}

const calculateExpressionPrompt = ai.definePrompt({
  name: 'calculateExpressionPrompt',
  input: {schema: CalculateExpressionInputSchema},
  output: {schema: CalculateExpressionOutputSchema},
  prompt: `You are a mathematical calculator. You will receive a mathematical expression, and you will return the result of the expression.

Expression: {{{expression}}}
`,
});

const calculateExpressionFlow = ai.defineFlow(
  {
    name: 'calculateExpressionFlow',
    inputSchema: CalculateExpressionInputSchema,
    outputSchema: CalculateExpressionOutputSchema,
  },
  async input => {
    const {output} = await calculateExpressionPrompt(input);
    return output!;
  }
);
