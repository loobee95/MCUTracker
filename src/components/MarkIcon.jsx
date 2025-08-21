// src/components/MarkIcon.jsx
import { useLayoutEffect, useState } from "react";


// why: централизуем соответствие id → набор эффектов/иконка
const markMetaById = {
// Captain America
cap1: { icon: "cap", variant: "v-cap" },
cap2: { icon: "cap", variant: "v-cap" },
cap3: { icon: "cap", variant: "v-cap" },
// Iron Man
im1: { icon: "im", variant: "v-im" },
im2: { icon: "im", variant: "v-im" },
im3: { icon: "im", variant: "v-im" },
// Thor
thor1: { icon: "thor", variant: "v-thor" },
thor2: { icon: "thor", variant: "v-thor" },
thor3: { icon: "thor", variant: "v-thor" },
thor4: { icon: "thor", variant: "v-thor" },
// Spider‑Man
sm1: { icon: "spidey", variant: "v-spidey" },
sm2: { icon: "spidey", variant: "v-spidey" },
sm3: { icon: "spidey", variant: "v-spidey" },
};


const markSrc = (itemId) => {
const meta = markMetaById[itemId];
const key = meta?.icon || "generic";
return `${process.env.PUBLIC_URL}/marks/${key}.svg`;
};


const markVariant = (itemId) => markMetaById[itemId]?.variant || "";


export default function MarkIcon({ checked, onToggle, itemId, size = 30 }) {
const [animClass, setAnimClass] = useState("");
const variant = markVariant(itemId) || "";


useLayoutEffect(() => {
setAnimClass(checked ? "anim-in" : "anim-out");
const HOLD_MS = 900; // why: даём эффектам доиграть
const t = setTimeout(() => setAnimClass(""), HOLD_MS);
return () => clearTimeout(t);
}, [checked, variant]);


const onKeyDown = (e) => {
if (e.key === " " || e.key === "Enter") {
e.preventDefault();
onToggle();
}
};


return (
<button
type="button"
className={`mark ${checked ? "is-on" : "is-off"} ${variant} ${animClass}`}
onClick={onToggle}
onKeyDown={onKeyDown}
aria-pressed={checked}
aria-label={checked ? "Снять отметку" : "Отметить как просмотрено"}
title={checked ? "Снять отметку" : "Отметить как просмотрено"}
style={{ "--size": `${size}px` }}
>
{checked && <img className="mark__img" src={markSrc(itemId)} alt="" />}
{/* why: у Спайди есть отдельный overlay для сетки */}
{checked && variant === "v-spidey" && <span className="fx fx-spidey" aria-hidden="true" />}
</button>
);
}