"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase, Submission } from "@/lib/supabase";

interface MusicSettings {
  enabled: boolean;
  url: string;
  title: string;
  type?: "mp3" | "youtube";
}

// Helper function to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /music\.youtube\.com\/watch\?v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Check if URL is a YouTube URL
function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

// Mock data for demo purposes when Supabase is not configured
const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "1",
    guest_name: "Sarah & James",
    message: "Wishing you both a lifetime of love and happiness! May your journey together be filled with beautiful moments and endless adventures. We're so honored to celebrate this special day with you!",
    photo_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    table_number: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    guest_name: "Uncle Bob",
    message: "Remember: a happy wife means a happy life! Just kidding... sort of. Congratulations to the most beautiful couple!",
    photo_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
    table_number: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "3",
    guest_name: "Emily Chen",
    message: "From college roommates to watching you find your soulmate - this moment is so surreal! Love you both so much!",
    photo_url: "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800&h=600&fit=crop",
    table_number: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "4",
    guest_name: "The Martinez Family",
    message: "Our families have been friends for generations, and now we get to celebrate this beautiful union. Here's to creating new memories together!",
    photo_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop",
    table_number: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "5",
    guest_name: "Anonymous Guest",
    message: "True love stories never have endings. Congratulations!",
    photo_url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=600&fit=crop",
    table_number: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "6",
    guest_name: "Grandma Rose",
    message: "My dearest grandchild, watching you grow up and now seeing you so happy brings tears of joy. Your grandfather would be so proud. Cherish every moment together.",
    photo_url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&h=600&fit=crop",
    table_number: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "7",
    guest_name: "Work Crew",
    message: "Who knew office romance could lead to this? We're losing a great colleague to love! Best wishes from everyone at the office!",
    photo_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop",
    table_number: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "8",
    guest_name: "Best Man Mike",
    message: "After 15 years of friendship, I finally get to see my best friend marry the love of his life. You two are perfect together. Cheers to forever!",
    photo_url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800&h=600&fit=crop",
    table_number: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
];

