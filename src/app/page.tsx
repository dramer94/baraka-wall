"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// YouTube helper functions
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /music\.youtube\.com\/watch\?v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export default function Home() {
  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "The Happy Couple";
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "";

  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  // Fetch music settings
  useEffect(() => {
    fetch("/api/music")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.url) {
          setMusicEnabled(true);
          setMusicUrl(data.url);
          setShowMusicPrompt(true);
        }
      })
      .catch(console.error);
  }, []);

  const startMusic = () => {
    setHasInteracted(true);
    setShowMusicPrompt(false);

    if (isYouTubeUrl(musicUrl)) {
      setIsPlaying(true);
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (isYouTubeUrl(musicUrl)) {
      if (youtubeRef.current?.contentWindow) {
        if (isPlaying) {
          youtubeRef.current.contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            "*"
          );
        } else {
          youtubeRef.current.contentWindow.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            "*"
          );
        }
        setIsPlaying(!isPlaying);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Split couple name for elegant display
  const names = coupleName.split("&").map((n) => n.trim());
  const name1 = names[0] || "";
  const name2 = names[1] || "";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-[var(--gold)] rounded-full opacity-5 blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-[var(--rose-gold)] rounded-full opacity-5 blur-3xl" />

      {/* Music prompt overlay */}
      {showMusicPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
              Welcome to Our Wedding
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Would you like to play background music?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowMusicPrompt(false)}
                className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, thanks
              </button>
              <button
                onClick={startMusic}
                className="btn-primary !py-2.5 !px-6 !text-sm"
              >
                Play Music
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio/YouTube player */}
      {musicEnabled && hasInteracted && (
        <>
          {isYouTubeUrl(musicUrl) ? (
            <iframe
              ref={youtubeRef}
              className="fixed bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(musicUrl)}?enablejsapi=1&autoplay=1&loop=1&playlist=${getYouTubeVideoId(musicUrl)}`}
              allow="autoplay; encrypted-media"
              title="Background Music"
            />
          ) : (
            <audio ref={audioRef} src={musicUrl} loop autoPlay />
          )}
        </>
      )}

      {/* Music control button */}
      {musicEnabled && hasInteracted && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-white shadow-lg border border-[var(--blush)] flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          title={isPlaying ? "Pause Music" : "Play Music"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      )}

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Bismillah */}
        <p className="text-2xl md:text-3xl text-[var(--gold)] mb-6 font-arabic leading-relaxed">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
        </p>

        {/* Ornamental divider */}
        <div className="ornament mb-6">✦ ✦ ✦</div>

        {/* Wedding title in script font */}
        <p className="font-script text-3xl md:text-4xl text-[var(--rose-gold)] mb-4">
          The Wedding Celebration of
        </p>

        {/* Couple names - elegant display */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--foreground)] mb-3 leading-tight tracking-wide">
            {name1}
          </h1>
          <p className="font-script text-4xl md:text-5xl text-[var(--gold)] my-4">&</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--foreground)] leading-tight tracking-wide">
            {name2}
          </h1>
        </div>

        {/* Decorative flourish */}
        <div className="decorative-flourish mb-6" />

        {/* Walimatul Urus subtitle */}
        <p className="text-lg md:text-xl text-[var(--gold-dark)] tracking-[0.3em] uppercase font-light mb-2">
          Walimatul Urus
        </p>

        {weddingDate && (
          <p className="text-base md:text-lg text-gray-500 mb-8 tracking-wider">
            {weddingDate}
          </p>
        )}

        {/* Islamic Quote */}
        <div className="mb-10 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-[var(--champagne)] shadow-sm max-w-xl mx-auto">
          <p className="text-gray-600 italic text-sm md:text-base leading-relaxed font-light">
            &ldquo;And among His signs is that He created for you from yourselves mates
            that you may find tranquility in them; and He placed between you
            affection and mercy.&rdquo;
          </p>
          <p className="text-[var(--gold)] text-sm mt-3 font-medium tracking-wide">
            — Surah Ar-Rum (30:21)
          </p>
        </div>

        <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed font-light max-w-md mx-auto">
          Share your duas and beautiful moments with us.
          <br />
          <span className="text-[var(--rose-gold)]">May your blessings be written in our hearts forever.</span>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/submit"
            className="btn-primary inline-flex items-center gap-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Share Your Dua
          </Link>

          <Link
            href="/wall"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full border-2 border-[var(--gold)] text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-white transition-all duration-400 font-medium tracking-wider text-sm uppercase"
          >
            <svg
              className="w-5 h-5"
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
            View Blessings
          </Link>

          <Link
            href="/rsvp"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full border-2 border-[var(--rose-gold)] text-[var(--rose-gold)] hover:bg-[var(--rose-gold)] hover:text-white transition-all duration-400 font-medium tracking-wider text-sm uppercase"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            RSVP
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-gray-400 font-light tracking-wide">
          Barakallahu lakuma
        </p>
        <p className="text-xs text-gray-300 mt-1 italic">
          May Allah bless you both
        </p>
      </footer>
    </main>
  );
}
