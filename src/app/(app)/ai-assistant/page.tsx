
"use client";
import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2, User, Bot } from "lucide-react";
import { answerQuestion, type AnswerQuestionInput, type AnswerQuestionOutput } from '@/ai/flows/answer-questions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AiAssistantPage() {
  const { user } = useAuth(); // Get user from context
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessageText = inputValue;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    if (user) { // Ensure user is available before logging
      logActivity(
        "AI Query", 
        `User asked: "${userMessageText.substring(0, 50)}${userMessageText.length > 50 ? '...' : ''}"`, 
        { question: userMessageText },
        user.id // Pass user.id
      );
    }


    try {
      const input: AnswerQuestionInput = { question: userMessage.text };
      const output: AnswerQuestionOutput = await answerQuestion(input);
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: output.answer,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error("Error getting AI response:", err);
      const errorMessageText = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get response: ${errorMessageText}`);
      const aiErrorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `Sorry, I encountered an error: ${errorMessageText}`,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      if (user) { // Ensure user is available
        logActivity(
            "AI Error", 
            `Error answering question: "${userMessageText.substring(0,50)}..."`, 
            { error: errorMessageText },
            user.id // Pass user.id
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
      </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Chat with Your AI Tutor</CardTitle>
          <CardDescription>Ask questions, get explanations for tough concepts, or request personalized study tips.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-4 overflow-hidden">
          <ScrollArea className="flex-1 p-4 border rounded-lg bg-muted/30" ref={scrollAreaRef}>
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-10">
                <Bot className="h-12 w-12 mx-auto mb-2 text-primary/50" />
                <p>No messages yet. Start by typing your question below.</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-end space-x-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border shadow-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                   {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length -1]?.sender === 'user' && (
                <div className="flex items-end space-x-2">
                   <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                  <div className="max-w-[70%] p-3 rounded-lg bg-background border shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Input 
              type="text" 
              placeholder="Ask a question about Physics, Chemistry or Biology..." 
              className="flex-1" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              disabled={isLoading || !user} // Disable if user not loaded
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim() || !user}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2 sr-only sm:not-sr-only">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    