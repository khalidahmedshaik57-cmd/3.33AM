"use client";

import { useState } from "react";

const measurements = [
  { size: "XS", chest: "36–38", length: "26" },
  { size: "S", chest: "38–40", length: "27" },
  { size: "M", chest: "40–42", length: "28" },
  { size: "L", chest: "42–44", length: "29" },
  { size: "XL", chest: "44–46", length: "30" }
];

export default function SizeChartModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-button size-chart-trigger" onClick={() => setOpen(true)}>Size guide ↗</button>
      {open && <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
        <section className="size-modal" role="dialog" aria-modal="true" aria-labelledby="size-chart-title" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" aria-label="Close size guide" onClick={() => setOpen(false)}>×</button>
          <p className="eyebrow">Measurements / Inches</p><h2 id="size-chart-title">Find your fit.</h2>
          <p className="product-category">Approximate reference measurements. Measure a similar garment flat; chest is measured pit to pit. Individual pieces may vary.</p>
          <table className="size-table"><thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead>
            <tbody>{measurements.map((row) => <tr key={row.size}><td>{row.size}</td><td>{row.chest}&quot;</td><td>{row.length}&quot;</td></tr>)}</tbody>
          </table>
        </section>
      </div>}
    </>
  );
}
