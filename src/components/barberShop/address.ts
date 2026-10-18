export type AddressParts = {
  street: string;
  number: string;
  city: string;
  state: string;
};

export const emptyAddressParts: AddressParts = {
  street: "",
  number: "",
  city: "",
  state: "",
};

export function splitAddress(address: string): AddressParts {
  const match = address.match(/^(.+?),\s*(\d+),\s*(.+?)\s*[–-]\s*([A-Za-z]{2})$/);
  if (!match) return { ...emptyAddressParts, street: address };
  return {
    street: match[1],
    number: match[2],
    city: match[3],
    state: match[4].toUpperCase(),
  };
}

export function formatAddress(parts: AddressParts): string {
  const { street, number, city, state } = parts;
  if (!street && !number && !city && !state) return "";
  return `${street.trim()}, ${number.trim()}, ${city.trim()} – ${state.trim()}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function stateAbbreviation(value: string): string {
  return value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
}
