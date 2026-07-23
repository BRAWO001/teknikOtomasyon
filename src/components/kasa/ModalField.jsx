export default function ModalField({
  label,
  required = false,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>

      {children}
    </label>
  );
}
