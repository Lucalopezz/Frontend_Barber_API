import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  digitsOnly,
  emptyAddressParts,
  formatAddress,
  splitAddress,
  stateAbbreviation,
  type AddressParts,
} from "./address";

type AddressFieldsProps = {
  value: string;
  onChange: (address: string) => void;
  error?: string;
};

export function AddressFields({ value, onChange, error }: AddressFieldsProps) {
  const [parts, setParts] = useState<AddressParts>(() =>
    value ? splitAddress(value) : { ...emptyAddressParts },
  );

  function update<K extends keyof AddressParts>(key: K, nextValue: string) {
    const nextParts = { ...parts, [key]: nextValue };
    setParts(nextParts);
    onChange(formatAddress(nextParts));
  }

  const inputClassName = cn(error && "border-red-500");

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="address-street">Logradouro</Label>
        <Input
          id="address-street"
          autoComplete="address-line1"
          value={parts.street}
          onChange={(event) => update("street", event.target.value)}
          placeholder="Rua das Flores"
          aria-invalid={Boolean(error)}
          className={inputClassName}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="address-number">Número</Label>
          <Input
            id="address-number"
            inputMode="numeric"
            value={parts.number}
            onChange={(event) => update("number", digitsOnly(event.target.value))}
            placeholder="133"
            aria-invalid={Boolean(error)}
            className={inputClassName}
          />
        </div>
        <div>
          <Label htmlFor="address-state">Estado (UF)</Label>
          <Input
            id="address-state"
            autoComplete="address-level1"
            value={parts.state}
            onChange={(event) =>
              update("state", stateAbbreviation(event.target.value))
            }
            placeholder="SP"
            maxLength={2}
            aria-invalid={Boolean(error)}
            className={inputClassName}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address-city">Cidade</Label>
        <Input
          id="address-city"
          autoComplete="address-level2"
          value={parts.city}
          onChange={(event) => update("city", event.target.value)}
          placeholder="São Paulo"
          aria-invalid={Boolean(error)}
          className={inputClassName}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
