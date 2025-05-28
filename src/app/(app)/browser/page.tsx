
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Globe, Search, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BrowserPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <Globe className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Mini Browser</h1>
      </div>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>In-App Web Search</CardTitle>
          <CardDescription>Search doubts on Google, watch YouTube lectures, and access online resources without leaving the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" disabled><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" disabled><ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
            <Input type="text" placeholder="Search Google or type a URL" className="flex-1" defaultValue="https://www.google.com" />
            <Button><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
          <div className="p-4 border rounded-lg h-full bg-muted/30 flex items-center justify-center">
            {/* Web view (e.g., iframe) placeholder */}
            <p className="text-muted-foreground">Web content will be displayed here.</p>
            <p className="text-xs text-muted-foreground mt-2">(Actual iframe integration needed for functionality)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
