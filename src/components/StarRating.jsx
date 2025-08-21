// src/components/StarRating.jsx


export default function StarRating({ value, onChange, size = 24 }) {
const clear = (e) => {
e.preventDefault();
onChange(0);
};
const setStar = (s) => onChange(s === (value || 0) ? 0 : s);


const onKeyDown = (e) => {
if (["ArrowLeft", "ArrowDown"].includes(e.key)) {
e.preventDefault();
onChange(Math.max(0, (value || 0) - 1));
} else if (["ArrowRight", "ArrowUp"].includes(e.key)) {
e.preventDefault();
onChange(Math.min(5, (value || 0) + 1));
} else if (e.key === "Home") {
e.preventDefault();
onChange(0);
} else if (e.key === "End") {
e.preventDefault();
onChange(5);
}
};


return (
<div
className="stars"
role="radiogroup"
aria-label="Оценка"
onContextMenu={clear}
onKeyDown={onKeyDown}
tabIndex={0}
title="ЛКМ — поставить/снять, ПКМ — снять, ←/→ — менять"
style={{ display: "inline-flex" }}
>
{[1, 2, 3, 4, 5].map((s) => (
<button
key={s}
type="button"
role="radio"
aria-checked={s <= (value || 0)}
onClick={() => setStar(s)}
style={{
cursor: "pointer",
fontSize: size,
color: s <= (value || 0) ? "#ffd800" : "#555",
userSelect: "none",
marginRight: 2,
background: "none",
border: "none",
padding: 0,
}}
title={`${s} / 5`}
>
★
</button>
))}
</div>
);
}