"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useCart } from "@/context/CartContext";
import type { DesignWithVariants } from "@/types";

const SIZE_PREFERENCE = ["M", "L", "S", "XL"];

function getRecommendedVariant(design: DesignWithVariants | undefined) {
  const available = design?.variants.filter((variant) => variant.stock > 0) ?? [];
  return SIZE_PREFERENCE.map((size) => available.find((variant) => variant.size === size)).find(
    (variant) => variant !== undefined
  ) ?? available[0];
}

export default function FloatingTryOn({ designs }: { designs: DesignWithVariants[] }) {
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(designs[0]?.id ?? "");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const isOpenRef = useRef(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const design = designs.find((item) => item.id === selectedId) ?? designs[0];
  const recommendedVariant = getRecommendedVariant(design);
  const garmentImage = design?.images[0];

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    return () => {
      if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => {
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function stopCamera() {
    const activeStream = streamRef.current;
    streamRef.current = null;
    activeStream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }

  function openDrawer() {
    isOpenRef.current = true;
    setMessage("");
    setIsOpen(true);
  }

  function closeDrawer() {
    isOpenRef.current = false;
    cameraRequestRef.current += 1;
    stopCamera();
    setCameraBusy(false);
    setIsOpen(false);
  }

  async function startCamera() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera access is not available in this browser. You can upload a photo instead.");
      return;
    }

    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;
    setCameraBusy(true);
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!isOpenRef.current || cameraRequestRef.current !== requestId) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stopCamera();
      streamRef.current = cameraStream;
      setStream(cameraStream);
      setSnapshot("");
    } catch {
      if (isOpenRef.current && cameraRequestRef.current === requestId) {
        setMessage("Camera access was denied or unavailable. Check your browser permissions or upload a photo.");
      }
    } finally {
      setCameraBusy(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setMessage("The camera is still starting. Try capturing again in a moment.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        setMessage("Could not capture a photo. Please try again.");
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
      stopCamera();
      setMessage("");
    } catch {
      setMessage("Could not capture a photo. Please try again.");
    }
  }

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file to continue.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setMessage("Could not read that photo. Please try another image.");
        return;
      }
      stopCamera();
      setSnapshot(reader.result);
      setMessage("");
    };
    reader.onerror = () => setMessage("Could not read that photo. Please try another image.");
    reader.readAsDataURL(file);
  }

  function addRecommendedSize() {
    if (!design || !recommendedVariant || !garmentImage) {
      setMessage("This garment is currently unavailable.");
      return;
    }
    addItem({
      designId: design.id,
      variantId: recommendedVariant.id,
      slug: design.slug,
      name: design.name,
      size: recommendedVariant.size,
      image: garmentImage,
      price: design.price,
      quantity: 1,
      stock: recommendedVariant.stock
    });
    setMessage(`${design.name} in size ${recommendedVariant.size} added to your bag.`);
  }

  return (
    <>
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close AI try-on"
            className="fixed inset-0 z-40 cursor-default bg-black/25"
            onClick={closeDrawer}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-try-on-title"
            className="fixed bottom-24 right-4 z-50 flex max-h-[calc(100vh-7.5rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden border border-white/15 bg-[#111110] text-[#f4f1eb] shadow-2xl sm:right-6"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/15 px-5 py-4">
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-[#aaa8a1]">The fitting room</p>
                <h2 id="floating-try-on-title" className="text-xl font-medium tracking-[-0.05em]">AI Virtual Try-On</h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close try-on"
                className="grid h-8 w-8 place-items-center text-xl text-[#aaa8a1] transition hover:text-white"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto p-5">
              {designs.length > 0 ? (
                <label className="mb-3 block text-[9px] uppercase tracking-[0.16em] text-[#aaa8a1]">
                  Choose a garment
                  <select
                    value={design?.id ?? ""}
                    onChange={(event) => {
                      setSelectedId(event.target.value);
                      setMessage("");
                    }}
                    className="mt-2 block h-10 w-full border border-white/20 bg-[#1d1d1b] px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-[#d2ff3a]"
                  >
                    {designs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              ) : (
                <p className="mb-3 text-xs text-[#aaa8a1]">No garments are available to try on right now.</p>
              )}

              <div className="relative aspect-[4/3] overflow-hidden bg-[#222220]">
                {snapshot ? (
                  <img src={snapshot} alt="Your photo for the virtual try-on" className="h-full w-full object-cover" />
                ) : stream ? (
                  <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-[#aaa8a1]">
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-9 w-9 fill-none stroke-current" strokeWidth="1">
                      <rect x="5" y="12" width="38" height="27" rx="2" />
                      <circle cx="24" cy="25" r="8" />
                      <path d="m15 12 3-5h12l3 5" />
                    </svg>
                    <p className="text-[11px] leading-5">Turn on your camera or upload a photo to preview a look.</p>
                  </div>
                )}

                {(stream || snapshot) && garmentImage && (
                  <svg
                    role="img"
                    aria-label={`Simulated ${design.name} garment preview`}
                    viewBox="0 0 320 400"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    <defs>
                      <pattern id="floating-try-on-garment" patternUnits="userSpaceOnUse" width="320" height="400">
                        <image href={garmentImage} width="320" height="400" preserveAspectRatio="xMidYMid slice" />
                      </pattern>
                      <clipPath id="floating-try-on-shape">
                        <path d="m102 82 35-20h46l35 20 53 38-28 43-30-19v170H87V144l-30 19-28-43 53-38 20-8Z" />
                      </clipPath>
                    </defs>
                    <path
                      d="m102 82 35-20h46l35 20 53 38-28 43-30-19v170H87V144l-30 19-28-43 53-38 20-8Z"
                      fill="url(#floating-try-on-garment)"
                      clipPath="url(#floating-try-on-shape)"
                      opacity=".88"
                    />
                    <path d="m137 62 6 24 17 13 17-13 6-24" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2" />
                  </svg>
                )}
                <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-white">
                  {stream ? "Live preview" : snapshot ? "Photo preview" : "Private in this browser"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={stream ? () => { stopCamera(); setMessage(""); } : startCamera}
                  disabled={cameraBusy}
                  className="min-h-10 border border-white/30 px-3 text-[9px] uppercase tracking-[0.12em] transition hover:bg-white hover:text-[#111110] disabled:cursor-wait disabled:opacity-50"
                >
                  {cameraBusy ? "Connecting…" : stream ? "Turn camera off" : "Use camera"}
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!stream}
                  className="min-h-10 bg-[#f4f1eb] px-3 text-[9px] uppercase tracking-[0.12em] text-[#111110] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Capture photo
                </button>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="min-h-10 border border-white/30 px-3 text-[9px] uppercase tracking-[0.12em] transition hover:bg-white hover:text-[#111110]"
                >
                  Upload photo
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} className="sr-only" aria-label="Upload a photo" />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border border-white/15 p-3">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.15em] text-[#aaa8a1]">AI size recommendation</p>
                  {recommendedVariant ? (
                    <p className="mt-1 text-sm">
                      Recommended Size: <span className="font-semibold">{recommendedVariant.size}</span> — Regular Fit
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[#aaa8a1]">No sizes currently available</p>
                  )}
                </div>
                {recommendedVariant && (
                  <span className="shrink-0 border border-[#d2ff3a]/50 px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-[#d2ff3a]">
                    Suggested
                  </span>
                )}
              </div>
              <p className="mt-3 text-[9px] leading-4 text-[#aaa8a1]">
                This visual overlay and size suggestion are estimates, not a fit guarantee. Your photo stays in this browser.
              </p>
              <button
                type="button"
                onClick={addRecommendedSize}
                disabled={!design || !recommendedVariant || !garmentImage}
                className="mt-4 min-h-11 w-full bg-[#d2ff3a] px-4 text-[9px] font-medium uppercase tracking-[0.13em] text-[#111110] transition hover:bg-[#e1ff80] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
              {message && <p className="mt-3 text-[10px] leading-4 text-[#d2ff3a]" role="status">{message}</p>}
            </div>
          </section>
        </>
      )}

      <button
        type="button"
        onClick={openDrawer}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-50 inline-flex min-h-12 items-center gap-2 bg-[#111110] px-5 text-[10px] font-medium uppercase tracking-[0.12em] text-white shadow-xl transition hover:bg-[#30302d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2ff3a]"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6">
          <path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4z" />
          <circle cx="12" cy="13.5" r="3.2" />
        </svg>
        AI Try-On
      </button>
    </>
  );
}
