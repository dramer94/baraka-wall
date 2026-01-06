"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

export default function QRGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [tableCount, setTableCount] = useState(10);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [includeGeneral, setIncludeGeneral] = useState(true);
  const qrRefs = useRef<(HTMLDivElement | null)[]>([]);

  const coupleName = process.env.NEXT_PUBLIC_COUPLE_NAMES || "The Happy Couple";

  // Auto-detect base URL on client side
  useState(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.origin}/submit`);
    }
  });

  const getSubmitUrl = (tableNumber?: number) => {
    if (tableNumber) {
      return `${baseUrl}?table=${tableNumber}`;
    }
    return baseUrl;
  };

  const toggleTable = (table: number) => {
    setSelectedTables((prev) =>
      prev.includes(table)
        ? prev.filter((t) => t !== table)
        : [...prev, table]
    );
  };

  const selectAllTables = () => {
    const allTables = Array.from({ length: tableCount }, (_, i) => i + 1);
    setSelectedTables(allTables);
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  const downloadQR = useCallback((element: HTMLDivElement | null, filename: string) => {
    if (!element) return;

    const canvas = element.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const downloadSelected = async () => {
    const toDownload: { index: number; label: string }[] = [];

    if (includeGeneral) {
      toDownload.push({ index: 0, label: "general" });
    }

    selectedTables.forEach((table) => {
      toDownload.push({ index: table, label: `table_${table}` });
    });

    for (const { index, label } of toDownload) {
      downloadQR(qrRefs.current[index], `qr_${label}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  const printSelected = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print QR codes");
      return;
    }

    const qrCodes: { label: string; dataUrl: string }[] = [];

    if (includeGeneral) {
      const canvas = qrRefs.current[0]?.querySelector("canvas");
      if (canvas) {
        qrCodes.push({ label: "General", dataUrl: canvas.toDataURL() });
      }
    }

    selectedTables.forEach((table) => {
      const canvas = qrRefs.current[table]?.querySelector("canvas");
      if (canvas) {
        qrCodes.push({ label: `Table ${table}`, dataUrl: canvas.toDataURL() });
      }
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${coupleName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Lato:wght@400&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Lato', sans-serif;
          }

          .page {
            width: 100%;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            min-height: 100vh;
          }

          .page:last-child {
            page-break-after: avoid;
          }

          .qr-container {
            text-align: center;
            padding: 40px;
            border: 3px solid #E8B4B8;
            border-radius: 20px;
            background: linear-gradient(135deg, #FFF9F5 0%, #FAF7F2 100%);
          }

          .heart {
            width: 40px;
            height: 40px;
            margin: 0 auto 20px;
          }

          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            color: #3D3D3D;
            margin-bottom: 8px;
          }

          .couple-name {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #A68A3E;
            margin-bottom: 24px;
          }

          .qr-code {
            margin: 24px 0;
          }

          .qr-code img {
            width: 250px;
            height: 250px;
          }

          .table-label {
            font-size: 24px;
            font-weight: 600;
            color: #C9A959;
            margin-bottom: 16px;
          }

          .instructions {
            font-size: 14px;
            color: #666;
            margin-top: 16px;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${qrCodes.map((qr) => `
          <div class="page">
            <div class="qr-container">
              <svg class="heart" viewBox="0 0 24 24" fill="#E8B4B8">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h1>Share a Memory</h1>
              <div class="couple-name">${coupleName}</div>
              <div class="table-label">${qr.label}</div>
              <div class="qr-code">
                <img src="${qr.dataUrl}" alt="QR Code" />
              </div>
              <div class="instructions">
                Scan to share photos & wishes
              </div>
            </div>
          </div>
        `).join("")}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <main className="min-h-screen relative">
      {/* Background */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-[var(--blush)] rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[var(--blush)] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--blush)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
                <h1 className="text-xl font-bold text-[var(--foreground)]">QR Code Generator</h1>
                <p className="text-sm text-gray-500">Create QR codes for each table</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--blush)] mb-8">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://yourdomain.com/submit"
                className="input-wedding"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is auto-detected, but you can change it if needed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-wedding"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="includeGeneral"
              checked={includeGeneral}
              onChange={(e) => setIncludeGeneral(e.target.checked)}
              className="w-4 h-4 text-[var(--gold)] border-[var(--blush)] rounded focus:ring-[var(--gold)]"
            />
            <label htmlFor="includeGeneral" className="text-sm text-gray-700">
              Include general QR code (no table number)
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllTables}
              className="px-3 py-1.5 text-sm border border-[var(--gold)] text-[var(--gold-dark)] rounded-lg hover:bg-[var(--cream)] transition-colors"
            >
              Select All Tables
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
            <div className="flex-1" />
            <button
              onClick={downloadSelected}
              disabled={!includeGeneral && selectedTables.length === 0}
              className="px-4 py-1.5 text-sm bg-[var(--gold)] text-white rounded-lg hover:bg-[var(--gold-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG
            </button>
            <button
              onClick={printSelected}
              disabled={!includeGeneral && selectedTables.length === 0}
              className="px-4 py-1.5 text-sm border border-[var(--gold)] text-[var(--gold-dark)] rounded-lg hover:bg-[var(--gold)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* General QR */}
          {includeGeneral && (
            <div
              ref={(el) => { qrRefs.current[0] = el; }}
              className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                includeGeneral
                  ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/20"
                  : "border-[var(--blush)]"
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-medium text-[var(--gold-dark)] mb-3">
                  General
                </div>
                <QRCodeCanvas
                  value={getSubmitUrl()}
                  size={140}
                  level="M"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#3D3D3D"
                />
                <div className="mt-3 text-xs text-gray-400 truncate">
                  {getSubmitUrl()}
                </div>
              </div>
            </div>
          )}

          {/* Table QR codes */}
          {Array.from({ length: tableCount }, (_, i) => i + 1).map((table) => (
            <div
              key={table}
              ref={(el) => { qrRefs.current[table] = el; }}
              onClick={() => toggleTable(table)}
              className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedTables.includes(table)
                  ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/20"
                  : "border-[var(--blush)] hover:border-[var(--blush-dark)]"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={() => toggleTable(table)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-[var(--gold)] border-[var(--blush)] rounded focus:ring-[var(--gold)]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Table {table}
                  </span>
                </div>
                <QRCodeCanvas
                  value={getSubmitUrl(table)}
                  size={140}
                  level="M"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#3D3D3D"
                />
                <div className="mt-3 text-xs text-gray-400 truncate">
                  ?table={table}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-[var(--cream)] rounded-xl p-6 border border-[var(--blush)]">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Set your website URL and number of tables above</li>
            <li>Select the table QR codes you want to generate</li>
            <li>Click &quot;Print&quot; to print QR codes on cards, or &quot;Download&quot; to save as images</li>
            <li>Place one QR code card on each table at the venue</li>
            <li>Guests scan the code to share photos and messages</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
