import React, { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";

// Certificate Builder with selectable border styles

export default function CertificateBuilder() {
  const certRef = useRef(null);

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
  const [borderStyle, setBorderStyle] = useState("classic");

  const certificateId = useMemo(() => {
    const dt = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `CERT-${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
  }, []);

  const verifyUrl = useMemo(() => `https://example.org/verify?cid=${certificateId}`, [certificateId]);

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
    const node = certRef.current as unknown as HTMLElement | null;
    if (!node) return;
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
  const borderStyles: Record<string, React.CSSProperties> = {
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
  const stylesList = [
    { key: "classic", label: "Classic" },
    { key: "ornamental", label: "Ornamental" },
    { key: "guilloche", label: "Guilloché" },
    { key: "ribbon", label: "Ribboned" },
    { key: "minimal", label: "Minimal" },
    { key: "artdeco", label: "Art Deco" },
  ] as const;

  const BorderStylePicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
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
            style={{ ...(borderStyles as any)[s.key], padding: "2px" }}
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
          <button
            onClick={handleDownloadPdf}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Download PDF
          </button>
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
              <div ref={certRef} className="absolute inset-2 sm:inset-4 md:inset-6 bg-white" style={{ padding: "16px", ...borderStyles[borderStyle] }}>
                <div className="flex h-full flex-col justify-between p-4 sm:p-6">
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
        </section>
      </main>
    </div>
  );
}
