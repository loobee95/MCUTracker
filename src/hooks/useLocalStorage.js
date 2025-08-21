// src/hooks/useLocalStorage.js
import { useEffect, useState } from "react";


/**
* LocalStorage state with JSON serialization.
* Why: deduplicate persistence logic and avoid copy/paste.
*/
export function useLocalStorage(key, initialValue) {
const [state, setState] = useState(() => {
try {
const raw = localStorage.getItem(key);
return raw != null ? JSON.parse(raw) : initialValue;
} catch {
return initialValue;
}
});


useEffect(() => {
try {
localStorage.setItem(key, JSON.stringify(state));
} catch {
/* ignore quota errors */
}
}, [key, state]);


return [state, setState];
}