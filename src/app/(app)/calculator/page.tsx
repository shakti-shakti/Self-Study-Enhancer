
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon, Equal } from "lucide-react"; // Renamed to avoid conflict
import { useState } from 'react';
import { calculateExpression, type CalculateExpressionInput, type CalculateExpressionOutput } from '@/ai/flows/calculate-expression';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalculatorPage() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!expression.trim()) {
      setError("Please enter a mathematical expression.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const input: CalculateExpressionInput = { expression };
      const output: CalculateExpressionOutput = await calculateExpression(input);
      setResult(output.result);
    } catch (err) {
      console.error("Error calculating expression:", err);
      setError("Failed to calculate. Please check the expression and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CalculatorIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Calculator</h1>
      </div>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mathematical Calculator</CardTitle>
          <CardDescription>Enter a mathematical expression to get the result.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            type="text" 
            placeholder="e.g., (2 + 3) * 5 / 2" 
            className="text-lg p-4 h-auto text-right" 
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
          />
          
          {isLoading && (
            <div className="p-4 bg-muted/50 rounded-md text-right">
                <Skeleton className="h-8 w-1/3 ml-auto" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result !== null && !isLoading && (
            <div className="p-4 bg-primary/10 rounded-md text-right">
              <p className="text-sm text-primary">Result</p>
              <p className="text-3xl font-bold text-primary">{result}</p>
            </div>
          )}
          
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? <Equal className="h-5 w-5 animate-pulse" /> : <Equal className="h-5 w-5"/>}
            <span className="ml-2">Calculate</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
