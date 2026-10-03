// The editable value uses Indonesian separators; the stored value is a plain decimal.
export function parseCurrencyInput(text: string) {
  const cleaned = text.replace(/[^0-9,]/g, "");
  const [whole, ...fraction] = cleaned.split(",");
  const integer = whole.replace(/^0+(?=\d)/, "");
  return integer + (fraction.length ? `.${fraction.join("").slice(0, 2)}` : "");
}

export function formatCurrencyInput(value: string) {
  const [whole, fraction] = value.split(".");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
    (fraction !== undefined ? `,${fraction}` : "")
  );
}
