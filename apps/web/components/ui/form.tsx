import Link from "next/link";

const inputCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20 disabled:opacity-50";

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputCls}
      />
      {helper && <p className="mt-1 text-xs text-muted">{helper}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  required,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <textarea id={name} name={name} required={required} defaultValue={defaultValue} rows={rows} className={inputCls} />
    </div>
  );
}

export function Select({
  label,
  name,
  required,
  defaultValue,
  options,
  placeholder = "Selecione…",
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ""} className={inputCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormActions({ cancelHref, submitLabel = "Salvar" }: { cancelHref: string; submitLabel?: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Link
        href={cancelHref}
        className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        Cancelar
      </Link>
      <button
        type="submit"
        className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99]"
        style={{ color: "rgb(var(--bg))" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
