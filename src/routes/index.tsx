import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevLeft, Bell, Check, Bag, Heart } from "@/components/jhaazi/icons";

export const Route = createFileRoute("/")({ component: App });

type Screen = "feed" | "drop" | "item" | "booking" | "follow" | "dashboard" | "myfollows";

// ============ APP SHELL ============
function App() {
  const [screen, setScreen] = useState<Screen>("feed");
  const [demoOpen, setDemoOpen] = useState(false);
  const [tab, setTab] = useState<"drops" | "follows">("drops");
  const [followingSeller, setFollowingSeller] = useState(true); // jhaazi_picks initially followed

  const go = (s: Screen) => {
    setScreen(s);
    if (s === "myfollows") setTab("follows");
    else if (s === "feed") setTab("drops");
  };

  const screens: { id: Screen; label: string }[] = [
    { id: "feed", label: "Marketplace feed" },
    { id: "drop", label: "Drop landing" },
    { id: "item", label: "Item detail" },
    { id: "booking", label: "Booking confirmation" },
    { id: "follow", label: "Follow seller" },
    { id: "dashboard", label: "Seller live dashboard" },
    { id: "myfollows", label: "My follows" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-secondary)", paddingBottom: 70 }}>
      {/* Demo toggle */}
      <div style={{ maxWidth: 390, margin: "0 auto", padding: "8px 16px 0", position: "relative" }}>
        <button
          onClick={() => setDemoOpen(o => !o)}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8,
            background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
            fontSize: 11, color: "var(--color-text-tertiary)", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit",
          }}
        >
          <span>demo · jump to screen</span>
          <span style={{ color: "var(--color-text-secondary)" }}>{screens.find(s => s.id === screen)?.label} ▾</span>
        </button>
        {demoOpen && (
          <div style={{
            position: "absolute", top: 44, left: 16, right: 16, zIndex: 50,
            background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 10, padding: 6, boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
          }}>
            {screens.map(s => (
              <button key={s.id} onClick={() => { go(s.id); setDemoOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                  fontSize: 13, background: screen === s.id ? "var(--color-background-secondary)" : "none",
                  border: "none", borderRadius: 6, cursor: "pointer", color: "var(--color-text-primary)",
                  fontFamily: "inherit",
                }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Screen */}
      <div style={{ paddingTop: 8 }}>
        {screen === "feed" && <Feed go={go} followingSeller={followingSeller} setFollowingSeller={setFollowingSeller} />}
        {screen === "drop" && <DropLanding go={go} followingSeller={followingSeller} setFollowingSeller={setFollowingSeller} />}
        {screen === "item" && <ItemDetail go={go} />}
        {screen === "booking" && <Booking go={go} />}
        {screen === "follow" && <FollowSeller go={go} setFollowingSeller={setFollowingSeller} />}
        {screen === "dashboard" && <SellerDashboard go={go} />}
        {screen === "myfollows" && <MyFollows />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-background-primary)",
        borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "center", zIndex: 40,
      }}>
        <div style={{ maxWidth: 390, width: "100%", display: "flex" }}>
          {([
            { id: "drops" as const, label: "drops", icon: Bag, target: "feed" as Screen },
            { id: "follows" as const, label: "my follows", icon: Heart, target: "myfollows" as Screen },
          ]).map(t => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => go(t.target)}
                style={{
                  flex: 1, padding: "10px 0 14px", background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  fontSize: 11, fontWeight: active ? 500 : 400,
                }}>
                <Icon active={active} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ BACK BAR (shared) ============
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: "50%", border: "0.5px solid var(--color-border-secondary)",
      background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    }}><ChevLeft /></button>
  );
}

// ============ 1. FEED ============
type Drop = { id: string; seller: string; handle: string; avBg: string; avFg: string; init: string; name: string; status: "live" | "soon" | "sold"; soonText?: string; previews: string[]; left?: number; total?: number; price: string; sub?: string; followed?: boolean };

