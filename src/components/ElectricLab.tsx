import { useMemo, useState } from "react";
import { Calculator, Palette, GitBranch, ShieldAlert } from "lucide-react";

const fmt = (n: number, unit: string) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)} M${unit}`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)} k${unit}`;
  if (abs > 0 && abs < 1) return `${(n * 1e3).toFixed(2)} m${unit}`;
  return `${n.toFixed(2)} ${unit}`;
};

function Field({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-md border border-border bg-background/60 focus-within:border-neon-cyan/60">
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent px-3 py-2 text-sm outline-none" placeholder="vacío = calcular" />
        <span className="px-3 text-xs text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}

function OhmCalc() {
  const [v, setV] = useState("12");
  const [i, setI] = useState("");
  const [r, setR] = useState("220");
  const res = useMemo(() => {
    const V = parseFloat(v), I = parseFloat(i), R = parseFloat(r);
    let vv = V, ii = I, rr = R;
    if (!isNaN(V) && !isNaN(R) && isNaN(I)) ii = V / R;
    else if (!isNaN(V) && !isNaN(I) && isNaN(R)) rr = V / I;
    else if (!isNaN(I) && !isNaN(R) && isNaN(V)) vv = I * R;
    else if ([V, I, R].filter((x) => !isNaN(x)).length !== 3) return null;
    return { V: vv, I: ii, R: rr, P: vv * ii };
  }, [v, i, r]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Escribe dos valores y deja uno vacío. V = I × R</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Voltaje" value={v} onChange={setV} unit="V" />
        <Field label="Corriente" value={i} onChange={setI} unit="A" />
        <Field label="Resistencia" value={r} onChange={setR} unit="Ω" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {res ? ([["V", fmt(res.V, "V")], ["I", fmt(res.I, "A")], ["R", fmt(res.R, "Ω")], ["P", fmt(res.P, "W")]] as const).map(([k, val]) => (
          <div key={k} className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-3">
            <div className="text-[10px] font-mono text-muted-foreground">{k}</div>
            <div className="font-bold text-neon-cyan">{val}</div>
          </div>
        )) : <p className="col-span-4 text-sm text-muted-foreground">Completa exactamente dos valores.</p>}
      </div>
    </div>
  );
}

const COLORS = [
  { n: "Negro", c: "#111" }, { n: "Marrón", c: "#7c3f12" }, { n: "Rojo", c: "#dc2626" }, { n: "Naranja", c: "#f97316" },
  { n: "Amarillo", c: "#facc15" }, { n: "Verde", c: "#16a34a" }, { n: "Azul", c: "#2563eb" }, { n: "Violeta", c: "#7c3aed" },
  { n: "Gris", c: "#6b7280" }, { n: "Blanco", c: "#f5f5f5" },
];

function ColorCode() {
  const [b, setB] = useState([2, 2, 1]);
  const value = (b[0] * 10 + b[1]) * Math.pow(10, b[2]);
  const set = (idx: number, val: number) => setB((p) => p.map((x, k) => (k === idx ? val : x)));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center py-3">
        <div className="h-1 w-10 bg-muted-foreground/60" />
        <div className="relative flex h-12 w-48 items-center justify-center gap-4 rounded-full bg-[#d8b98a] px-6">
          {b.map((x, k) => <span key={k} className="h-12 w-3" style={{ background: COLORS[x].c }} />)}
          <span className="h-12 w-3 bg-[#d4af37]" />
        </div>
        <div className="h-1 w-10 bg-muted-foreground/60" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1ª banda", "2ª banda", "Multiplicador"].map((label, k) => (
          <label key={label} className="block">
            <span className="text-xs font-mono text-muted-foreground">{label}</span>
            <select value={b[k]} onChange={(e) => set(k, +e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm">
              {COLORS.map((c, idx) => <option key={c.n} value={idx}>{c.n}</option>)}
            </select>
          </label>
        ))}
      </div>
      <p className="text-center text-2xl font-bold text-neon-cyan">{fmt(value, "Ω")} <span className="text-sm text-muted-foreground">±5% (dorado)</span></p>
    </div>
  );
}

function SeriesParallel() {
  const [list, setList] = useState("100, 220, 330");
  const vals = list.split(/[,\s]+/).map(Number).filter((x) => x > 0);
  const series = vals.reduce((a, x) => a + x, 0);
  const parallel = vals.length ? 1 / vals.reduce((a, x) => a + 1 / x, 0) : 0;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-mono text-muted-foreground">Resistencias en Ω separadas por comas</span>
        <input value={list} onChange={(e) => setList(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-neon-cyan/60" />
      </label>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-3"><div className="text-xs text-muted-foreground">Serie</div><div className="font-bold text-neon-cyan">{fmt(series, "Ω")}</div></div>
        <div className="rounded-lg border border-neon-purple/30 bg-neon-purple/5 p-3"><div className="text-xs text-muted-foreground">Paralelo</div><div className="font-bold text-neon-purple">{fmt(parallel, "Ω")}</div></div>
      </div>
    </div>
  );
}

const SAFETY = [
  "Desconecta siempre la energía antes de tocar un circuito de la casa.",
  "La corriente de la red (110/220 V) puede ser mortal: practica con pilas o 5 V.",
  "Usa un multímetro para comprobar que no hay voltaje antes de trabajar.",
  "Nunca conectes un LED sin resistencia: se quema al instante.",
  "No toques cables pelados ni trabajes con las manos mojadas.",
  "Si algo huele a quemado o se calienta, desconecta de inmediato.",
];

const TABS = [
  { id: "ohm", label: "Ley de Ohm", Icon: Calculator },
  { id: "color", label: "Código de colores", Icon: Palette },
  { id: "sp", label: "Serie / Paralelo", Icon: GitBranch },
  { id: "safe", label: "Seguridad", Icon: ShieldAlert },
] as const;

export function ElectricLab() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ohm");
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-neon-cyan" /> Laboratorio interactivo
        </h3>
        <p className="mb-5 text-sm text-muted-foreground">Calcula y experimenta sin riesgo antes de armar tu circuito.</p>
        <div className="glass neon-border rounded-2xl p-4 sm:p-6">
          <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold border transition-colors ${tab === id ? "border-neon-cyan/60 bg-secondary/70 text-foreground shadow-neon-blue" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {tab === "ohm" && <OhmCalc />}
          {tab === "color" && <ColorCode />}
          {tab === "sp" && <SeriesParallel />}
          {tab === "safe" && (
            <ul className="space-y-2">
              {SAFETY.map((s) => <li key={s} className="flex gap-2 text-sm"><ShieldAlert className="h-4 w-4 shrink-0 text-destructive mt-0.5" />{s}</li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
