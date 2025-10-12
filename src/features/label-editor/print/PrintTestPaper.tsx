import React from "react";
import "./print.css";

export default function PrintTestPaper() {
  return (
    <div style={{ padding: 0, margin: 0 }}>
      <svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="50" height="30" fill="none" stroke="#111" strokeDasharray="2,2"/>
        <line x1="35" y1="10" x2="35" y2="40" stroke="#999"/>
        <line x1="10" y1="25" x2="60" y2="25" stroke="#999"/>
      </svg>
    </div>
  );
}