export default function WallPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<Submission | null>(null);
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  // Music state
  const [musicSettings, setMusicSettings] = useState<MusicSettings>({ enabled: false, url: "", title: "" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<HTMLIFrameElement | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "The Happy Couple";

  // Fetch music settings
  useEffect(() => {
    const fetchMusicSettings = async () => {
      try {
        const response = await fetch("/api/music");
        const data = await response.json();
        setMusicSettings(data);

        if (data.enabled && data.url) {
          const isYT = isYouTubeUrl(data.url);
          setIsYouTube(isYT);

          if (isYT) {
            const videoId = getYouTubeVideoId(data.url);
            setYoutubeVideoId(videoId);
          }

          setShowMusicPrompt(true);
        }
      } catch (error) {
        console.error("Error fetching music settings:", error);
      }
    };
    fetchMusicSettings();
  }, []);

  // Handle music play/pause
  const toggleMusic = () => {
    if (isYouTube && youtubePlayerRef.current) {
      const iframe = youtubePlayerRef.current;
      if (isPlaying) {
        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        setIsPlaying(false);
      } else {
        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        setIsPlaying(true);
        setShowMusicPrompt(false);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setShowMusicPrompt(false);
        }).catch(console.error);
      }
    }
  };

  const startMusic = () => {
    if (isYouTube && youtubePlayerRef.current) {
      const iframe = youtubePlayerRef.current;
      iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setIsPlaying(true);
      setShowMusicPrompt(false);
    } else if (audioRef.current && musicSettings.url) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowMusicPrompt(false);
      }).catch(console.error);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        // Use mock data for demo
        setIsDemo(true);
        let mockData = [...MOCK_SUBMISSIONS];

        if (filterTable) {
          mockData = mockData.filter(s => s.table_number === parseInt(filterTable, 10));
        }

        setSubmissions(mockData);

        const tables = [...new Set(
          MOCK_SUBMISSIONS
            .map((s) => s.table_number)
            .filter((t): t is number => t !== null)
        )].sort((a, b) => a - b);

        setAvailableTables(tables);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterTable) {
        query = query.eq("table_number", parseInt(filterTable, 10));
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubmissions(data || []);

      // Extract unique table numbers
      const tables = [...new Set(
        (data || [])
          .map((s) => s.table_number)
          .filter((t): t is number => t !== null)
      )].sort((a, b) => a - b);

      setAvailableTables(tables);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      // Fall back to mock data on error
      setIsDemo(true);
      setSubmissions(MOCK_SUBMISSIONS);
      const tables = [...new Set(
        MOCK_SUBMISSIONS
          .map((s) => s.table_number)
          .filter((t): t is number => t !== null)
      )].sort((a, b) => a - b);
      setAvailableTables(tables);
    } finally {
      setLoading(false);
    }
  }, [filterTable]);

  useEffect(() => {
    fetchSubmissions();

    // Only set up real-time subscription if not in demo mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return;
    }

    // Set up real-time subscription
    const channel = supabase
      .channel("submissions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSubmission = payload.new as Submission;
            // Only add if it matches the current filter
            if (!filterTable || newSubmission.table_number === parseInt(filterTable, 10)) {
              setSubmissions((prev) => [newSubmission, ...prev]);
            }
            // Update available tables
            if (newSubmission.table_number && !availableTables.includes(newSubmission.table_number)) {
              setAvailableTables((prev) => [...prev, newSubmission.table_number!].sort((a, b) => a - b));
            }
          } else if (payload.eventType === "DELETE") {
            setSubmissions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubmissions, filterTable, availableTables]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <main className="min-h-screen relative">
      {/* Audio Element (for MP3) */}
      {musicSettings.enabled && musicSettings.url && !isYouTube && (
        <audio
          ref={audioRef}
          src={musicSettings.url}
          loop
          preload="auto"
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* YouTube Player (hidden) */}
      {musicSettings.enabled && isYouTube && youtubeVideoId && (
        <div className="fixed -top-[9999px] -left-[9999px] w-0 h-0 overflow-hidden pointer-events-none">
          <iframe
            ref={youtubePlayerRef}
            src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
            width="1"
            height="1"
            allow="autoplay; encrypted-media"
            title="Background Music"
          />
        </div>
      )}

      {/* Music Play Prompt Modal */}
      {showMusicPrompt && musicSettings.enabled && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
              Background Music
            </h3>
            {musicSettings.title && (
              <p className="text-sm text-gray-500 mb-6">{musicSettings.title}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMusicPrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, thanks
              </button>
              <button
                onClick={startMusic}
                className="flex-1 btn-primary !py-2.5"
              >
                Play Music
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Music Control */}
      {musicSettings.enabled && musicSettings.url && !showMusicPrompt && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white shadow-lg border border-[var(--champagne)] flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          title={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Elegant background pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-[var(--gold)]/10 border-b border-[var(--gold)]/20 px-4 py-2 text-center text-sm text-[var(--gold-dark)]">
          Demo Mode - Showing example memories. Connect Supabase to see real submissions.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--champagne)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="group">
                <div className="ornament text-base group-hover:text-[var(--gold)] transition-colors">✦</div>
              </Link>
              <div>
                <p className="font-script text-xl text-[var(--rose-gold)]">Blessings Wall</p>
                <p className="text-xs text-gray-400 tracking-wider uppercase">{coupleName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Table Filter */}
              {availableTables.length > 0 && (
                <select
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                  className="input-wedding !py-2 !px-4 text-xs !w-auto min-w-[130px] tracking-wide"
                >
                  <option value="">All Tables</option>
                  {availableTables.map((table) => (
                    <option key={table} value={table}>
                      Table {table}
                    </option>
                  ))}
                </select>
              )}

              <Link
                href="/submit"
                className="btn-primary !py-2 !px-5 !text-xs inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Blessing</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4" />
            <p className="text-gray-500">Loading memories...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 mx-auto text-[var(--blush)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No blessings yet</h2>
            <p className="text-gray-500 mb-6">Be the first to send your dua!</p>
            <Link href="/submit" className="btn-primary inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Share Your Dua
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mb-8 text-xs text-gray-400 tracking-wider uppercase">
              <div className="flex items-center gap-2">
                <span className="text-[var(--gold)]">✦</span>
                <span>{submissions.length} {submissions.length === 1 ? "blessing" : "blessings"}</span>
              </div>
              {filterTable && (
                <div className="flex items-center gap-2">
                  <span>Table {filterTable}</span>
                  <button
                    onClick={() => setFilterTable("")}
                    className="text-[var(--gold)] hover:text-[var(--gold-dark)] underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            <div className="masonry-grid">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="memory-card bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-[var(--champagne)] cursor-pointer animate-fade-in-up hover:shadow-lg"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setSelectedPhoto(submission)}
                >
                  {/* Photo */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--cream)]">
                    <img
                      src={submission.photo_url}
                      alt={`Memory from ${submission.guest_name || "Guest"}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    {submission.table_number && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-medium text-gray-500 tracking-wide">
                        Table {submission.table_number}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 font-light italic">
                      &ldquo;{submission.message}&rdquo;
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--champagne)] flex items-center justify-between text-xs text-gray-400">
                      <span className="font-medium text-[var(--gold-dark)] tracking-wide">
                        {submission.guest_name || "Anonymous"}
                      </span>
                      <span className="tracking-wide">{formatDate(submission.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.photo_url}
                alt={`Memory from ${selectedPhoto.guest_name || "Guest"}`}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
            </div>

            <div className="p-6 md:p-8">
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6 font-light italic">
                &ldquo;{selectedPhoto.message}&rdquo;
              </p>

              <div className="flex items-center justify-between text-sm border-t border-[var(--champagne)] pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--gold)]">✦</span>
                  <span className="font-medium text-[var(--gold-dark)] tracking-wide">
                    {selectedPhoto.guest_name || "Anonymous Guest"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-xs tracking-wide">
                  {selectedPhoto.table_number && (
                    <span>Table {selectedPhoto.table_number}</span>
                  )}
                  <span>{formatDate(selectedPhoto.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
