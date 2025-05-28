
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NcertViewerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">NCERT Book Viewer</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Digital Textbooks</CardTitle>
          <CardDescription>Download, save, view chapters, and make notes directly on your NCERT books.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar for book list */}
            <div className="w-full md:w-1/4 space-y-2">
              <h3 className="font-semibold mb-2">My Books</h3>
              {["Physics XI", "Chemistry XI", "Biology XI", "Physics XII"].map(book => (
                <Button key={book} variant="ghost" className="w-full justify-start">{book}</Button>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <Download className="mr-2 h-4 w-4" /> Download New Book
              </Button>
            </div>
            {/* Main viewer area */}
            <div className="w-full md:w-3/4 p-6 border rounded-lg min-h-[400px] bg-muted/30 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-4">Select a book and chapter to view.</p>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon"><ZoomIn className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon"><ZoomOut className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon"><Edit className="h-5 w-5"/></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