const DROPS: Drop[] = [
  { id: "1", seller: "jhaazi_picks", handle: "@jhaazi_picks", avBg: "#E1F5EE", avFg: "#085041", init: "JP", name: "Summer Stories", status: "live", previews: ["#D3D1C7", "#B4B2A9", "#888780"], left: 5, price: "₹600–₹1,400" },
  { id: "2", seller: "secondhand_ria", handle: "@secondhand_ria", avBg: "#FBEAF0", avFg: "#72243E", init: "SR", name: "Vintage Bombay Edit", status: "live", previews: ["#F4C0D1", "#ED93B1", "#D4537E"], left: 8, price: "₹400–₹1,100" },
  { id: "3", seller: "thrift_by_kavya", handle: "@thrift_by_kavya", avBg: "#EEEDFE", avFg: "#3C3489", init: "TK", name: "Y2K Drop No. 4", status: "soon", soonText: "in 2h", previews: ["#CECBF6", "#AFA9EC", "#7F77DD"], total: 10, price: "₹500–₹2,000" },
  { id: "4", seller: "nomad_vintage", handle: "@nomad_vintage", avBg: "#FAEEDA", avFg: "#633806", init: "NV", name: "Monsoon Grunge", status: "sold", previews: ["#FAC775", "#EF9F27", "#BA7517"], sub: "all gone · 47 min ago", price: "" },
];

function Feed({ go, followingSeller, setFollowingSeller }: { go: (s: Screen) => void; followingSeller: boolean; setFollowingSeller: (v: boolean) => void }) {
  const [filter, setFilter] = useState<"all" | "live" | "following" | "upcoming">("all");
  const [follows, setFollows] = useState<Record<string, boolean>>({ "1": followingSeller });

  useEffect(() => { setFollows(f => ({ ...f, "1": followingSeller })); }, [followingSeller]);

  const visible = DROPS.filter(d => {
    if (filter === "live") return d.status === "live";
    if (filter === "upcoming") return d.status === "soon";
    if (filter === "following") return follows[d.id];
    return true;
  });

  const toggleFollow = (id: string) => {
    const next = !follows[id];
    setFollows({ ...follows, [id]: next });
    if (id === "1") setFollowingSeller(next);
  };

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 500 }}>jhaazi</span>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {(["all", "live", "following", "upcoming"] as const).map(f => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "all drops" : f === "live" ? "live now" : f}</Chip>
        ))}
      </div>

      {visible.some(d => d.status === "live") && <SectionLabel>live now</SectionLabel>}
      {visible.filter(d => d.status === "live").map(d => (
        <DropCard key={d.id} d={d} followed={!!follows[d.id]} onFollow={() => toggleFollow(d.id)} onView={() => go("drop")} />
      ))}

      {visible.some(d => d.status !== "live") && <SectionLabel style={{ marginTop: 16 }}>{visible.some(d => d.status === "soon") ? "dropping soon" : "past drops"}</SectionLabel>}
      {visible.filter(d => d.status !== "live").map(d => (
        <DropCard key={d.id} d={d} followed={!!follows[d.id]} onFollow={() => toggleFollow(d.id)} onView={() => go("drop")} />
      ))}
    </div>
  );
}

const SectionLabel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 10px", ...style }}>{children}</p>
);

const Chip = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} style={{
    fontSize: 12, padding: "5px 12px", borderRadius: 20,
    border: "0.5px solid " + (active ? "var(--color-text-primary)" : "var(--color-border-secondary)"),
    background: active ? "var(--color-text-primary)" : "var(--color-background-primary)",
    color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  }}>{children}</button>
);

