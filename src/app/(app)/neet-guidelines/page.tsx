
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpenCheck, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NeetGuidelinesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">NEET Guidelines Dashboard</h1>
        </div>
         <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Tab/Tip
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Important NEET Info</CardTitle>
          <CardDescription>Organize and access important NEET tips, reminders, or guidelines in custom tabs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general_tips" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="general_tips">General Tips</TabsTrigger>
              <TabsTrigger value="exam_strategy">Exam Strategy</TabsTrigger>
              <TabsTrigger value="subject_notes">Subject Notes</TabsTrigger>
              {/* Add more TabsTriggers for custom tabs */}
            </TabsList>
            <TabsContent value="general_tips">
              <Card className="bg-muted/30">
                <CardHeader><CardTitle>General Preparation Tips</CardTitle></CardHeader>
                <CardContent className="space-y-2 min-h-[150px]">
                  <p className="text-sm">1. Create a realistic study schedule and stick to it.</p>
                  <p className="text-sm">2. Focus on understanding concepts rather than rote memorization.</p>
                  <p className="text-sm">3. Solve previous year question papers regularly.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="exam_strategy">
              <Card className="bg-muted/30">
                <CardHeader><CardTitle>Exam Day Strategy</CardTitle></CardHeader>
                <CardContent className="min-h-[150px]">
                  <p className="text-sm">Manage your time effectively during the exam...</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="subject_notes">
               <Card className="bg-muted/30">
                <CardHeader><CardTitle>Quick Subject Notes</CardTitle></CardHeader>
                <CardContent className="min-h-[150px]">
                  <p className="text-sm">Physics: Key formulas for Kinematics...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
