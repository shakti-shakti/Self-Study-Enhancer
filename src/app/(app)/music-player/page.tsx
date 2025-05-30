
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Music2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Default Lo-fi Beats playlist for studying.
const DEFAULT_SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0"; 

export default function MusicPlayerPage() {
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(DEFAULT_SPOTIFY_EMBED_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_SPOTIFY_EMBED_URL);
  const { toast } = useToast();

  const handleChangeEmbedUrl = () => {
    const trimmedUrl = inputUrl.trim();
    if (trimmedUrl.startsWith("https://open.spotify.com/embed/")) {
      setSpotifyEmbedUrl(trimmedUrl);
      toast({title: "Spotify Player Updated", description: "Loading new Spotify content."});
    } else {
      toast({variant: "destructive", title: "Invalid URL", description: "Please provide a valid Spotify EMBED URL (e.g., from Share > Embed playlist/track)."});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Music2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Music Player (Spotify Embed)</h1>
      </div>
      <Alert>
        <Music2 className="h-4 w-4" />
        <AlertTitle>Spotify Integration</AlertTitle>
        <AlertDescription>
          This page embeds Spotify content via an iframe. You can play music if you are logged into Spotify in your browser.
          To change the playlist/album, get an <strong className="text-primary">embed URL</strong> from Spotify (Share &gt; Embed track/playlist &gt; copy the `src` attribute from the iframe code) and paste it below.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Focus with Spotify</CardTitle>
          <CardDescription>
            Enjoy the default study playlist or paste a Spotify embed URL below to change the music.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="spotify-url-input">Spotify Embed URL</Label>
            <div className="flex space-x-2">
              <Input 
                id="spotify-url-input"
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste Spotify Embed URL here" 
              />
              <Button onClick={handleChangeEmbedUrl}>Load</Button>
            </div>
             <p className="text-xs text-muted-foreground">Example: https://open.spotify.com/embed/playlist/your_playlist_id</p>
          </div>
          
          <div className="aspect-[16/9] sm:aspect-video w-full max-w-2xl mx-auto border rounded-lg overflow-hidden shadow-lg bg-muted">
            {spotifyEmbedUrl ? (
              <iframe
                key={spotifyEmbedUrl} // Key change forces iframe re-render
                title="Spotify Embed Player"
                src={spotifyEmbedUrl}
                width="100%"
                height="100%" 
                allowFullScreen={false}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Enter a Spotify Embed URL above to load music.</p>
              </div>
            )}
          </div>
          <div className="text-center">
            <Button variant="outline" asChild>
              <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open Spotify in New Tab
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
       <Card className="mt-4">
        <CardHeader>
          <CardTitle>How to get a Spotify Embed URL:</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Go to Spotify (web or desktop app).</p>
          <p>2. Find the song, album, or playlist you want to embed.</p>
          <p>3. Click the three dots (...) menu next to it.</p>
          <p>4. Go to "Share" &gt; "Embed track/playlist" (or similar wording).</p>
          <p>5. In the embed code preview, look for the `iframe` tag. Inside it, find the `src="..."` attribute.</p>
          <p>6. Copy ONLY the URL from the `src` attribute (it will start with `https://open.spotify.com/embed/...`).</p>
          <p>7. Paste that URL into the input field above.</p>
        </CardContent>
      </Card>
    </div>
  );
}