function DropCard({ d, followed, onFollow, onView }: { d: Drop; followed: boolean; onFollow: () => void; onView: () => void }) {
  const isSold = d.status === "sold";
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid " + (followed && !isSold ? "var(--color-border-success)" : "var(--color-border-tertiary)"),
      borderRadius: 14, padding: 12, marginBottom: 10, opacity: isSold ? 0.45 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.avBg, color: d.avFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>{d.init}</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{d.seller}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{d.handle}</p>
        </div>
        {isSold ? (
          <span style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", fontWeight: 500 }}>sold out</span>
        ) : (
          <button onClick={onFollow} style={{
            marginLeft: "auto", fontSize: 11, padding: "4px 10px", borderRadius: 20,
            border: "0.5px solid " + (followed ? "var(--color-border-success)" : "var(--color-border-secondary)"),
            background: followed ? "var(--color-background-success)" : "transparent",
            color: followed ? "var(--color-text-success)" : "var(--color-text-secondary)",
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}>{followed ? "following" : "+ follow"}</button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0, flex: 1 }}>{d.name}</p>
        {d.status === "live" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500 }}>live</span>}
        {d.status === "soon" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-warning)", color: "var(--color-text-warning)", fontWeight: 500 }}>{d.soonText}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {d.previews.map((c, i) => <div key={i} style={{ flex: 1, aspectRatio: "1", borderRadius: 6, background: c, maxWidth: 72 }} />)}
        <div style={{ flex: 1, aspectRatio: "1", borderRadius: 6, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-tertiary)", maxWidth: 72 }}>+{Math.floor(Math.random() * 6) + 2}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isSold ? (
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{d.sub}</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}><span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{d.left ?? d.total}</span> {d.left ? "left" : "items"}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>{d.price}</span>
            {d.status === "live" ? (
              <button onClick={onView} style={{ marginLeft: "auto", fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "var(--color-text-primary)", color: "var(--color-background-primary)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>view drop ↗</button>
            ) : (
              <button onClick={onFollow} style={{
                marginLeft: "auto", fontSize: 12, padding: "6px 14px", borderRadius: 20,
                border: "0.5px solid " + (followed ? "var(--color-border-success)" : "var(--color-border-secondary)"),
                background: followed ? "var(--color-background-success)" : "transparent",
                color: followed ? "var(--color-text-success)" : "var(--color-text-secondary)",
                cursor: "pointer", fontFamily: "inherit",
              }}>{followed ? "reminding ✓" : "remind me"}</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============ 2. DROP LANDING ============
const ITEMS = [
  { id: "i1", name: "Floral midi dress", price: "₹850", tag: "S · excellent", cat: "western", status: "available", color: "#B4B2A9" },
  { id: "i2", name: "Levi's 501 jeans", price: "₹1,200", tag: "W28 · good", cat: "western", status: "gone", color: "#D3D1C7" },
  { id: "i3", name: "Vintage blazer", price: "₹1,100", tag: "M · excellent", cat: "western", status: "available", color: "#888780" },
  { id: "i4", name: "Embroidered kurta", price: "₹650", tag: "S · like new", cat: "ethnic", status: "available", color: "#F4C0D1" },
  { id: "i5", name: "Silk anarkali", price: "₹900", tag: "M · good", cat: "ethnic", status: "gone", color: "#ED93B1" },
  { id: "i6", name: "Oversized white shirt", price: "₹600", tag: "L · excellent", cat: "western", status: "available", color: "#5F5E5A" },
  { id: "i7", name: "Y2K cargo pants", price: "₹1,400", tag: "S/M · like new", cat: "western", status: "available", color: "#CECBF6" },
];

function DropLanding({ go, followingSeller, setFollowingSeller }: { go: (s: Screen) => void; followingSeller: boolean; setFollowingSeller: (v: boolean) => void }) {
  const [filter, setFilter] = useState<"all" | "available" | "western" | "ethnic">("all");
  const visible = ITEMS.filter(i => filter === "all" ? true : filter === "available" ? i.status === "available" : i.cat === filter);

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}><BackBtn onClick={() => go("feed")} /></div>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>JP</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>214 followers</p>
            </div>
            <button onClick={() => setFollowingSeller(!followingSeller)} style={{
              fontSize: 12, padding: "6px 14px", borderRadius: 20,
              border: "0.5px solid " + (followingSeller ? "var(--color-border-success)" : "var(--color-border-secondary)"),
              background: followingSeller ? "var(--color-background-success)" : "none",
              color: followingSeller ? "var(--color-text-success)" : "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "inherit",
            }}>{followingSeller ? "following" : "+ follow"}</button>
          </div>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 6px" }}>Summer Stories</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <span className="j-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-danger)" }} />live now
            </span>
            <Pill>7 items</Pill><Pill>₹600 – ₹1,400</Pill><Pill>first come first serve</Pill>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", overflowX: "auto" }}>
          {(["all", "available", "western", "ethnic"] as const).map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--color-border-tertiary)" }}>
          {visible.map(it => {
            const gone = it.status === "gone";
            return (
              <div key={it.id} onClick={() => !gone && go("item")} style={{ background: "var(--color-background-primary)", cursor: gone ? "default" : "pointer" }}>
                <div style={{ aspectRatio: "3/4", background: it.color, position: "relative" }}>
                  {gone && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", padding: "4px 10px", borderRadius: 20 }}>claimed</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "8px 10px 10px" }}>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 2px", color: gone ? "var(--color-text-tertiary)" : "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</p>
                  <p style={{ fontSize: 12, margin: "0 0 4px", color: gone ? "var(--color-text-tertiary)" : "var(--color-text-secondary)" }}>{it.price}</p>
                  <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0 }}>{it.tag}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}><span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>5</span> of 7 still available</p>
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-success)" }} />31 people here
          </p>
        </div>
      </div>
    </div>
  );
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>{children}</span>
);

// ============ 3. ITEM DETAIL ============
function ItemDetail({ go }: { go: (s: Screen) => void }) {
  const colors = ["#B4B2A9", "#888780", "#5F5E5A", "#D3D1C7"];
  const [photo, setPhoto] = useState(0);
  const [claimed, setClaimed] = useState(false);

  const claim = () => {
    setClaimed(true);
    setTimeout(() => go("booking"), 700);
  };

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <BackBtn onClick={() => go("drop")} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>jhaazi_picks</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>Summer Stories drop</p>
          </div>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500 }}>live</span>
        </div>

        <div style={{ position: "relative", aspectRatio: "4/5", background: colors[photo], transition: "background 0.2s" }}>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {colors.map((_, i) => (
              <div key={i} onClick={() => setPhoto(i)} style={{ width: 5, height: 5, borderRadius: "50%", background: i === photo ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", overflowX: "auto" }}>
          {colors.map((c, i) => (
            <div key={i} onClick={() => setPhoto(i)} style={{
              width: 52, height: 52, borderRadius: 6, background: c, flexShrink: 0, cursor: "pointer",
              border: "1.5px solid " + (i === photo ? "var(--color-text-primary)" : "transparent"),
            }} />
          ))}
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px" }}>Floral midi dress</p>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 14px" }}>₹850</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <Pill>size S</Pill><Pill>fits 26–28"</Pill>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-success)", color: "var(--color-text-success)", border: "0.5px solid var(--color-border-success)" }}>excellent condition</span>
            <Pill>western</Pill><Pill>vintage</Pill>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--color-border-tertiary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            {[["bust", '34"'], ["waist", '28"'], ["length", '42"'], ["shoulders", '14"']].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 12px", background: "var(--color-background-primary)" }}>
                <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 2px" }}>{l}</p>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 6px" }}>seller's note</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>gorgeous floral print, slight puff sleeves, midi length hits below the knee. no stains, no pilling. wore once to a wedding. fabric is super flowy — great for summer.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px 12px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-text-success)" }} />
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>available · <span style={{ color: "var(--color-text-danger)", fontWeight: 500 }}>2 people eyeing this</span></p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button style={{ padding: "12px 16px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "none", fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>ask seller ↗</button>
          <button onClick={claim} disabled={claimed} style={{
            flex: 1, padding: 13, borderRadius: 8, border: claimed ? "0.5px solid var(--color-border-success)" : "none",
            background: claimed ? "var(--color-background-success)" : "var(--color-text-primary)",
            color: claimed ? "var(--color-text-success)" : "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>{claimed ? "claimed ✓" : "claim this"}</button>
        </div>
      </div>
    </div>
  );
}

// ============ 4. BOOKING ============
function Booking({ go }: { go: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Priya Mehta");
  const [phone, setPhone] = useState("98765 43210");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const t1 = setTimeout(() => setDone(true), 1800);
      const t2 = setTimeout(() => go("follow"), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [step, go]);

  const back = () => step > 1 ? setStep(step - 1) : go("item");
  const labels = ["claim your item", "shipping details", "confirming"];

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={back} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{labels[step - 1]}</span>
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= step ? "var(--color-text-primary)" : "var(--color-border-secondary)" }} />)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "#B4B2A9", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>Floral midi dress</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
              <span className="j-pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-danger)", marginRight: 4 }} />
              someone else might grab this · move fast
            </p>
          </div>
        </div>

        {step === 1 && (
          <div style={{ padding: "20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--color-background-warning)", borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "var(--color-text-warning)", margin: 0 }}>⚠ 3 people are looking at this item right now</p>
            </div>
            <Field label="your name"><input value={name} onChange={e => setName(e.target.value)} style={fieldStyle} /></Field>
            <Field label="phone number"><input value={phone} onChange={e => setPhone(e.target.value)} style={fieldStyle} /></Field>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "-8px 0 16px" }}>we'll send your booking details here</p>
            <button onClick={() => setStep(2)} disabled={!name.trim() || !phone.trim()} style={btnPrimary(!name.trim() || !phone.trim())}>next — shipping details</button>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
              <Trust>verified sellers</Trust><Trust>secure booking</Trust><Trust>instant confirm</Trust>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: "20px 16px" }}>
            <Field label="delivery address"><input placeholder="flat / house no., building" style={fieldStyle} /></Field>
            <Field><input placeholder="area, street, locality" style={fieldStyle} /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Field label="city"><input placeholder="Mumbai" style={fieldStyle} /></Field>
              <Field label="pincode"><input placeholder="400001" maxLength={6} style={fieldStyle} /></Field>
            </div>
            <button onClick={() => setStep(3)} style={btnPrimary(false)}>confirm booking</button>
            <p style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 10 }}>your details stay with the seller only</p>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            {!done ? (
              <div className="j-spin" style={{ width: 40, height: 40, border: "2px solid var(--color-border-tertiary)", borderTopColor: "var(--color-text-primary)", borderRadius: "50%", margin: "0 auto 20px" }} />
            ) : (
              <div style={{ width: 40, height: 40, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}><Check w={32} /></div>
            )}
            <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 6px" }}>{done ? "you got it" : "securing your item"}</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{done ? "taking you to payment" : "making sure no one else gets it"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-primary)", fontSize: 14, color: "var(--color-text-primary)",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  width: "100%", padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, border: "none",
  background: "var(--color-text-primary)", color: "var(--color-background-primary)",
  cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, fontFamily: "inherit",
});
const Field = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <div style={{ flex: 1, marginBottom: 16 }}>
    {label && <label style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 6px", display: "block" }}>{label}</label>}
    {children}
  </div>
);
const Trust = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>✓ {children}</span>
);

