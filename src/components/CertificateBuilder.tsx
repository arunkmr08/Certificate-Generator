import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Certificate Builder with selectable border styles

type BorderStyleKey = "classic" | "ornamental" | "guilloche" | "ribbon" | "minimal" | "artdeco";

export default function CertificateBuilder() {
  const certRef = useRef<HTMLDivElement | null>(null);

  // --- Form State ---
  const [recipientName, setRecipientName] = useState("Arun M");
  const [courseTitle, setCourseTitle] = useState("Product Requirements & Delivery Mastery");
  const [issuerName, setIssuerName] = useState("King Studios");
  const [instructorName, setInstructorName] = useState("Arun M");
  const [instructorTitle, setInstructorTitle] = useState("Principal Instructor");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [accent, setAccent] = useState("#2a6cea");
  const [borderStyle, setBorderStyle] = useState<BorderStyleKey>("classic");

  const certificateId = useMemo(() => {
    const dt = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `CERT-${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
  }, []);

  const verifyBase = import.meta.env.VITE_VERIFY_BASE_URL || `${window.location.origin}${import.meta.env.BASE_URL}verify`;
  const verifyUrl = useMemo(() => `${verifyBase}?cid=${certificateId}`, [certificateId, verifyBase]);
  const pdfPublicUrl = useMemo(
    () => `${window.location.origin}${import.meta.env.BASE_URL}certs/${encodeURIComponent(certificateId)}.pdf`,
    [certificateId]
  );

  // Helpers
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then(setLogoDataUrl);
  }
  function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then(setSignatureDataUrl);
  }
  async function handleDownloadPdf() {
    const node = certRef.current;
    if (!node) return;
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`Certificate-${recipientName.replace(/\s+/g, "_")}.pdf`);
  }

  // ---------------- Download Dialog (multi-format) ----------------
  type FormatKey =
    | "pdf-standard"
    | "pdf-optimized"
    | "png"
    | "jpeg"
    | "webp"
    | "html"
    | "json";

  const [showDownload, setShowDownload] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [assets, setAssets] = useState<Record<FormatKey, Blob | null>>({
    "pdf-standard": null,
    "pdf-optimized": null,
    png: null,
    jpeg: null,
    webp: null,
    html: null,
    json: null,
  });

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"] as const;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = bytes / Math.pow(k, i);
    return `${val.toFixed(val >= 100 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return true;
  }

  function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      }, type, quality);
    });
  }

  async function buildEstimates() {
    const node = certRef.current;
    if (!node) return;
    setEstimating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      // Capture two canvases: standard (higher scale) and optimized (lower scale)
      const [canvasStd, canvasOpt] = await Promise.all([
        html2canvas(node, { scale: 2.5, useCORS: true, backgroundColor: "#ffffff", logging: false }),
        html2canvas(node, { scale: 1.8, useCORS: true, backgroundColor: "#ffffff", logging: false }),
      ]);

      // Image blobs
      const pngBlob = await canvasToBlob(canvasStd, "image/png");
      const jpegBlob = await canvasToBlob(canvasStd, "image/jpeg", 0.9);
      let webpBlob: Blob | null = null;
      try {
        webpBlob = await canvasToBlob(canvasStd, "image/webp", 0.9);
      } catch {
        webpBlob = null; // Browser may not support WEBP encoding
      }

      // PDF blobs (standard uses PNG @2.5; optimized uses JPEG @1.8)
      const pdfStd = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      {
        const w = pdfStd.internal.pageSize.getWidth();
        const h = pdfStd.internal.pageSize.getHeight();
        const dataUrl = canvasStd.toDataURL("image/png");
        pdfStd.addImage(dataUrl, "PNG", 0, 0, w, h);
      }
      const pdfStdBlob: Blob = (pdfStd as unknown as { output: (t: "blob") => Blob }).output("blob");

      const pdfOpt = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      {
        const w = pdfOpt.internal.pageSize.getWidth();
        const h = pdfOpt.internal.pageSize.getHeight();
        const dataUrl = canvasOpt.toDataURL("image/jpeg", 0.82);
        pdfOpt.addImage(dataUrl, "JPEG", 0, 0, w, h);
      }
      const pdfOptBlob: Blob = (pdfOpt as unknown as { output: (t: "blob") => Blob }).output("blob");

      // HTML snapshot (raw outerHTML for the certificate container)
      const htmlDoc = `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Certificate</title><style>html,body{margin:0;padding:0;background:#fff}</style></head><body>${
        (node as HTMLElement).outerHTML
      }</body></html>`;
      const htmlBlob = new Blob([htmlDoc], { type: "text/html" });

      // JSON export of the form state
      const json = {
        recipientName,
        courseTitle,
        issuerName,
        instructorName,
        instructorTitle,
        startDate,
        completionDate,
        accent,
        borderStyle,
        certificateId,
        verifyUrl,
        logoDataUrl,
        signatureDataUrl,
      };
      const jsonBlob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });

      setAssets({
        "pdf-standard": pdfStdBlob,
        "pdf-optimized": pdfOptBlob,
        png: pngBlob,
        jpeg: jpegBlob,
        webp: webpBlob,
        html: htmlBlob,
        json: jsonBlob,
      });
    } finally {
      setEstimating(false);
    }
  }

  useEffect(() => {
    if (showDownload) {
      // Reset previous assets and estimate on open
      setAssets({
        "pdf-standard": null,
        "pdf-optimized": null,
        png: null,
        jpeg: null,
        webp: null,
        html: null,
        json: null,
      });
      // Kick off estimation asynchronously
      buildEstimates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDownload]);

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(completionDate);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return completionDate;
    }
  }, [completionDate]);

  const formattedStartDate = useMemo(() => {
    if (!startDate) return null;
    try {
      const d = new Date(startDate);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return startDate;
    }
  }, [startDate]);

  // Border Styles
  const borderStyles: Record<BorderStyleKey, React.CSSProperties> = {
    classic: {
      border: `10px double ${accent}`,
      background: "linear-gradient(180deg, #fff 0%, #fafbfe 100%)",
    },
    ornamental: {
      border: `8px double ${accent}`,
      borderRadius: "20px",
      backgroundImage: [
        `radial-gradient(circle at top left, ${accent}33 0 10px, transparent 11px)`,
        `radial-gradient(circle at top right, ${accent}33 0 10px, transparent 11px)`,
        `radial-gradient(circle at bottom left, ${accent}33 0 10px, transparent 11px)`,
        `radial-gradient(circle at bottom right, ${accent}33 0 10px, transparent 11px)`,
      ].join(","),
      backgroundRepeat: "no-repeat",
      backgroundPosition: "top left, top right, bottom left, bottom right",
      backgroundSize: "140px 140px, 140px 140px, 140px 140px, 140px 140px",
    },
    guilloche: {
      border: `6px solid ${accent}`,
      backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.05) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
    ribbon: {
      border: `10px solid ${accent}`,
      boxShadow: `inset 0 0 0 4px #fff, inset 0 0 0 8px ${accent}`,
    },
    minimal: {
      borderRadius: "24px",
      boxShadow: `0 0 0 6px ${accent}, 0 0 20px rgba(0,0,0,0.1)`,
    },
    artdeco: {
      border: `8px solid ${accent}`,
      backgroundImage: "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%)",
      backgroundSize: "20px 20px",
    },
  };

  // Visual picker with mini previews (6 in a row)
  const stylesList: ReadonlyArray<{ key: BorderStyleKey; label: string }> = [
    { key: "classic", label: "Classic" },
    { key: "ornamental", label: "Ornamental" },
    { key: "guilloche", label: "Guilloché" },
    { key: "ribbon", label: "Ribboned" },
    { key: "minimal", label: "Minimal" },
    { key: "artdeco", label: "Art Deco" },
  ] as const;

  const BorderStylePicker: React.FC<{ value: BorderStyleKey; onChange: (v: BorderStyleKey) => void }> = ({ value, onChange }) => (
    <div className="grid grid-cols-6 gap-2">
      {stylesList.map((s) => (
        <button
          type="button"
          key={s.key}
          onClick={() => onChange(s.key)}
          aria-pressed={value === s.key}
          className={`group rounded border p-1 text-[10px] transition ${
            value === s.key ? "ring-2 ring-neutral-800 border-neutral-800" : "border-neutral-300 hover:border-neutral-400"
          }`}
          title={s.label}
        >
          <div
            className="mb-1 h-10 w-full rounded bg-white"
            style={{ ...borderStyles[s.key], padding: "2px" }}
          />
          <div className="text-center truncate">{s.label}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Certificate Generator</h1>
          <div className="relative">
            <button
              onClick={() => setShowDownload((v) => !v)}
              className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
              aria-haspopup="menu"
              aria-expanded={showDownload}
            >
              Download
            </button>
            {showDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDownload(false)} />
                <div className="absolute right-0 z-50 mt-2 w-[24rem] max-w-[90vw] rounded-xl border bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Download Options</div>
                    <button
                      onClick={buildEstimates}
                      className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-100"
                    >
                      {estimating ? 'Estimating…' : 'Recalculate'}
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-1 gap-2">
                    <button
                      onClick={async () => { await copyToClipboard(verifyUrl); setShowDownload(false); }}
                      className="flex w-full items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium">Copy Verify Link</span>
                      <span className="text-xs text-neutral-500 truncate max-w-[50%]">{verifyUrl}</span>
                    </button>
                    <button
                      onClick={async () => { await copyToClipboard(pdfPublicUrl); setShowDownload(false); }}
                      className="flex w-full items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium">Copy Direct PDF Link</span>
                      <span className="text-xs text-neutral-500 truncate max-w-[50%]">{pdfPublicUrl}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {([
                      { key: 'pdf-standard', label: 'PDF Standard', ext: 'pdf' },
                      { key: 'pdf-optimized', label: 'PDF Optimized', ext: 'pdf' },
                      { key: 'png', label: 'PNG', ext: 'png' },
                      { key: 'jpeg', label: 'JPEG', ext: 'jpg' },
                      { key: 'webp', label: 'WEBP', ext: 'webp' },
                      { key: 'html', label: 'HTML', ext: 'html' },
                      { key: 'json', label: 'JSON', ext: 'json' },
                    ] as ReadonlyArray<{ key: FormatKey; label: string; ext: string }>).map((opt) => {
                      const blob = assets[opt.key];
                      const unsupported = opt.key === 'webp' && !blob && !estimating; // after estimate, if still null
                      const sizeText = blob ? formatBytes(blob.size) : estimating ? 'Calculating…' : unsupported ? 'N/A' : '—';
                      const fileName = `Certificate-${recipientName.replace(/\s+/g, '_')}.${opt.ext}`;
                      return (
                        <button
                          key={opt.key}
                          disabled={!blob}
                          onClick={() => blob && downloadBlob(blob, fileName)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${blob ? 'border-neutral-300 hover:bg-neutral-50' : 'border-neutral-200 text-neutral-400 cursor-not-allowed'}`}
                          role="menuitem"
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-neutral-500">{sizeText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="grid w-full grid-cols-1 gap-6 p-4 lg:grid-cols-12">
        {/* Left Controls */}
        <section className="lg:col-span-4">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span>Issuer / Organization Name</span>
                <input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Recipient Name</span>
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="col-span-2 grid gap-1 text-sm">
                <span>Course Title</span>
                <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Start Date (optional)</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Completion Date</span>
                <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Instructor Name</span>
                <input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Instructor Title</span>
                <input value={instructorTitle} onChange={(e) => setInstructorTitle(e.target.value)} className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Logo</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Signature</span>
                <input type="file" accept="image/*" onChange={handleSignatureChange} />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Accent Color</span>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
              </label>
              <div className="col-span-2 grid gap-1 text-sm">
                <span>Border Style</span>
                <BorderStylePicker value={borderStyle} onChange={setBorderStyle} />
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="lg:col-span-8">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Preview</h2>
            <div className="relative aspect-[1.414/1] w-full">
              <div
                ref={certRef}
                className="absolute inset-0 bg-white"
                style={{ padding: '6%' }}
              >
                <div className="h-full w-full bg-white" style={{ ...borderStyles[borderStyle], padding: '5%', boxSizing: 'border-box' }}>
                  <div className="flex h-full flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {logoDataUrl ? (
                        <img src={logoDataUrl} alt="Logo" className="h-12 w-auto object-contain" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: accent }}>LOGO</div>
                      )}
                      <div className="text-sm font-medium text-neutral-500">{issuerName}</div>
                    </div>
                    <div className="text-right text-[10px] text-neutral-500">
                      <div>Certificate ID: <span className="font-semibold text-neutral-700">{certificateId}</span></div>
                      <div>Verify: <span className="font-medium text-neutral-700">{verifyUrl}</span></div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mx-auto w-full max-w-[85%] text-center">
                    <div className="mx-auto mb-4 h-1 w-24" style={{ background: accent }} />
                    <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">Certificate of Completion</div>
                    <h3 className="mt-2 font-serif text-4xl font-bold leading-tight text-neutral-900">{recipientName}</h3>
                    <p className="mt-3 text-sm text-neutral-600">has successfully completed the course</p>
                    <p className="mt-2 font-serif text-2xl italic text-neutral-900">“{courseTitle}”</p>
                    <p className="mt-3 text-sm text-neutral-600">{formattedStartDate && `Started on ${formattedStartDate} and `}Completed on {formattedDate}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between">
                    <div className="w-[44%]">
                      <div className="h-14">{signatureDataUrl ? <img src={signatureDataUrl} alt="Signature" className="h-full w-auto object-contain" /> : <div className="h-full w-40 bg-neutral-100" />}</div>
                      <div className="mt-2 h-px w-48 bg-neutral-300" />
                      <div className="mt-1 text-xs font-medium text-neutral-800">{instructorName}</div>
                      <div className="text-[11px] text-neutral-500">{instructorTitle} • {issuerName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-[10px] text-neutral-500">
                        <div>Issued by {issuerName}</div>
                        <div>{formattedStartDate && `Start: ${formattedStartDate}, `}End: {formattedDate}</div>
                      </div>
                      <div className="rounded-xl border p-2"><QRCodeCanvas value={verifyUrl} size={72} includeMargin={false} /></div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      
    </div>
  );
}
