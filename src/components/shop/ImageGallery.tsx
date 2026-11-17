"use client";

import { useState } from "react";

export default function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={`${name}, view ${active + 1}`} />
        <span className="gallery-count">{String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
      </div>
      {images.length > 1 && <div className="gallery-thumbs">
        {images.map((image, index) => (
          <button key={image} className={active === index ? "thumb active" : "thumb"} onClick={() => setActive(index)} aria-label={`View image ${index + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" />
          </button>
        ))}
      </div>}
    </div>
  );
}