// ============ 5. FOLLOW SELLER ============
function FollowSeller({ go, setFollowingSeller }: { go: (s: Screen) => void; setFollowingSeller: (v: boolean) => void }) {
  const [followed, setFollowed] = useState(false);
  const [hint, setHint] = useState(false);

  const doFollow = () => {
    setFollowed(true);
    setFollowingSeller(true);
    setTimeout(() => setHint(true), 300);
  };

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto", minHeight: 680, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "32px 24px 24px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Check /></div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>you got it</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>booking confirmed · Priya M.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: "#B4B2A9", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>Floral midi dress</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>₹850 · size S · excellent condition</p>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 8px" }}>complete your payment</p>
          <button style={{ width: "100%", padding: 12, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>pay ₹850 via UPI</button>
        </div>

        <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500 }}>JP</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{followed ? 215 : 214} followers on jhaazi</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {followed ? "you're in. jhaazi_picks' drops come straight to you now." : "get notified the moment jhaazi_picks drops next. no missing out, no checking instagram."}
          </p>
          <button onClick={doFollow} style={{
            width: "100%", padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer",
            border: followed ? "0.5px solid var(--color-border-success)" : "none",
            background: followed ? "var(--color-background-success)" : "var(--color-text-primary)",
            color: followed ? "var(--color-text-success)" : "var(--color-background-primary)", fontFamily: "inherit",
          }}>{followed ? "following ✓" : "follow jhaazi_picks"}</button>
          <button onClick={() => go("feed")} style={{ background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 12, width: "100%", fontFamily: "inherit" }}>{followed ? "back to feed" : "maybe later"}</button>

          <div style={{ marginTop: 16, padding: 12, background: "var(--color-background-secondary)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, opacity: hint ? 1 : 0, transition: "opacity 0.4s" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-text-success)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>next drop from jhaazi_picks · this saturday 7pm · you'll be the first to know</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 6. SELLER LIVE DASHBOARD ============
function SellerDashboard({ go }: { go: (s: Screen) => void }) {
  const [followers, setFollowers] = useState(214);
  const [bookings, setBookings] = useState([
    { id: "b1", name: "Priya M.", item: "Floral midi dress", price: "₹850", time: "just now", paid: false },
    { id: "b2", name: "Aarti S.", item: "Vintage blazer", price: "₹1,100", time: "4 min ago", paid: true },
    { id: "b3", name: "Riya K.", item: "Embroidered kurta", price: "₹650", time: "12 min ago", paid: true },
  ]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFollowers(f => f + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const totalRevenue = bookings.reduce((s, b) => s + parseInt(b.price.replace(/[^\d]/g, "")), 0);

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}><BackBtn onClick={() => go("feed")} /></div>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>JP</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>your live dashboard</p>
            </div>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <span className="j-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-danger)" }} />live
            </span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Summer Stories</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>5 of 7 items left · started 23 min ago</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--color-border-tertiary)" }}>
          <Stat label="bookings" value={bookings.length.toString()} />
          <Stat label="revenue" value={`₹${totalRevenue.toLocaleString()}`} />
          <Stat label="followers" value={followers.toString()} highlight={pulse} />
        </div>

        <div style={{ padding: "16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 10px" }}>recent bookings</p>
          {bookings.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                {b.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1px" }}>{b.name} <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>· {b.time}</span></p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{b.item} · {b.price}</p>
              </div>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500,
                background: b.paid ? "var(--color-background-success)" : "var(--color-background-warning)",
                color: b.paid ? "var(--color-text-success)" : "var(--color-text-warning)",
              }}>{b.paid ? "paid" : "awaiting pay"}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button style={{ width: "100%", padding: 12, borderRadius: 8, background: "var(--color-text-primary)", color: "var(--color-background-primary)", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>share drop link ↗</button>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div style={{ background: "var(--color-background-primary)", padding: "14px 12px", textAlign: "center", transition: "background 0.4s", ...(highlight ? { background: "var(--color-background-success)" } : {}) }}>
    <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 2px" }}>{value}</p>
    <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
  </div>
);

// ============ 7. MY FOLLOWS (placeholder) ============
function MyFollows() {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: 16, maxWidth: 390, margin: "0 auto" }}>
      <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>my follows</p>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: 40, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-background-secondary)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart />
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>sellers you follow show up here</p>
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>get notified the moment they drop</p>
      </div>
    </div>
  );
}
