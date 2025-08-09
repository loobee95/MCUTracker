import React, { useEffect, useMemo, useState } from "react";
import "./effects.css";

const STORAGE_KEY = "mcu_tracker_progress_v2";
const RATING_KEY  = "mcu_tracker_ratings_v2";

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

function StarRating({ value, onChange, size = 24 }) {
  const handleClick = (star) => {
    onChange(star === (value || 0) ? 0 : star); // повторный клик снимает оценку
  };
  const clear = (e) => {
    e.preventDefault(); // чтобы контекстное меню не открывалось
    onChange(0);
  };
  return (
    <span className="stars" onContextMenu={clear} title="ЛКМ — поставить/снять, ПКМ — снять">
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onClick={() => handleClick(s)}
          style={{
            cursor: "pointer",
            fontSize: size,
            color: s <= (value || 0) ? "#ffd800" : "#555",
            userSelect: "none",
            marginRight: 2,
            textShadow: "0 0 3px rgba(0,0,0,.7), 0 0 10px rgba(0,0,0,.5)" // лёгкая обводка
          }}
          title={`${s} / 5`}
        >★</span>
      ))}
    </span>
  );
}


async function loadCore() {
  const res = await fetch(`${process.env.PUBLIC_URL}/mcu_core.json`);
  if (!res.ok) throw new Error("Не удалось загрузить /mcu_core.json");
  return await res.json();
}

