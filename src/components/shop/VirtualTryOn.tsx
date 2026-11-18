"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { DesignWithVariants } from "@/types";

const SIZE_PREFERENCE = ["M", "L", "S", "XL"];

function getRecommendedVariant(design: DesignWithVariants) {
  const available = design.variants.filter((variant) => variant.stock > 0);
  return (
    SIZE_PREFERENCE.map((size) => available.find((variant) => variant.size === size)).find(
      (variant) => variant !== undefined
    ) ?? available[0]
  );
}

export default function VirtualTryOn({ design }: { design: DesignWithVariants }) {
  const { addItem } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [message, setMessage] = useState("");
  const recommendedVariant = getRecommendedVariant(design);
  const shirtImage = design.images[0];

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    return () => stream.getTracks().forEach((track) => track.stop());
  }, [stream]);

  async function toggleCamera() {
    setMessage("");
    if (stream) {
      setStream(null);
      return;
    }

    setCameraBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Camera access is not available in this browser.");
        return;
      }
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setSnapshot("");
      setStream(cameraStream);
    } catch {
      setMessage("Camera access was denied or unavailable. Check your browser permissions and try again.");
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
    setStream(null);
    setMessage("");
  }

  function addRecommendedSize() {
    if (!recommendedVariant) {
      setMessage("This design is currently out of stock in all sizes.");
      return;
    }
    if (!shirtImage) {
      setMessage("This design has no product image and cannot be added to your bag.");
      return;
    }
    addItem({
      designId: design.id,
      variantId: recommendedVariant.id,
      slug: design.slug,
      name: design.name,
      size: recommendedVariant.size,
      image: shirtImage,
      price: design.price,
      quantity: 1,
      stock: recommendedVariant.stock
    });
    setMessage(`${design.name} in size ${recommendedVariant.size} added to your bag.`);
  }

  return (
    <section className="w-full bg-[#111111] p-5 text-white sm:p-8" aria-labelledby="virtual-try-on-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">The fitting room</p>
          <h2 id="virtual-try-on-title" className="text-3xl font-medium tracking-[-0.06em]">
            Virtual try-on
          </h2>
        </div>
        <span className="border border-white/20 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-neutral-400">
          Simulated preview
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)]">
        <div>
          <div className="relative mx-auto aspect-[4/5] max-h-[560px] overflow-hidden bg-[#222222]">
            {snapshot ? (
              <img src={snapshot} alt="Your captured photo" className="h-full w-full object-cover" />
            ) : stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Live camera preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-neutral-400">
                <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10 fill-none stroke-current" strokeWidth="1">
                  <rect x="5" y="12" width="38" height="27" rx="2" />
                  <circle cx="24" cy="25" r="8" />
                  <path d="m15 12 3-5h12l3 5" />
                </svg>
                <p className="text-xs leading-5">Turn on your camera or capture a photo to preview this design.</p>
              </div>
            )}

            {(stream || snapshot) && shirtImage && (
              <svg
                aria-label={`Simulated ${design.name} shirt overlay`}
                role="img"
                viewBox="0 0 320 400"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <defs>
                  <pattern id="try-on-shirt-image" patternUnits="userSpaceOnUse" width="320" height="400">
                    <image href={shirtImage} width="320" height="400" preserveAspectRatio="xMidYMid slice" />
                  </pattern>
                  <clipPath id="try-on-shirt-shape">
                    <path d="m102 82 35-20h46l35 20 53 38-28 43-30-19v170H87V144l-30 19-28-43 53-38 20-8Z" />
                  </clipPath>
                </defs>
                <path
                  d="m102 82 35-20h46l35 20 53 38-28 43-30-19v170H87V144l-30 19-28-43 53-38 20-8Z"
                  fill="url(#try-on-shirt-image)"
                  clipPath="url(#try-on-shirt-shape)"
                  opacity=".88"
                />
                <path
                  d="m137 62 6 24 17 13 17-13 6-24"
                  fill="none"
                  stroke="white"
                  strokeOpacity=".65"
                  strokeWidth="2"
                />
              </svg>
            )}

            <span className="absolute bottom-3 left-3 bg-black/55 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-white">
              {stream ? "Live preview" : snapshot ? "Photo preview" : design.name}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleCamera}
              disabled={cameraBusy}
              className="min-h-11 border border-white/35 px-4 text-[10px] uppercase tracking-[0.13em] transition hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-50"
            >
              {cameraBusy ? "Connecting…" : stream ? "Turn camera off" : "Turn camera on"}
            </button>
            {stream && (
              <button
                type="button"
                onClick={capturePhoto}
                className="min-h-11 bg-white px-4 text-[10px] uppercase tracking-[0.13em] text-black transition hover:bg-neutral-200"
              >
                Capture photo
              </button>
            )}
            {snapshot && (
              <button
                type="button"
                onClick={() => setSnapshot("")}
                className="min-h-11 border border-white/35 px-4 text-[10px] uppercase tracking-[0.13em] transition hover:bg-white hover:text-black"
              >
                Retake photo
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div className="border border-white/15 p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Your size estimate</p>
            {recommendedVariant ? (
              <>
                <div className="my-5 flex items-center gap-4">
                  <span className="text-6xl font-light tracking-[-0.08em]">{recommendedVariant.size}</span>
                  <span className="border border-white/50 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-neutral-200">
                    Recommended
                  </span>
                </div>
                <p className="text-sm">Fits like a glove.</p>
                <p className="mt-3 text-xs leading-5 text-neutral-400">
                  A simulated estimate based on a standard fit profile, not body measurements.
                </p>
              </>
            ) : (
              <p className="mt-5 text-sm text-neutral-400">No sizes are currently available.</p>
            )}
          </div>

          <div>
            <p className="mb-4 text-xs leading-5 text-neutral-400">
              Your camera preview stays in this browser. The overlay is a visual simulation, not a fit guarantee.
            </p>
            <button
              type="button"
              onClick={addRecommendedSize}
              disabled={!recommendedVariant}
              className="min-h-12 w-full bg-white px-4 text-[10px] font-medium uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart with AI Size
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-xs text-neutral-300" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
