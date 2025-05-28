
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";

export default function AiAssistantPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
      </div>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Chat with Your AI Tutor</CardTitle>
          <CardDescription>Ask questions, get explanations for tough concepts, or request personalized study tips.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
          <div className="p-4 border rounded-lg h-full bg-muted/30 overflow-y-auto">
            {/* Chat messages will appear here */}
            <div className="text-center text-muted-foreground py-10">
              <p>No messages yet. Start by typing your question below.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Input type="text" placeholder="Ask a question about Physics, Chemistry or Biology..." className="flex-1" />
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
