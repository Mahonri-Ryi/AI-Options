import './ModeToggle.css';

interface ModeToggleProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export function ModeToggle({ label, value, options, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle-row">
      <span className="mode-toggle-label">{label}</span>
      <div className="mode-toggle" role="group">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`toggle-option ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
