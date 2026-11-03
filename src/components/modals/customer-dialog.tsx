"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { AREAS, BOUNDS, proj } from "@/lib/calc";
import { api } from "@/services/api";
import { type CustomerForm, areaCoords, useAppStore } from "@/store/app-store";
import { Field, FormActions, FormError, ModalFrame, SelectInput, TextInput } from "./frame";

/** Crop an uploaded image to a 160px square JPEG data URL (as in the prototype). */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const S = 160;
        const m = Math.min(img.width, img.height);
        c.width = c.height = S;
        c.getContext("2d")!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}

export function CustomerDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const riders = useAppStore((s) => s.data.riders);
  const [f, setF] = useState<CustomerForm>({ name: "", nic: "", phone: "", address: "", city: "", riderId: riders[0]?.id ?? "", notes: "", photo: "", lat: null, lng: null });
  const [pinned, setPinned] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) => setF((x) => ({ ...x, [k]: v }));

  const onCity = (v: string) => {
    const a = areaCoords(v);
    setF((x) => ({ ...x, city: v, ...(a && !pinned ? { lat: a[0], lng: a[1] } : {}) }));
  };

  const onPin = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const b = BOUNDS;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setPinned(true);
    setF((x) => ({ ...x, lat: b.lat1 - py * (b.lat1 - b.lat0), lng: b.lng0 + px * (b.lng1 - b.lng0) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.customers.create(f);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast("Customer registered");
    router.push(`/customers/${res.value}`);
  };

  const pin = f.lat != null && f.lng != null ? proj(f.lat, f.lng, BOUNDS) : null;
  const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5";

  return (
    <ModalFrame title="Register customer" width={760} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className="grid size-16 flex-none place-items-center overflow-hidden rounded-full bg-[#F0F0F2] bg-cover bg-center text-xs text-muted-ink"
            style={f.photo ? { backgroundImage: `url(${f.photo})` } : undefined}
          >
            {!f.photo && "Photo"}
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#D4D4D8] bg-white px-4 text-sm font-medium text-body hover:border-faint">
            <Icon name="ic-upload" size={18} />
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) set("photo", await readPhoto(file));
              }}
            />
          </label>
        </div>

        <div className={grid}>
          <Field label="Full name">
            <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="NIC">
            <TextInput value={f.nic} onChange={(e) => set("nic", e.target.value)} placeholder="e.g. 199012345678" />
          </Field>
          <Field label="Phone">
            <TextInput inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07X XXX XXXX" />
          </Field>
          <Field label="City / area">
            <TextInput list="cl-areas" value={f.city} onChange={(e) => onCity(e.target.value)} />
          </Field>
          <datalist id="cl-areas">
            {Object.keys(AREAS).map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>

        <Field label="Address">
          <TextInput value={f.address} onChange={(e) => set("address", e.target.value)} />
        </Field>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-13 font-medium text-body">
            <span>Map pin — click the map to place</span>
            <span className="font-normal text-muted-ink">{f.lat != null && f.lng != null ? `${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}` : "Not set"}</span>
          </div>
          <div className="map-img relative h-[220px] cursor-crosshair overflow-hidden rounded-[10px] border border-line-input" onClick={onPin} role="button" aria-label="Customer location map">
            {pin && (
              <span
                className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink shadow-[0_0_0_2px_#7C5CFA]"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              />
            )}
          </div>
        </div>

        <div className={grid}>
          <Field label="Assigned rider">
            <SelectInput value={f.riderId} onChange={(e) => set("riderId", e.target.value)}>
              {riders
                .filter((r) => r.active || r.id === f.riderId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.area}
                  </option>
                ))}
            </SelectInput>
          </Field>
          <Field label="Notes">
            <TextInput value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" />
          </Field>
        </div>

        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Register customer" />
      </form>
    </ModalFrame>
  );
}