function computeTotals(phases, progress) {
  let total = 0, watched = 0;
  (phases || []).forEach(phase => {
    (phase.items || []).forEach(item => {
      if (item.type === "movie") {
        total += item.minutes;
        if (progress[item.id]) watched += item.minutes;
      } else if (item.type === "series") {
        const eps = item.episodes || [];
        const t = eps.reduce((s, ep) => s + (ep.minutes || 0), 0);
        total += t;
        watched += eps.reduce((s, ep) => s + (progress[ep.id] ? (ep.minutes || 0) : 0), 0);
      }
    });
  });
  return { total, watched };
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [progress, setProgress] = useState(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  );
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress]);

  const [ratings, setRatings] = useState(() =>
    JSON.parse(localStorage.getItem(RATING_KEY) || "{}")
  );
  useEffect(() => localStorage.setItem(RATING_KEY, JSON.stringify(ratings)), [ratings]);

  const [opened, setOpened] = useState({}); // { [seriesId]: true }

  // грузим только core
  useEffect(() => {
    setLoading(true); setErr("");
    loadCore()
      .then(setData)
      .catch(e => setErr(e.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  const { total, watched } = useMemo(() => computeTotals(data, progress), [data, progress]);
  const percent = total ? (watched / total * 100) : 0;

  return (
    <div style={{background:"#1a1a1a",minHeight:"100vh",color:"#fff",fontFamily:"Montserrat,Arial,sans-serif"}}>

      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div className="logo-marvel"><span>MARVEL</span></div>
          <div>
            <div className="hero-title">MCU Watchlist & Tracker</div>
            <div className="hero-sub">Хронология по событиям • чеклист • рейтинги • прогресс по времени</div>
          </div>
        </div>
      </header>

      {/* ПРОГРЕСС */}
      <div className="progress-wrap">
        <div style={{fontWeight:700,fontSize:"1.05em",color:"#ffd800",marginBottom:6}}>
          Прогресс: {formatTime(watched)} из {formatTime(total)} ({percent.toFixed(1)}%)
        </div>
        <div className="progress">
          <div
            className="progress__bar progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Содержимое */}
      <div style={{maxWidth:1100,margin:"10px auto 0",background:"#181818ed",borderRadius:18,boxShadow:"0 2px 14px #9002",padding:"22px 16px"}}>
        {loading && <div style={{padding:12}}>Загружаем базу…</div>}
        {err && <div style={{padding:12,color:"#ff8a8a"}}>Ошибка: {err}</div>}
        {!loading && !err && data.map(phase => (
          <div key={`phase-${phase.phase}`} style={{marginBottom:26}}>
            <div style={{fontSize:"1.1em",background:"#e62429",color:"#fff",display:"inline-block",borderRadius:8,fontWeight:"bold",marginBottom:10,boxShadow:"0 2px 8px #9005",padding:"2px 14px"}}>
              Фаза {phase.phase}
            </div>

            <ul style={{listStyle:"none",padding:0, margin:0}}>
              {phase.items.map(item => {
                if (item.type === "movie") {
                  return (
                    <li
                      key={item.id}
                      className={`card ${progress[item.id] ? "watched" : ""} ${item.poster ? "row-bg" : ""}`}
                      style={item.poster ? { ['--poster']: `url(${item.poster})` } : undefined}
                    >
                      <div className="content">
                        <input
                          type="checkbox"
                          checked={!!progress[item.id]}
                          onChange={e => setProgress(p => ({ ...p, [item.id]: e.target.checked }))}
                          className="chk"
                        />
                        <span style={{ fontWeight: 700, flex: 1 }}>{item.title}</span>
                        <div className="meta">
  <span className="gold">{formatTime(item.minutes)}</span>
  <StarRating
    value={ratings[item.id] || 0}
    onChange={star => setRatings(r => ({ ...r, [item.id]: star }))}
  />
</div>
                      </div>
                    </li>
                  );
                }

                if (item.type === "series") {
                  const seriesId = item.id;
                  const open = !!opened[seriesId];
                  const eps = item.episodes || [];
                  const allWatched = eps.length > 0 && eps.every(ep => !!progress[ep.id]);
                  const totalSeries = eps.reduce((s, ep) => s + (ep.minutes || 0), 0);

                  return (
                    <li
                      key={seriesId}
                      className={`card ${allWatched ? "watched" : ""} ${item.poster ? "row-bg" : ""}`}
                      style={item.poster ? { ['--poster']: `url(${item.poster})` } : undefined}
                    >
                      <div className="content" style={{ cursor: "default" }}>
                        <span
                          onClick={() => setOpened(o => ({ ...o, [seriesId]: !open }))}
                          style={{ marginRight: 8, cursor: "pointer", color: "#ffd800", fontWeight: 800, fontSize: "1.16em", userSelect: "none" }}
                          title={open ? "Свернуть" : "Развернуть"}
                        >
                          {open ? "▼" : "▶"}
                        </span>
                        <input
                          type="checkbox"
                          checked={allWatched}
                          onChange={e => {
                            const checked = e.target.checked;
                            setProgress(p => {
                              const next = { ...p };
                              eps.forEach(ep => (next[ep.id] = checked));
                              return next;
                            });
                          }}
                          className="chk"
                        />
                        <span
                          onClick={() => setOpened(o => ({ ...o, [seriesId]: !open }))}
                          style={{ fontWeight: 700, flex: 1, cursor: "pointer" }}
                          title={open ? "Свернуть" : "Развернуть"}
                        >
                          {item.title}
                        </span>
                        <div className="meta">
  <span className="gold">({eps.length} серий)</span>
  <span className="gold">{formatTime(totalSeries)}</span>
  <StarRating
    value={ratings[seriesId] || 0}
    onChange={star => setRatings(r => ({ ...r, [seriesId]: star }))}
  />
</div>
                      </div>

                      {/* список серий всегда в DOM; видимость — классом */}
                      <ul
                        className={`series-episodes ${open ? "open" : ""}`}
                        style={{ margin: 0, marginTop: 9, padding: 0, listStyle: "none", position:"relative", zIndex:2 }}
                      >
                        {eps.map(ep => (
                          <li
                            key={ep.id}
                            className={`episode ${progress[ep.id] ? "watched" : ""}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              position:"relative", zIndex:2
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={!!progress[ep.id]}
                                onChange={e => setProgress(p => ({ ...p, [ep.id]: e.target.checked }))}
                                className="chk"
                              />
                              <span style={{ fontWeight: 500, marginLeft: 8 }}>{ep.title}</span>
                            </div>

                            <div className="meta">
  <span className="gold">{formatTime(ep.minutes)}</span>
  <StarRating
    value={ratings[ep.id] || 0}
    onChange={star => setRatings(r => ({ ...r, [ep.id]: star }))}
    size={18}
  />
</div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }

                return null;
              })}
            </ul>
          </div>
        ))}
      </div>

      <footer className="footer">
  <div className="footer-inner">
    <div className="links">
      <span className="badge">MCU Tracker</span>
      <a href="https://www.marvel.com/" target="_blank" rel="noreferrer">Marvel.com</a>
      <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
      <a href="#" onClick={(e)=>{ e.preventDefault(); alert('В разработке :)'); }}>FAQ</a>
    </div>
    <div>
      © {new Date().getFullYear()} — фанатский проект. Данные локально в браузере.
    </div>
  </div>
</footer>
    </div>
  );
}
