// src/App.js
import React, { useEffect, useMemo, useState } from "react";
import "./effects.css";

import MarkIcon from "./components/MarkIcon";
import StarRating from "./components/StarRating";
import ProgressBar from "./components/ProgressBar";
import { useLocalStorage } from "./hooks/useLocalStorage";

const STORAGE_KEY = "mcu_tracker_progress_v2";
const RATING_KEY = "mcu_tracker_ratings_v2";
const STORAGE_MODE_KEY = "mcu_mode_v1";

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

async function loadList(mode = "core") {
  const file = mode === "all" ? "mcu_all.json" : "mcu_core.json";
  const res = await fetch(`${process.env.PUBLIC_URL}/${file}`);
  if (!res.ok) throw new Error(`Не удалось загрузить /${file}`);
  return await res.json();
}

function computeTotals(phases, progress) {
  let total = 0,
    watched = 0;
  (phases || []).forEach((phase) => {
    (phase.items || []).forEach((item) => {
      if (item.type === "movie") {
        total += item.minutes;
        if (progress[item.id]) watched += item.minutes;
      } else if (item.type === "series") {
        const eps = item.episodes || [];
        const t = eps.reduce((s, ep) => s + (ep.minutes || 0), 0);
        total += t;
        watched += eps.reduce(
          (s, ep) => s + (progress[ep.id] ? ep.minutes || 0 : 0),
          0
        );
      }
    });
  });
  return { total, watched };
}

function normalizeData(d) {
  if (Array.isArray(d) && d.length && typeof d[0] === "object" && "items" in d[0]) {
    return d;
  }
  if (Array.isArray(d)) {
    return [{ items: d }];
  }
  return [{ items: [] }];
}

