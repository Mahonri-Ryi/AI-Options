import './PositionToggle.css';

interface PositionToggleProps {
  value: 'short' | 'long';
  shortLabel: string;
  longLabel: string;
  shortSubtitle: string;
  longSubtitle: string;
  onChange: (value: 'short' | 'long') => void;
}

export function PositionToggle({
  value,
  shortLabel,
  longLabel,
  shortSubtitle,
  longSubtitle,
  onChange,
}: PositionToggleProps) {
  return (
    <div className="position-type-toggle">
      <button
        type="button"
        className={`position-option ${value === 'short' ? 'active short' : ''}`}
        onClick={() => onChange('short')}
      >
        <span>{shortLabel}</span>
        <span className="position-subtitle">{shortSubtitle}</span>
      </button>
      <button
        type="button"
        className={`position-option ${value === 'long' ? 'active long' : ''}`}
        onClick={() => onChange('long')}
      >
        <span>{longLabel}</span>
        <span className="position-subtitle">{longSubtitle}</span>
      </button>
    </div>
  );
}
