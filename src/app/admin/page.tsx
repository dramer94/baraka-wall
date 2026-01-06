"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, Submission } from "@/lib/supabase";

interface MusicSettings {
  enabled: boolean;
  url: string;
  title: string;
}

interface RSVP {
  id: string;
  guest_name: string;
  email: string | null;
  phone: string | null;
  attendance: 'attending' | 'not_attending' | 'maybe';
  guest_count: number;
  dietary_restrictions: string | null;
  message: string | null;
  created_at: string;
}

interface RSVPStats {
  total: number;
  attending: number;
  notAttending: number;
  maybe: number;
  totalGuests: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    byTable: {} as Record<number, number>,
  });

  // Music settings state
  const [musicSettings, setMusicSettings] = useState<MusicSettings>({
    enabled: false,
    url: "",
    title: "",
  });
  const [savingMusic, setSavingMusic] = useState(false);
  const [musicSaved, setMusicSaved] = useState(false);

  // RSVP state
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [rsvpStats, setRsvpStats] = useState<RSVPStats>({
    total: 0,
    attending: 0,
    notAttending: 0,
    maybe: 0,
    totalGuests: 0,
  });
  const [deletingRsvp, setDeletingRsvp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'rsvp'>('submissions');

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_password", password);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Authentication failed");
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const submissions = data || [];
      setSubmissions(submissions);

      // Calculate stats
      const byTable: Record<number, number> = {};
      submissions.forEach((s: Submission) => {
        if (s.table_number) {
          byTable[s.table_number] = (byTable[s.table_number] || 0) + 1;
        }
      });

      setStats({
        total: data?.length || 0,
        byTable,
      });
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const deleteSubmission = async (submission: Submission) => {
    if (!confirm("Are you sure you want to delete this submission? This cannot be undone.")) {
      return;
    }

    setDeleting(submission.id);

    try {
      // Extract filename from URL
      const urlParts = submission.photo_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage.from("photos").remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submission.id);

      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        byTable: submission.table_number
          ? {
              ...prev.byTable,
              [submission.table_number]: prev.byTable[submission.table_number] - 1,
            }
          : prev.byTable,
      }));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete submission");
    } finally {
      setDeleting(null);
    }
  };

  const downloadAllPhotos = async () => {
    if (submissions.length === 0) {
      alert("No photos to download");
      return;
    }

    alert(
      "Download will start. Due to browser limitations, photos will be downloaded individually.\n\n" +
      "Tip: Create a folder to save them to!"
    );

    for (const submission of submissions) {
      try {
        const response = await fetch(submission.photo_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const guestName = submission.guest_name?.replace(/[^a-z0-9]/gi, "_") || "guest";
        const tableNum = submission.table_number ? `_table${submission.table_number}` : "";
        a.download = `memory_${guestName}${tableNum}_${submission.id.slice(0, 8)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error("Download error for", submission.id, err);
      }
    }
  };

  // Fetch music settings
  const fetchMusicSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/music");
      const data = await response.json();
      setMusicSettings(data);
    } catch (error) {
      console.error("Error fetching music settings:", error);
    }
  }, []);

  // Fetch RSVPs
  const fetchRsvps = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const response = await fetch(`/api/rsvp?password=${encodeURIComponent(storedPassword)}`);
      const data = await response.json();

      if (response.ok) {
        setRsvps(data.rsvps || []);
        setRsvpStats(data.stats || { total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 });
      }
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
    }
  }, [isAuthenticated, password]);

  // Delete RSVP
  const deleteRsvp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this RSVP?")) return;

    setDeletingRsvp(id);
    try {
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const response = await fetch(`/api/rsvp?password=${encodeURIComponent(storedPassword)}&id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRsvps((prev) => prev.filter((r) => r.id !== id));
        fetchRsvps(); // Refresh stats
      } else {
        alert("Failed to delete RSVP");
      }
    } catch (error) {
      console.error("Error deleting RSVP:", error);
      alert("Failed to delete RSVP");
    } finally {
      setDeletingRsvp(null);
    }
  };

  // Save music settings
  const saveMusicSettings = async () => {
    setSavingMusic(true);
    setMusicSaved(false);

    try {
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const response = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: storedPassword,
          ...musicSettings,
        }),
      });

      if (response.ok) {
        setMusicSaved(true);
        setTimeout(() => setMusicSaved(false), 3000);
      } else {
        alert("Failed to save music settings");
      }
    } catch (error) {
      console.error("Error saving music settings:", error);
      alert("Failed to save music settings");
    } finally {
      setSavingMusic(false);
    }
  };

  useEffect(() => {
    // Check if already authenticated in this session
    const cached = sessionStorage.getItem("admin_authenticated");
    if (cached === "true") {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    if (isAuthenticated) {
      fetchMusicSettings();
      fetchRsvps();
    }
  }, [fetchSubmissions, isAuthenticated, fetchMusicSettings, fetchRsvps]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--blush)] rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--blush)] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <svg
                className="w-12 h-12 mx-auto text-[var(--blush-dark)] mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Access</h1>
            <p className="text-gray-500 mt-2">Enter password to continue</p>
          </div>

          <form onSubmit={authenticate} className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--blush)]">
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {authError}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="input-wedding"
                autoFocus
                required
              />
            </div>

            <button type="submit" className="w-full btn-primary">
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-[var(--gold)] transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Admin Dashboard
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--blush)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <svg
                  className="w-8 h-8 text-[var(--blush-dark)]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage submissions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadAllPhotos}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--gold)] text-[var(--gold-dark)] text-sm hover:bg-[var(--gold)] hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download All</span>
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("admin_authenticated");
                  setIsAuthenticated(false);
                }}
                className="px-4 py-2 rounded-full text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/qr-generator"
            className="bg-white rounded-xl p-4 border border-[var(--blush)] hover:border-[var(--gold)] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                <svg className="w-5 h-5 text-[var(--gold)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-[var(--foreground)]">QR Generator</div>
                <div className="text-xs text-gray-500">Create table QR codes</div>
              </div>
            </div>
          </Link>

          <Link
            href="/wall"
            className="bg-white rounded-xl p-4 border border-[var(--blush)] hover:border-[var(--gold)] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                <svg className="w-5 h-5 text-[var(--gold)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-[var(--foreground)]">Blessings Wall</div>
                <div className="text-xs text-gray-500">View all submissions</div>
              </div>
            </div>
          </Link>

          <Link
            href="/submit"
            className="bg-white rounded-xl p-4 border border-[var(--blush)] hover:border-[var(--gold)] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                <svg className="w-5 h-5 text-[var(--gold)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-[var(--foreground)]">Submit Page</div>
                <div className="text-xs text-gray-500">Guest submission form</div>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="bg-white rounded-xl p-4 border border-[var(--blush)] hover:border-[var(--gold)] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                <svg className="w-5 h-5 text-[var(--gold)] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-[var(--foreground)]">Home Page</div>
                <div className="text-xs text-gray-500">Wedding landing page</div>
              </div>
            </div>
          </Link>

          <Link
            href="/rsvp"
            className="bg-white rounded-xl p-4 border border-[var(--blush)] hover:border-[var(--gold)] hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cream)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                <svg className="w-5 h-5 text-[var(--gold)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-[var(--foreground)]">RSVP Page</div>
                <div className="text-xs text-gray-500">Guest confirmation</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-[var(--gold)] text-white'
                : 'bg-white border border-[var(--blush)] text-gray-600 hover:border-[var(--gold)]'
            }`}
          >
            Photos & Messages ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('rsvp')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'rsvp'
                ? 'bg-[var(--gold)] text-white'
                : 'bg-white border border-[var(--blush)] text-gray-600 hover:border-[var(--gold)]'
            }`}
          >
            RSVPs ({rsvpStats.total})
          </button>
        </div>

        {/* RSVP Stats - show when RSVP tab active */}
        {activeTab === 'rsvp' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-[var(--blush)]">
              <div className="text-3xl font-bold text-[var(--gold)]">{rsvpStats.total}</div>
              <div className="text-sm text-gray-500">Total Responses</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-600">{rsvpStats.attending}</div>
              <div className="text-sm text-gray-500">Attending</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600">{rsvpStats.maybe}</div>
              <div className="text-sm text-gray-500">Maybe</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-gray-600">{rsvpStats.notAttending}</div>
              <div className="text-sm text-gray-500">Not Attending</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[var(--blush)]">
              <div className="text-3xl font-bold text-[var(--rose-gold)]">{rsvpStats.totalGuests}</div>
              <div className="text-sm text-gray-500">Total Guests</div>
            </div>
          </div>
        )}

        {/* Submission Stats - show when submissions tab active */}
        {activeTab === 'submissions' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-[var(--blush)]">
              <div className="text-3xl font-bold text-[var(--gold)]">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Submissions</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[var(--blush)]">
              <div className="text-3xl font-bold text-[var(--blush-dark)]">
                {Object.keys(stats.byTable).length}
              </div>
              <div className="text-sm text-gray-500">Tables Represented</div>
            </div>
            <div className="col-span-2 bg-white rounded-xl p-4 border border-[var(--blush)]">
              <div className="text-sm text-gray-500 mb-2">Submissions by Table</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byTable)
                  .filter(([, count]) => count > 0)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([table, count]) => (
                    <span
                      key={table}
                      className="px-2 py-1 bg-[var(--cream)] rounded-full text-xs text-gray-600"
                    >
                      Table {table}: {count}
                    </span>
                  ))}
                {Object.keys(stats.byTable).length === 0 && (
                  <span className="text-gray-400 text-sm">No table data yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Music Settings */}
        <div className="mb-8 bg-white rounded-xl p-6 border border-[var(--blush)]">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-[var(--blush-dark)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Background Music</h2>
          </div>

          <div className="space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMusicSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  musicSettings.enabled ? "bg-[var(--gold)]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    musicSettings.enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {musicSettings.enabled ? "Music enabled on wall page" : "Music disabled"}
              </span>
            </div>

            {/* Music URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Music URL (YouTube or MP3)
              </label>
              <input
                type="url"
                value={musicSettings.url}
                onChange={(e) => setMusicSettings(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... or https://example.com/song.mp3"
                className="input-wedding"
              />
              <p className="mt-1 text-xs text-gray-400">
                Paste a YouTube URL (youtube.com or youtu.be) or a direct MP3 link.
              </p>
            </div>

            {/* Music Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Song Title (optional)
              </label>
              <input
                type="text"
                value={musicSettings.title}
                onChange={(e) => setMusicSettings(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Our Wedding Song"
                className="input-wedding"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveMusicSettings}
                disabled={savingMusic}
                className="btn-primary !py-2 !px-6 disabled:opacity-50"
              >
                {savingMusic ? "Saving..." : "Save Music Settings"}
              </button>
              {musicSaved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RSVP List - show when RSVP tab active */}
        {activeTab === 'rsvp' && (
          <div className="space-y-4">
            {rsvps.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 mx-auto text-[var(--blush)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No RSVPs yet</h2>
                <p className="text-gray-500">Share your RSVP link with guests to start collecting responses.</p>
              </div>
            ) : (
              rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="bg-white rounded-xl p-4 border border-[var(--blush)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-[var(--foreground)]">{rsvp.guest_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rsvp.attendance === 'attending'
                            ? 'bg-green-100 text-green-700'
                            : rsvp.attendance === 'maybe'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rsvp.attendance === 'attending' && '✓ Attending'}
                          {rsvp.attendance === 'maybe' && '? Maybe'}
                          {rsvp.attendance === 'not_attending' && '✕ Not Attending'}
                        </span>
                        {rsvp.attendance === 'attending' && (
                          <span className="text-sm text-[var(--gold)]">
                            {rsvp.guest_count} {rsvp.guest_count === 1 ? 'guest' : 'guests'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {formatDate(rsvp.created_at)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        {rsvp.email && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {rsvp.email}
                          </span>
                        )}
                        {rsvp.phone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {rsvp.phone}
                          </span>
                        )}
                      </div>
                      {rsvp.dietary_restrictions && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="text-gray-400">Dietary:</span> {rsvp.dietary_restrictions}
                        </div>
                      )}
                      {rsvp.message && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          &ldquo;{rsvp.message}&rdquo;
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRsvp(rsvp.id)}
                      disabled={deletingRsvp === rsvp.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete RSVP"
                    >
                      {deletingRsvp === rsvp.id ? (
                        <div className="spinner !w-4 !h-4 !border-2 !border-red-200 !border-t-red-500" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Submissions List - show when submissions tab active */}
        {activeTab === 'submissions' && (loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-[var(--blush)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No submissions yet</h2>
            <p className="text-gray-500">Submissions will appear here once guests start sharing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-xl p-4 border border-[var(--blush)] flex flex-col sm:flex-row gap-4"
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-32 h-32 flex-shrink-0">
                  <img
                    src={submission.photo_url}
                    alt="Submission"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-[var(--gold-dark)]">
                        {submission.guest_name || "Anonymous Guest"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(submission.created_at)}
                        {submission.table_number && ` • Table ${submission.table_number}`}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSubmission(submission)}
                      disabled={deleting === submission.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete submission"
                    >
                      {deleting === submission.id ? (
                        <div className="spinner !w-4 !h-4 !border-2 !border-red-200 !border-t-red-500" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{submission.message}</p>
                  <div className="mt-2 text-xs text-gray-400 font-mono truncate">
                    ID: {submission.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