export default function App() {
  const [mode, setMode] = useLocalStorage(STORAGE_MODE_KEY, "core");
  const [progress, setProgress] = useLocalStorage(STORAGE_KEY, {});
  const [ratings, setRatings] = useLocalStorage(RATING_KEY, {});

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [opened, setOpened] = useState({}); // { [seriesId]: true }
  const [query, setQuery] = useState("");

  // === FIXED: аккуратный вариант без запятых-выражений, чтобы не путаться со скобками ===
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");

    loadList(mode)
      .then((d) => {
        if (!mounted) return;
        const normalized = normalizeData(d);
        setData(normalized);
        setOpened({});
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e.message || "Ошибка загрузки");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [mode]);

  const flatItems = useMemo(() => (data || []).flatMap((p) => p.items || []), [data]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatItems;
    return flatItems.filter((it) => it.title.toLowerCase().includes(q));
  }, [flatItems, query]);

  const { total, watched } = useMemo(() => computeTotals(data, progress), [data, progress]);
  const percent = total ? (watched / total) * 100 : 0;

  const clearProgress = () => {
    if (window.confirm("Сбросить отмеченное?")) setProgress({});
  };
  const clearRatings = () => {
    if (window.confirm("Сбросить все оценки?")) setRatings({});
  };

  return (
    <div
      className="page-bg"
      style={{
        background: "#1a1a1a",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "Montserrat,Arial,sans-serif",
        "--static-bg": `url(${process.env.PUBLIC_URL}/bg/marvel-hero.jpg)`,
      }}
    >
      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div className="logo-marvel">
            <span>MARVEL</span>
          </div>
        </div>
      </header>

      {/* PROGRESS + CONTROLS */}
      <div
        className="progress-wrap"
        style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontWeight: 700, color: "#ddd" }} htmlFor="mode">
            Набор:
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{
              background: "#292929",
              color: "#fff",
              border: "2px solid #e62429",
              padding: "7px 12px",
              borderRadius: 8,
              fontWeight: 700,
              minWidth: 240,
            }}
          >
            <option value="core">Только основные MCU</option>
            <option value="all">Все фильмы и сериалы Marvel</option>
          </select>

          <input
            placeholder="Поиск по названию…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "#292929",
              color: "#fff",
              border: "2px solid #3b3b3b",
              padding: "7px 12px",
              borderRadius: 8,
              minWidth: 220,
            }}
            aria-label="Поиск"
          />

          <button
            type="button"
            onClick={clearProgress}
            className="linklike"
            style={{ marginLeft: 8 }}
            title="Сбросить отмеченное"
          >
            Сбросить прогресс
          </button>
          <button
            type="button"
            onClick={clearRatings}
            className="linklike"
            title="Сбросить оценки"
          >
            Сбросить оценки
          </button>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: "1.05em", color: "#ffd800", marginBottom: 6 }}>
            Прогресс: {formatTime(watched)} из {formatTime(total)} ({percent.toFixed(1)}%)
          </div>
          <ProgressBar percent={percent} />
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{
          maxWidth: 1100,
          margin: "10px auto 0",
          background: "#181818ed",
          borderRadius: 18,
          boxShadow: "0 2px 14px #9002",
          padding: "22px 16px",
        }}
      >
        {loading && <div style={{ padding: 12 }}>Загружаем базу…</div>}
        {err && <div style={{ padding: 12, color: "#ff8a8a" }}>Ошибка: {err}</div>}

        {!loading && !err && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {visibleItems.map((item) => {
              if (item.type === "movie") {
                const posterUrl = item.poster?.startsWith("http")
                  ? item.poster
                  : `${process.env.PUBLIC_URL}/${item.poster || ""}`;

                return (
                  <li
                    key={item.id}
                    className={`card ${progress[item.id] ? "watched" : ""} ${item.poster ? "row-bg" : ""}`}
                    style={item.poster ? { "--poster": `url("${posterUrl}")` } : undefined}
                  >
                    <div className="content">
                      <MarkIcon
                        checked={!!progress[item.id]}
                        itemId={item.id}
                        onToggle={() => {
                          const next = !progress[item.id];
                          setProgress((p) => ({ ...p, [item.id]: next }));
                        }}
                      />
                      <span style={{ fontWeight: 700, flex: 1 }}>{item.title}</span>
                      <div className="meta">
                        <span className="gold">{formatTime(item.minutes)}</span>
                        <StarRating
                          value={ratings[item.id] || 0}
                          onChange={(star) => setRatings((r) => ({ ...r, [item.id]: star }))}
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
                const allWatched = eps.length > 0 && eps.every((ep) => !!progress[ep.id]);
                const totalSeries = eps.reduce((s, ep) => s + (ep.minutes || 0), 0);

                const posterUrl = item.poster?.startsWith("http")
                  ? item.poster
                  : `${process.env.PUBLIC_URL}/${item.poster || ""}`;

                return (
                  <li
                    key={seriesId}
                    className={`card ${allWatched ? "watched" : ""} ${item.poster ? "row-bg" : ""}`}
                    style={item.poster ? { "--poster": `url("${posterUrl}")` } : undefined}
                  >
                    <div className="content" style={{ cursor: "default" }}>
                      <button
                        type="button"
                        onClick={() => setOpened((o) => ({ ...o, [seriesId]: !open }))}
                        aria-expanded={open}
                        aria-controls={`eps-${seriesId}`}
                        title={open ? "Свернуть" : "Развернуть"}
                        style={{ marginRight: 8, cursor: "pointer", color: "#ffd800", fontWeight: 800, fontSize: "1.16em" }}
                        className="linklike"
                      >
                        {open ? "▼" : "▶"}
                      </button>
                      <MarkIcon
                        checked={allWatched}
                        itemId={seriesId}
                        onToggle={() => {
                          const makeWatched = !allWatched;
                          setProgress((p) => {
                            const next = { ...p };
                            eps.forEach((ep) => (next[ep.id] = makeWatched));
                            return next;
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setOpened((o) => ({ ...o, [seriesId]: !open }))}
                        className="linklike"
                        title={open ? "Свернуть" : "Развернуть"}
                        style={{ fontWeight: 700, flex: 1, textAlign: "left" }}
                        aria-controls={`eps-${seriesId}`}
                        aria-expanded={open}
                      >
                        {item.title}
                      </button>
                      <div className="meta">
                        <span className="gold">({eps.length} серий)</span>
                        <span className="gold">{formatTime(totalSeries)}</span>
                        <StarRating
                          value={ratings[seriesId] || 0}
                          onChange={(star) => setRatings((r) => ({ ...r, [seriesId]: star }))}
                        />
                      </div>
                    </div>

                    <ul
                      id={`eps-${seriesId}`}
                      className={`series-episodes ${open ? "open" : ""}`}
                      style={{ margin: 0, marginTop: 9, padding: 0, listStyle: "none", position: "relative", zIndex: 2 }}
                    >
                      {eps.map((ep) => (
                        <li
                          key={ep.id}
                          className={`episode ${progress[ep.id] ? "watched" : ""}`}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", position: "relative", zIndex: 2 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <MarkIcon
                              checked={!!progress[ep.id]}
                              itemId={seriesId}
                              size={22}
                              onToggle={() => setProgress((p) => ({ ...p, [ep.id]: !p[ep.id] }))}
                            />
                            <span style={{ fontWeight: 500, marginLeft: 8 }}>{ep.title}</span>
                          </div>
                          <div className="meta">
                            <span className="gold">{formatTime(ep.minutes)}</span>
                            <StarRating
                              value={ratings[ep.id] || 0}
                              onChange={(star) => setRatings((r) => ({ ...r, [ep.id]: star }))}
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
        )}
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="links">
            <span className="badge">MCU Tracker</span>
            <a href="https://www.marvel.com/" target="_blank" rel="noreferrer">
              Marvel.com
            </a>
            <a href="https://github.com/" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <button type="button" className="linklike" onClick={() => alert("В разработке :)")}>FAQ</button>
          </div>
          <div>© {new Date().getFullYear()} — фанатский проект. Данные локально в браузере.</div>
        </div>
      </footer>
    </div>
  );
}