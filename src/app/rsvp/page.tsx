"use client";

import { useState } from "react";
import Link from "next/link";

type AttendanceStatus = "attending" | "not_attending" | "maybe";

export default function RSVPPage() {
  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "The Happy Couple";
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    guest_name: "",
    email: "",
    phone: "",
    attendance: "" as AttendanceStatus | "",
    guest_count: 1,
    dietary_restrictions: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleAttendanceSelect = (status: AttendanceStatus) => {
    setFormData((prev) => ({ ...prev, attendance: status }));
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>

          <h1 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
            {formData.attendance === "attending"
              ? "JazakAllahu Khairan!"
              : formData.attendance === "maybe"
              ? "Thank You!"
              : "We'll Miss You!"}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {formData.attendance === "attending" ? (
              <>
                We're so excited to celebrate with you, <span className="text-[var(--gold-dark)] font-medium">{formData.guest_name}</span>!
                <br />
                Your presence will make our special day even more blessed.
              </>
            ) : formData.attendance === "maybe" ? (
              <>
                Thank you for letting us know, <span className="text-[var(--gold-dark)] font-medium">{formData.guest_name}</span>.
                <br />
                We hope you can join us. Please update us when you know!
              </>
            ) : (
              <>
                We understand, <span className="text-[var(--gold-dark)] font-medium">{formData.guest_name}</span>.
                <br />
                Thank you for letting us know. You'll be in our duas.
              </>
            )}
          </p>

          {formData.attendance === "attending" && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-[var(--champagne)]">
              <p className="text-sm text-gray-500 mb-1">Number of guests confirmed</p>
              <p className="text-2xl font-semibold text-[var(--gold)]">{formData.guest_count}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--gold)] text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-white transition-all font-medium"
            >
              Share a Memory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <svg className="w-10 h-10 text-[var(--blush-dark)] mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </Link>

          <p className="text-xl md:text-2xl text-[var(--gold)] mb-3 font-arabic">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>

          <h1 className="font-script text-3xl md:text-4xl text-[var(--rose-gold)] mb-2">
            You're Invited
          </h1>

          <p className="text-lg text-[var(--foreground)] font-medium mb-1">
            {coupleName}
          </p>

          {weddingDate && (
            <p className="text-gray-500 text-sm">{weddingDate}</p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
            step >= 1 ? "bg-[var(--gold)] text-white" : "bg-gray-200 text-gray-500"
          }`}>
            1
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? "bg-[var(--gold)]" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
            step >= 2 ? "bg-[var(--gold)] text-white" : "bg-gray-200 text-gray-500"
          }`}>
            2
          </div>
        </div>

        {/* Step 1: Attendance Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-6">
              Will you be joining us for our special day?
            </p>

            <button
              onClick={() => handleAttendanceSelect("attending")}
              className="w-full p-5 rounded-xl border-2 border-[var(--blush)] bg-white hover:border-[var(--gold)] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--foreground)]">Alhamdulillah, I'll be there!</div>
                  <div className="text-sm text-gray-500">Count me in for the celebration</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAttendanceSelect("maybe")}
              className="w-full p-5 rounded-xl border-2 border-[var(--blush)] bg-white hover:border-[var(--gold)] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--foreground)]">InshaAllah, I'll try my best</div>
                  <div className="text-sm text-gray-500">Not sure yet, but I'll let you know</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAttendanceSelect("not_attending")}
              className="w-full p-5 rounded-xl border-2 border-[var(--blush)] bg-white hover:border-[var(--gold)] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-500 transition-colors">
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--foreground)]">Sorry, I can't make it</div>
                  <div className="text-sm text-gray-500">Will be thinking of you both</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-500 hover:text-[var(--gold)] transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Change response
            </button>

            {/* Selected attendance badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              formData.attendance === "attending"
                ? "bg-green-100 text-green-700"
                : formData.attendance === "maybe"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {formData.attendance === "attending" && "✓ Attending"}
              {formData.attendance === "maybe" && "? Maybe"}
              {formData.attendance === "not_attending" && "✕ Not Attending"}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Guest Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.guest_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, guest_name: e.target.value }))}
                placeholder="Enter your full name"
                className="input-wedding"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="input-wedding"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+60 12-345 6789"
                className="input-wedding"
              />
            </div>

            {/* Guest Count - only for attending */}
            {formData.attendance === "attending" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests (including yourself)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, guest_count: Math.max(1, prev.guest_count - 1) }))}
                    className="w-10 h-10 rounded-full border-2 border-[var(--blush)] flex items-center justify-center hover:border-[var(--gold)] transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                    </svg>
                  </button>
                  <span className="text-2xl font-semibold text-[var(--gold)] w-12 text-center">
                    {formData.guest_count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, guest_count: Math.min(10, prev.guest_count + 1) }))}
                    className="w-10 h-10 rounded-full border-2 border-[var(--blush)] flex items-center justify-center hover:border-[var(--gold)] transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Dietary Restrictions - only for attending */}
            {formData.attendance === "attending" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Requirements (optional)
                </label>
                <input
                  type="text"
                  value={formData.dietary_restrictions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dietary_restrictions: e.target.value }))}
                  placeholder="e.g., Vegetarian, allergies, etc."
                  className="input-wedding"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message for the Couple (optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Share your duas or well-wishes..."
                rows={3}
                className="input-wedding resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !formData.guest_name}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner !w-5 !h-5" />
                  Submitting...
                </span>
              ) : (
                "Confirm RSVP"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 font-light tracking-wide">
            Barakallahu lakuma
          </p>
          <p className="text-xs text-gray-300 mt-1 italic">
            May Allah bless you both
          </p>
        </div>
      </div>
    </main>
  );
}
