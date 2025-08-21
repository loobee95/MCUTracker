// src/components/ProgressBar.jsx
import React from "react";


export default function ProgressBar({ percent }) {
return (
<div className="progress">
<div className="progress__bar progress-fill" style={{ width: `${percent}%` }} />
</div>
);
}