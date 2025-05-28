
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Music2, Play, Pause, SkipForward, SkipBack, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function MusicPlayerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Music2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Music Player</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Study Session Beats</CardTitle>
          <CardDescription>Play some music to help you focus without leaving the app. (Free streaming integration placeholder)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
            <Image src="https://placehold.co/256x256.png" alt="Album Art" data-ai-hint="music album abstract" width={256} height={256} className="rounded-lg object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-center">Focus Flow Lo-fi</h3>
            <p className="text-sm text-muted-foreground text-center">Study Beats Channel</p>
          </div>
          <div className="w-full max-w-md">
            {/* Progress bar placeholder */}
            <div className="h-2 bg-muted rounded-full w-full">
              <div className="h-2 bg-primary rounded-full w-1/3"></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1:23</span>
              <span>3:45</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon"><SkipBack className="h-6 w-6" /></Button>
            <Button variant="default" size="lg" className="rounded-full w-16 h-16"><Play className="h-8 w-8" /></Button>
            <Button variant="ghost" size="icon"><SkipForward className="h-6 w-6" /></Button>
          </div>
          <Button variant="outline">
            <ListMusic className="mr-2 h-4 w-4" />
            View Playlist
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
