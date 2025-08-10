import { useState } from "react";

export default function StarRating({ value = 0, onChange, name }) {
  const [hover, setHover] = useState(0);
  const current = hover || value;

  return (
    <div className="stars-input" role="radiogroup" aria-label={name}>
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${current >= n ? "on" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(n)}
          aria-checked={value === n}
          role="radio"
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
      <span className="stars-hint">{current}/5</span>
    </div>
  );
}
