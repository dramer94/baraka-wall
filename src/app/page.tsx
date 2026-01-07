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

// Format date to Malay
function formatMalayDate(dateStr: string): string {
  const days = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun",
    "Julai", "Ogos", "September", "Oktober", "November", "Disember"
  ];

  const date = new Date(dateStr);
  const day = days[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}, ${dateNum} ${month} ${year}`;
}

export default function Home() {
  // Environment variables
  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "Pengantin Lelaki & Pengantin Perempuan";
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "2026-05-01";
  const weddingTime = process.env.NEXT_PUBLIC_WEDDING_TIME || "11:00";
  const venueName = process.env.NEXT_PUBLIC_VENUE_NAME || "Dewan Perkahwinan";
  const venueAddress = process.env.NEXT_PUBLIC_VENUE_ADDRESS || "Alamat akan dikemaskini";
  const venueMapsUrl = process.env.NEXT_PUBLIC_VENUE_MAPS_URL || "";
  const venueWazeUrl = process.env.NEXT_PUBLIC_VENUE_WAZE_URL || "";
  const contactPhone1 = process.env.NEXT_PUBLIC_CONTACT_PHONE_1 || "";
  const contactPhone2 = process.env.NEXT_PUBLIC_CONTACT_PHONE_2 || "";
  const contactName1 = process.env.NEXT_PUBLIC_CONTACT_NAME_1 || "Wakil Keluarga 1";
  const contactName2 = process.env.NEXT_PUBLIC_CONTACT_NAME_2 || "Wakil Keluarga 2";
  const dressCode = process.env.NEXT_PUBLIC_DRESS_CODE || "";
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "";
  const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || "";
  const bankHolder = process.env.NEXT_PUBLIC_BANK_HOLDER || "";

  // Music state
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  // Countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Copy state for bank account
  const [copied, setCopied] = useState(false);

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

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date(`${weddingDate}T${weddingTime}:00`).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [weddingDate, weddingTime]);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split couple name for elegant display
  const names = coupleName.split("&").map((n) => n.trim());
  const name1 = names[0] || "";
  const name2 = names[1] || "";

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Elegant background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

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
              Selamat Datang
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Mainkan muzik latar belakang?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowMusicPrompt(false)}
                className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Tidak
              </button>
              <button
                onClick={startMusic}
                className="btn-primary !py-2.5 !px-6 !text-sm"
              >
                Main Muzik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio/YouTube player */}
      {musicEnabled && hasInteracted && (
        <>
          {isYouTubeUrl(musicUrl) ? (
            <div className="fixed bottom-20 right-4 z-30 w-[200px] h-[112px] rounded-lg overflow-hidden shadow-lg border-2 border-white/50 bg-black">
              <iframe
                ref={youtubeRef}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(musicUrl)}?enablejsapi=1&autoplay=1&loop=1&playlist=${getYouTubeVideoId(musicUrl)}&playsinline=1`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title="Background Music"
              />
            </div>
          ) : (
            <audio ref={audioRef} src={musicUrl} loop autoPlay />
          )}
        </>
      )}

      {/* Music control button */}
      {musicEnabled && hasInteracted && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-white shadow-lg border border-[var(--blush)] flex items-center justify-center hover:shadow-xl transition-all duration-300"
          title={isPlaying ? "Pause" : "Play"}
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

      {/* Main Content */}
      <div className="relative z-10 px-4 py-12">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          {/* Bismillah */}
          <p className="text-2xl md:text-3xl text-[var(--gold)] mb-4 font-arabic leading-relaxed">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>

          {/* Ornamental divider */}
          <div className="ornament mb-6">✦ ✦ ✦</div>

          {/* Malay Formal Greeting */}
          <div className="mb-8 px-4">
            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4">
              Dengan penuh kesyukuran, kami mempersilakan
            </p>
            <p className="text-sm md:text-base text-[var(--gold)] mb-4 font-medium">
              Dato&apos; Sri | Datin Sri | Dato&apos; | Datin | Tuan | Puan | Encik | Cik
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              seisi keluarga hadir ke majlis perkahwinan anakanda kami
            </p>
          </div>

          {/* Walimatul Urus subtitle */}
          <p className="font-script text-3xl md:text-4xl text-[var(--rose-gold)] mb-4">
            Walimatul Urus
          </p>

          {/* Couple names - elegant display */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--foreground)] mb-3 leading-tight tracking-wide">
              {name1}
            </h1>
            <p className="font-script text-4xl md:text-5xl text-[var(--gold)] my-4">&</p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--foreground)] leading-tight tracking-wide">
              {name2}
            </h1>
          </div>

          {/* Decorative flourish */}
          <div className="decorative-flourish mb-8" />

          {/* Date Display */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-[var(--gold-dark)] font-medium tracking-wide">
              {formatMalayDate(weddingDate)}
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="mb-12">
            <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Menghitung Hari</p>
            <div className="flex justify-center gap-3 md:gap-6">
              {[
                { value: countdown.days, label: "Hari" },
                { value: countdown.hours, label: "Jam" },
                { value: countdown.minutes, label: "Minit" },
                { value: countdown.seconds, label: "Saat" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-[var(--gold)]/30 flex items-center justify-center shadow-sm">
                    <span className="text-2xl md:text-3xl font-bold text-[var(--gold)]">
                      {item.value.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-2 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-[var(--gold)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Event Details Section */}
        <section className="py-16 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Butiran Majlis</p>
            <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Tarikh & Lokasi</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[var(--champagne)] shadow-sm">
            {/* Date & Time */}
            <div className="text-center mb-6 pb-6 border-b border-[var(--blush)]">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-medium text-[var(--foreground)]">{formatMalayDate(weddingDate)}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">{weddingTime} pagi</span>
              </div>
            </div>

            {/* Venue */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="w-5 h-5 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg font-medium text-[var(--foreground)]">{venueName}</span>
              </div>
              <p className="text-gray-600 text-sm">{venueAddress}</p>
            </div>

            {/* Direction Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {venueMapsUrl && (
                <a
                  href={venueMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#4285F4] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Google Maps
                </a>
              )}
              {venueWazeUrl && (
                <a
                  href={venueWazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#33CCFF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Waze
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Tentative/Schedule Section */}
        <section className="py-16 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Aturcara Majlis</p>
            <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Tentative</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--gold)]/30" />

            {/* Timeline items */}
            {[
              { time: "11:00", title: "Majlis Bermula", desc: "Ketibaan tetamu" },
              { time: "12:00", title: "Ketibaan Pengantin", desc: "Pengantin tiba di dewan" },
              { time: "12:30", title: "Jamuan Makan", desc: "Makan beradab / Buffet" },
              { time: "14:00", title: "Sesi Bergambar", desc: "Bergambar bersama tetamu" },
              { time: "15:00", title: "Majlis Bersurai", desc: "Terima kasih atas kehadiran" },
            ].map((item, index) => (
              <div key={index} className="relative flex gap-6 mb-8 last:mb-0">
                {/* Circle */}
                <div className="w-16 flex-shrink-0 flex items-start justify-center">
                  <div className="w-4 h-4 rounded-full bg-[var(--gold)] border-4 border-white shadow-sm z-10" />
                </div>
                {/* Content */}
                <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--champagne)]">
                  <p className="text-sm text-[var(--gold)] font-medium mb-1">{item.time}</p>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dress Code Section */}
        {dressCode && (
          <section className="py-16 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Kod Pakaian</p>
              <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Dress Code</h2>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[var(--champagne)] shadow-sm text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#D4A5A5]" title="Dusty Pink" />
                <span className="text-2xl text-[var(--gold)]">&</span>
                <div className="w-12 h-12 rounded-full bg-[var(--gold)]" title="Gold" />
              </div>
              <p className="text-lg font-medium text-[var(--foreground)] mb-2">{dressCode}</p>
              <p className="text-sm text-gray-500">
                Sila hadir dengan pakaian kemas mengikut tema warna
              </p>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {(contactPhone1 || contactPhone2) && (
          <section className="py-16 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Sebarang Pertanyaan</p>
              <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Hubungi Kami</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {contactPhone1 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--champagne)] shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-2">{contactName1}</p>
                  <a
                    href={`tel:${contactPhone1}`}
                    className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--gold)] transition-colors"
                  >
                    {contactPhone1}
                  </a>
                  <div className="mt-4">
                    <a
                      href={`https://wa.me/${contactPhone1.replace(/[^0-9]/g, "")}?text=Assalamualaikum, saya ingin bertanya mengenai majlis perkahwinan...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
              {contactPhone2 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--champagne)] shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-2">{contactName2}</p>
                  <a
                    href={`tel:${contactPhone2}`}
                    className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--gold)] transition-colors"
                  >
                    {contactPhone2}
                  </a>
                  <div className="mt-4">
                    <a
                      href={`https://wa.me/${contactPhone2.replace(/[^0-9]/g, "")}?text=Assalamualaikum, saya ingin bertanya mengenai majlis perkahwinan...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gift/Salam Kaut Section */}
        {bankAccount && (
          <section className="py-16 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Salam Kaut</p>
              <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Hadiah & Sumbangan</h2>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[var(--champagne)] shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-4">
                Doa restu anda amat kami hargai. Sekiranya tuan/puan ingin memberikan sumbangan:
              </p>

              <div className="bg-[var(--cream)] rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">{bankName}</p>
                <p className="text-xl font-mono font-bold text-[var(--foreground)] mb-1">{bankAccount}</p>
                <p className="text-sm text-gray-600">{bankHolder}</p>
              </div>

              <button
                onClick={() => copyToClipboard(bankAccount)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--gold)] text-[var(--gold-dark)] text-sm font-medium hover:bg-[var(--gold)] hover:text-white transition-all"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Disalin!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Salin No. Akaun
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Action Buttons Section */}
        <section className="py-16 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-[var(--gold)] uppercase tracking-widest mb-2">Tindakan</p>
            <h2 className="font-script text-3xl md:text-4xl text-[var(--foreground)]">Jangan Lupa</h2>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/rsvp"
              className="btn-primary inline-flex items-center justify-center gap-3 w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sahkan Kehadiran (RSVP)
            </Link>

            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full border-2 border-[var(--gold)] text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-white transition-all duration-400 font-medium tracking-wider text-sm uppercase w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kongsi Ucapan & Gambar
            </Link>

            <Link
              href="/wall"
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full border-2 border-[var(--rose-gold)] text-[var(--rose-gold)] hover:bg-[var(--rose-gold)] hover:text-white transition-all duration-400 font-medium tracking-wider text-sm uppercase w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lihat Ucapan Tetamu
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center">
          <div className="ornament mb-4">✦ ✦ ✦</div>
          <p className="text-lg text-[var(--gold)] font-arabic mb-2">
            بَارَكَ اللهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
          </p>
          <p className="text-sm text-gray-500 italic mb-4">
            &ldquo;Semoga Allah memberkati kamu berdua, melimpahkan keberkatan ke atas kamu<br/>
            dan menyatukan kamu berdua dalam kebaikan.&rdquo;
          </p>
          <p className="text-xs text-gray-400">
            Terima kasih atas doa dan kehadiran anda
          </p>
        </footer>
      </div>
    </main>
  );
}
