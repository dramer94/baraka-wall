"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

type CameraFacing = "user" | "environment";

function SubmitForm() {
  const searchParams = useSearchParams();
  const tableFromUrl = searchParams.get("table");

  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [tableNumber, setTableNumber] = useState(tableFromUrl || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "The Happy Couple";

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const startCamera = useCallback(async (facing: CameraFacing = "environment") => {
    try {
      setCameraError(null);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setShowCamera(true);
      setCameraFacing(facing);
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setCameraError("Camera access denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError("Unable to access camera. Please try uploading a photo instead.");
        }
      }
    }
  }, []);

  const switchCamera = useCallback(() => {
    const newFacing = cameraFacing === "environment" ? "user" : "environment";
    startCamera(newFacing);
  }, [cameraFacing, startCamera]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if using front camera
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          setPhoto(file);
          setPhotoPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [cameraFacing, stopCamera]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [photoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo) {
      alert("Please add a photo to share your memory!");
      return;
    }

    if (!message.trim()) {
      alert("Please write a message or wish for the couple!");
      return;
    }

    setIsUploading(true);

    try {
      // Compress the image before upload (keeps quality good, reduces upload time)
      const compressedFile = await imageCompression(photo, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.9,
      });

      // Upload to Cloudinary via our API route
      const formData = new FormData();
      formData.append("file", compressedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Insert submission record to Supabase (database only)
      const { error: dbError } = await supabase.from("submissions").insert({
        guest_name: guestName.trim() || null,
        message: message.trim(),
        photo_url: photoUrl,
        table_number: tableNumber ? parseInt(tableNumber, 10) : null,
      });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Show success
      setShowSuccess(true);

    } catch (err) {
      console.error("Submit error:", err);
      alert(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (showSuccess) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 text-center max-w-md mx-auto animate-fade-in-up">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--sage)] to-[#7a9a6a] flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <p className="font-script text-3xl text-[var(--gold)] mb-2">
            JazakAllahu Khairan
          </p>

          <h1 className="text-2xl md:text-3xl font-medium text-[var(--foreground)] mb-4 tracking-wide">
            Your Blessing Has Been Sent
          </h1>

          <p className="text-gray-500 mb-4 font-light">
            Your dua and blessings have been shared with the couple.
          </p>

          <p className="text-[var(--rose-gold)] italic mb-8 text-sm">
            May Allah accept your prayers and bless this union.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setShowSuccess(false);
                setGuestName("");
                setMessage("");
                removePhoto();
              }}
              className="btn-primary"
            >
              Share Another Blessing
            </button>
            <Link
              href="/wall"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--gold)] text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-white transition-all duration-300 text-sm uppercase tracking-wider font-medium"
            >
              View Blessings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 relative">
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[var(--champagne)] to-[var(--blush)] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <div className="ornament text-lg">✦</div>
          </Link>
          <p className="font-script text-2xl text-[var(--rose-gold)] mb-2">
            Share Your
          </p>
          <h1 className="text-2xl md:text-3xl font-medium text-[var(--foreground)] mb-3 tracking-wide">
            Dua & Blessings
          </h1>
          <div className="decorative-line mb-4" />
          <p className="text-gray-500 text-sm font-light">
            Send your prayers and beautiful moments to the newlyweds
          </p>
        </div>

        {/* Camera View */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`flex-1 object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-8">
              <button
                onClick={stopCamera}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/50"
              >
                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-200" />
              </button>

              <button
                onClick={switchCamera}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-[var(--champagne)]">
            <label className="block text-sm font-medium text-gray-600 mb-3 tracking-wide">
              Photo <span className="text-[var(--rose-gold)]">*</span>
            </label>

            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cameraError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {cameraError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => startCamera("environment")}
                    className="flex flex-col items-center justify-center gap-3 p-6 border border-dashed border-[var(--champagne)] rounded-xl hover:border-[var(--gold)] hover:bg-[var(--cream)] transition-all duration-300"
                  >
                    <svg className="w-8 h-8 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-6 border border-dashed border-[var(--champagne)] rounded-xl hover:border-[var(--gold)] hover:bg-[var(--cream)] transition-all duration-300"
                  >
                    <svg className="w-8 h-8 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Photo</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-[var(--champagne)]">
            <label htmlFor="message" className="block text-sm font-medium text-gray-600 mb-3 tracking-wide">
              Your Dua & Wishes <span className="text-[var(--rose-gold)]">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Share your duas, blessings, or words of wisdom for the couple..."
              rows={4}
              className="input-wedding resize-none"
              required
            />
            <div className="mt-2 text-right text-xs text-gray-400 tracking-wide">
              {message.length}/500
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-[var(--champagne)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
                  Your Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="How would you like to sign this?"
                  className="input-wedding"
                />
              </div>

              <div>
                <label htmlFor="table" className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
                  Table Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="table"
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., 5"
                  className="input-wedding"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !photo || !message.trim()}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <div className="spinner !w-5 !h-5 !border-2" />
                <span>Sending Blessings...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Send Your Dua</span>
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-[var(--gold)] transition-colors uppercase tracking-wider">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </main>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubmitForm />
    </Suspense>
  );
}
