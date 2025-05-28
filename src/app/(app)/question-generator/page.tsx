
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Settings2, History, BarChart3, Save, Copy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuestionGeneratorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileQuestion className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Random Question Generator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configure Your Test</CardTitle>
            <CardDescription>Select options to generate questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-select">Subject</Label>
              <Select>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic-select">Topic</Label>
              <Select>
                <SelectTrigger id="topic-select">
                  <SelectValue placeholder="Select Topic (after subject)" />
                </SelectTrigger>
                <SelectContent>
                  {/* Topics would be populated based on subject */}
                  <SelectItem value="topic1">Topic 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-select">Question Source</Label>
              <Select>
                <SelectTrigger id="source-select">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ncert">NCERT</SelectItem>
                  <SelectItem value="previous_year">Previous Year Papers</SelectItem>
                  <SelectItem value="exemplar">Exemplar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">
              <Settings2 className="mr-2 h-4 w-4" />
              Generate Question
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Question</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px] p-6 border rounded-lg bg-muted/30 flex flex-col justify-center items-center text-center">
            {/* Generated question will appear here */}
            <p className="text-muted-foreground">Your generated question will appear here.</p>
            <p className="mt-4 text-lg font-medium">E.g., What is the powerhouse of the cell?</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="outline"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
            <Button variant="secondary"><HelpCircle className="mr-2 h-4 w-4" /> Explain</Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>Accuracy</h3>
            <p className="text-2xl font-bold">--%</p>
            <p className="text-sm text-muted-foreground">Based on last test</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><History className="mr-2 h-5 w-5 text-accent"/>Performance History</h3>
            <p className="text-muted-foreground">View your progress over time.</p>
            <Button variant="link" className="p-0 h-auto">View History</Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
