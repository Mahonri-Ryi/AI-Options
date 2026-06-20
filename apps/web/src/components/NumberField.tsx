import './NumberField.css';

interface NumberFieldProps {
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
}

export function NumberField({ label, value, suffix, onChange }: NumberFieldProps) {
  return (
    <label className="number-field">
      <span className="field-label">{label}</span>
      <div className="field-input-wrap">
        <input
          type="text"
          inputMode="decimal"
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </div>
    </label>
  );
}
