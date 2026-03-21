import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YOUTUBE_CONFIG } from "@/config/youtube";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoUrl: string;
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      const { API_KEY, CHANNEL_HANDLE, MAX_RESULTS } = YOUTUBE_CONFIG;
      
      if (!API_KEY || API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
        throw new Error("YouTube API key not configured. Please add your API key in src/config/youtube.ts");
      }

      // First, get the channel ID from the handle
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`
      );
      
      if (!channelResponse.ok) {
        throw new Error("Failed to fetch channel information");
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found");
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Fetch videos from the uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${MAX_RESULTS}&key=${API_KEY}`
      );

      if (!videosResponse.ok) {
        throw new Error("Failed to fetch videos");
      }

      const videosData = await videosResponse.json();

      const formattedVideos: Video[] = videosData.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      }));

      setVideos(formattedVideos);
      setError(null);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Videos - Merit Launchers | Educational Content & Tips"
        description="Watch our latest educational videos, exam preparation tips, and study guides on our YouTube channel. Get expert insights for CUET, CLAT, JEE, NEET, and more."
        keywords="Merit Launchers videos, exam preparation videos, study tips, educational content, CUET videos, CLAT videos, JEE preparation, NEET tutorials"
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Educational Videos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Watch our latest videos, exam tips, and study guides on YouTube
          </p>
          <Button asChild size="lg" className="shadow-glow">
            <a 
              href="https://www.youtube.com/@merit_launchers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-5 w-5" />
              Visit Our YouTube Channel
            </a>
          </Button>
        </section>

        {/* Videos Grid */}
        <section>
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading videos...</p>
            </div>
          )}

          {error && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <p className="text-muted-foreground mb-4">
                  To display videos automatically, you need to configure a YouTube Data API key.
                </p>
                <Button asChild variant="outline">
                  <a 
                    href="https://www.youtube.com/@merit_launchers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Channel Directly
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && videos.length === 0 && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No videos found</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-primary rounded-full p-4">
                          <Play className="h-8 w-8 text-primary-foreground fill-current" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {video.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
