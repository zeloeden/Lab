import React, { useMemo } from "react";
import "./print.css";

export default function PrintLabel({ dataURL, wmm = 50, hmm = 30 }: { dataURL: string; wmm?: number; hmm?: number }) {
  const style = useMemo(() => ({
    page: `@page { size: ${wmm}mm ${hmm}mm; margin: 0 }`
  }), [wmm, hmm]);

  return (
    <div>
      <style>{style.page}</style>
      <img src={dataURL} alt="label" style={{ width: `${wmm}mm`, height: `${hmm}mm` }} />
    </div>
  );
}
