
"use client";
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Music2, Play, Pause, SkipForward, SkipBack, ListMusic, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Slider } from "@/components/ui/slider"; // Assuming you have a Slider component

export default function MusicPlayerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackDuration = 180; // Example duration in seconds (3 minutes)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(intervalRef.current!);
            setIsPlaying(false);
            return 100;
          }
          return prev + (100 / trackDuration); // Increment progress based on duration
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, trackDuration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && progress >= 100) { // If starting after finishing
      setProgress(0);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    setProgress(newProgress[0]);
  };
  
  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
    setIsMuted(false); // Unmute if volume is changed
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentTime = (progress / 100) * trackDuration;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Music2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Music Player</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Study Session Beats</CardTitle>
          <CardDescription>Enjoy some focus-enhancing tunes. (Local playback simulation)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center shadow-lg">
            <Image src="https://placehold.co/256x256.png" alt="Album Art" data-ai-hint="music album abstract" width={256} height={256} className="rounded-lg object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-center">Focus Flow Lo-fi</h3>
            <p className="text-sm text-muted-foreground text-center">Study Beats Channel</p>
          </div>
          <div className="w-full max-w-md space-y-2">
            <Slider
              defaultValue={[progress]}
              value={[progress]}
              max={100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setProgress(0)}><SkipBack className="h-6 w-6" /></Button>
            <Button variant="default" size="lg" className="rounded-full w-16 h-16 shadow-md" onClick={togglePlayPause}>
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setProgress(100)}><SkipForward className="h-6 w-6" /></Button>
          </div>
           <div className="flex items-center space-x-2 w-full max-w-xs">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              defaultValue={[volume]}
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
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
