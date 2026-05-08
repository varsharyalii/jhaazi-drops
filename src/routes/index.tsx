import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevLeft, Bell, Check, Heart } from "@/components/jhaazi/icons";

export const Route = createFileRoute("/")({ component: App });

type Screen =
  | "landing"
  | "feed" | "drop" | "item" | "claimHold" | "signup" | "booking" | "missed" | "follow" | "myfollows" | "sellerStore"
  | "sellerApply" | "sellerApplyPending" | "sellerApplyApproved"
  | "sellerProfile" | "createDrop" | "addItem" | "dropPreview" | "shareDrop" | "dashboard"
  | "sellerOrders" | "sellerTracking";

type Role = "guest" | "buyer" | "seller";
type Session = { role: Role; name?: string; sellerApproved?: boolean };
type GoFn = (s: Screen) => void;

// screens that show the global top nav bar (buyer-facing browse surfaces)
const TOPBAR_SCREENS: Screen[] = ["feed", "drop", "item", "myfollows", "sellerStore"];

// 10-minute claim hold (in ms). Lowered for demo so it's actually visible.
const HOLD_MS = 10 * 60 * 1000;

type ClaimedItem = { name: string; price: string; size: string; deadline: number };

// ============ APP SHELL ============
function App() {
  const [session, setSession] = useState<Session>({ role: "guest" });
  const [screen, setScreen] = useState<Screen>("feed");
  const [jumpOpen, setJumpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [followingSeller, setFollowingSeller] = useState(true);
  const [claim, setClaim] = useState<ClaimedItem | null>(null);

  const signedIn = session.role !== "guest";
  const go: GoFn = (s) => { setScreen(s); setJumpOpen(false); setMenuOpen(false); window.scrollTo(0, 0); };

  const setRole = (role: Role) => {
    if (role === "seller") setSession({ role: "seller", sellerApproved: true });
    else if (role === "buyer") setSession({ role: "buyer" });
    else setSession({ role: "guest" });
    // route to that role's home
    go(role === "seller" ? "dashboard" : "feed");
  };

  // global hold-expiry watcher — if a claim exists and timer runs out anywhere
  // inside the buyer purchase funnel, kick the user to the "just missed it" screen.
  useEffect(() => {
    if (!claim) return;
    const inFunnel = ["claimHold", "signup", "booking"].includes(screen);
    if (!inFunnel) return;
    const remaining = claim.deadline - Date.now();
    if (remaining <= 0) { setClaim(null); go("missed"); return; }
    const t = setTimeout(() => { setClaim(null); go("missed"); }, remaining);
    return () => clearTimeout(t);
  }, [claim, screen]);

  const startClaim = (item: Omit<ClaimedItem, "deadline">) => {
    setClaim({ ...item, deadline: Date.now() + HOLD_MS });
    go("claimHold");
  };
  const proceedToCheckout = () => go(signedIn ? "booking" : "signup");
  const completeSignup = () => {
    setSession(prev => prev.role === "guest" ? { role: "buyer" } : prev);
    go(claim ? "booking" : "feed");
  };
  const approveSeller = () => {
    setSession({ role: "seller", sellerApproved: true });
    go("sellerApplyApproved");
  };

  const onboardingScreens: { id: Screen; label: string }[] = [
    { id: "sellerApply", label: "a · apply to sell" },
    { id: "sellerApplyPending", label: "b · application pending" },
    { id: "sellerApplyApproved", label: "c · approved + invite" },
  ];
  const sellerScreens: { id: Screen; label: string }[] = [
    { id: "dashboard", label: "1 · seller dashboard (home)" },
    { id: "sellerOrders", label: "2 · orders & shipping" },
    { id: "sellerTracking", label: "3 · tracking ids" },
    { id: "sellerProfile", label: "4 · store setup" },
    { id: "createDrop", label: "5 · create drop" },
    { id: "addItem", label: "6 · add item" },
    { id: "dropPreview", label: "7 · drop preview" },
    { id: "shareDrop", label: "8 · share drop link" },
  ];
  const buyerScreens: { id: Screen; label: string }[] = [
    { id: "feed", label: "1 · marketplace feed" },
    { id: "drop", label: "2 · drop landing" },
    { id: "item", label: "3 · item detail" },
    { id: "claimHold", label: "4 · claim hold (10-min timer)" },
    { id: "signup", label: "5 · signup at checkout" },
    { id: "booking", label: "6 · booking & payment" },
    { id: "missed", label: "7 · just missed it" },
    { id: "follow", label: "8 · follow seller" },
    { id: "myfollows", label: "9 · my follows" },
    { id: "sellerStore", label: "10 · seller storefront" },
  ];

  const showTopBar = TOPBAR_SCREENS.includes(screen);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-secondary)", paddingBottom: 80 }}>
      {showTopBar && <TopBar onMenu={() => setMenuOpen(true)} onLogo={() => go(session.role === "seller" ? "dashboard" : "feed")} />}
      <div style={{ paddingTop: showTopBar ? 0 : 12 }}>
        {screen === "landing" && <Landing go={go} />}
        {screen === "feed" && <Feed go={go} followingSeller={followingSeller} setFollowingSeller={setFollowingSeller} />}
        {screen === "drop" && <DropLanding go={go} followingSeller={followingSeller} setFollowingSeller={setFollowingSeller} />}
        {screen === "item" && <ItemDetail go={go} startClaim={startClaim} />}
        {screen === "claimHold" && <ClaimHold claim={claim} onCheckout={proceedToCheckout} onRelease={() => { setClaim(null); go("drop"); }} />}
        {screen === "signup" && <Signup go={go} onDone={completeSignup} claim={claim} />}
        {screen === "missed" && <Missed go={go} />}
        {screen === "booking" && <Booking go={go} claim={claim} signedIn={signedIn} onDone={() => { setClaim(null); go("follow"); }} />}
        {screen === "follow" && <FollowSeller go={go} setFollowingSeller={setFollowingSeller} />}
        {screen === "myfollows" && <MyFollows go={go} />}
        {screen === "sellerStore" && <SellerStore go={go} followingSeller={followingSeller} setFollowingSeller={setFollowingSeller} />}
        {screen === "sellerApply" && <SellerApply go={go} />}
        {screen === "sellerApplyPending" && <SellerApplyPending go={go} onApprove={approveSeller} />}
        {screen === "sellerApplyApproved" && <SellerApplyApproved go={go} />}
        {screen === "sellerProfile" && <SellerProfile go={go} />}
        {screen === "createDrop" && <CreateDrop go={go} />}
        {screen === "addItem" && <AddItem go={go} />}
        {screen === "dropPreview" && <DropPreview go={go} />}
        {screen === "shareDrop" && <ShareDrop go={go} />}
        {screen === "dashboard" && <SellerDashboard go={go} />}
        {screen === "sellerOrders" && <SellerOrders go={go} />}
        {screen === "sellerTracking" && <SellerTracking go={go} ownerView />}
      </div>

      {menuOpen && <SideMenu go={go} onClose={() => setMenuOpen(false)} session={session} setRole={setRole} />}

      {/* Floating jump-to-screen pill */}
      <button
        onClick={() => setJumpOpen(true)}
        style={{
          position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)",
          background: "var(--color-text-primary)", color: "var(--color-background-primary)",
          fontSize: 12, fontWeight: 500, padding: "10px 18px", borderRadius: 999,
          border: "none", cursor: "pointer", fontFamily: "inherit", zIndex: 60,
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75" }} />
        jump to screen
      </button>

      {jumpOpen && (
        <div onClick={() => setJumpOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--color-background-primary)", width: "100%", maxWidth: 390,
            borderRadius: "16px 16px 0 0", padding: "12px 0 24px", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--color-border-tertiary)", borderRadius: 2, margin: "4px auto 16px" }} />
            <div style={{ padding: "0 18px" }}>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 8px" }}>view as</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                {(["guest", "buyer", "seller"] as Role[]).map(r => {
                  const active = session.role === r;
                  return (
                    <button key={r} onClick={() => setRole(r)} style={{
                      flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      border: "0.5px solid " + (active ? "var(--color-text-primary)" : "var(--color-border-secondary)"),
                      background: active ? "var(--color-text-primary)" : "var(--color-background-primary)",
                      color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
                      fontWeight: active ? 500 : 400,
                    }}>{r}</button>
                  );
                })}
              </div>

              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "18px 0 8px" }}>navigate</p>
              <button onClick={() => go("landing")} style={jumpItemStyle(screen === "landing")}>landing</button>

              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "18px 0 8px" }}>seller onboarding</p>
              {onboardingScreens.map(s => (
                <button key={s.id} onClick={() => go(s.id)} style={jumpItemStyle(screen === s.id)}>{s.label}</button>
              ))}

              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "18px 0 8px" }}>seller flow</p>
              {sellerScreens.map(s => (
                <button key={s.id} onClick={() => go(s.id)} style={jumpItemStyle(screen === s.id)}>{s.label}</button>
              ))}

              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "18px 0 8px" }}>buyer flow</p>
              {buyerScreens.map(s => (
                <button key={s.id} onClick={() => go(s.id)} style={jumpItemStyle(screen === s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const jumpItemStyle = (active: boolean): React.CSSProperties => ({
  display: "block", width: "100%", textAlign: "left",
  padding: "11px 12px", marginBottom: 4, borderRadius: 8,
  background: active ? "var(--color-text-primary)" : "var(--color-background-secondary)",
  color: active ? "var(--color-background-primary)" : "var(--color-text-primary)",
  border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: active ? 500 : 400,
});

// ============ shared ============
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: "50%", border: "0.5px solid var(--color-border-secondary)",
      background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    }}><ChevLeft /></button>
  );
}

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "transparent", borderRadius: 0, padding: 0, maxWidth: 390, margin: "0 auto" }}>{children}</div>
);
const Screen = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "var(--color-background-primary)", borderRadius: 0, border: "none", overflow: "hidden" }}>{children}</div>
);

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-primary)", fontSize: 14, color: "var(--color-text-primary)",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 6px", display: "block",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 10px",
};
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>{children}</span>
);
const Chip = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} style={{
    fontSize: 12, padding: "6px 12px", borderRadius: 20,
    border: "0.5px solid " + (active ? "var(--color-text-primary)" : "var(--color-border-secondary)"),
    background: active ? "var(--color-text-primary)" : "var(--color-background-primary)",
    color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  }}>{children}</button>
);
const StepBars = ({ active, total = 3 }: { active: number; total?: number }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ height: 3, width: 28, borderRadius: 10, background: i < active ? "var(--color-text-primary)" : "var(--color-border-tertiary)" }} />
    ))}
  </div>
);

// underline tab row — used in place of rounded filter chips (information surfaces only)
function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 18, overflowX: "auto", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 16px" }}>
      {items.map(it => {
        const active = value === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            background: "none", border: "none", padding: "10px 0", cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, fontWeight: active ? 500 : 400, whiteSpace: "nowrap",
            color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: "1.5px solid " + (active ? "var(--color-text-primary)" : "transparent"),
            marginBottom: -0.5,
          }}>
            {it.label}{typeof it.count === "number" && <span style={{ color: "var(--color-text-secondary)", marginLeft: 4, fontWeight: 400 }}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ============ TOP NAV BAR ============
function TopBar({ onMenu, onLogo }: { onMenu: () => void; onLogo: () => void }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ maxWidth: 390, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onLogo} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>
          jhaazi
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button aria-label="notifications" style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--color-border-tertiary)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell />
          </button>
          <button aria-label="menu" onClick={onMenu} style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--color-border-tertiary)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="var(--color-text-primary)" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SideMenu({ go, onClose, session, setRole }: { go: GoFn; onClose: () => void; session: Session; setRole: (r: Role) => void }) {
  const item = (label: string, sub: string, onClick: () => void) => (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left", padding: "14px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)", borderTop: "none", borderLeft: "none", borderRight: "none",
      background: "none", cursor: "pointer", fontFamily: "inherit",
    }}>
      <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{sub}</p>
    </button>
  );
  const role = session.role;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 0, right: 0, height: "100%", width: 280, maxWidth: "85%",
        background: "var(--color-background-primary)", padding: "20px 20px 24px", display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>menu</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "var(--color-text-tertiary)", cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 14px" }}>signed in as <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{role}</span></p>

        {role === "seller" ? (
          <>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 4px" }}>your store</p>
            {item("dashboard", "live drop, orders, followers", () => go("dashboard"))}
            {item("create new drop", "set up your next drop", () => go("createDrop"))}
            {item("orders & shipping", "buyer addresses & contact", () => go("sellerOrders"))}
            {item("tracking ids", "upload after shipment, share with followers", () => go("sellerTracking"))}
            {item("my profile", "edit your storefront", () => go("sellerProfile"))}
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "20px 0 4px" }}>account</p>
            {item("switch to buyer view", "browse drops as a buyer", () => setRole("buyer"))}
            {item("sign out", "back to guest", () => setRole("guest"))}
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 4px" }}>browse</p>
            {item("drops", "all live & upcoming drops", () => go("feed"))}
            {item("my follows", "sellers you follow", () => go("myfollows"))}
            {role === "buyer" && item("my orders", "track your purchases", () => go("myfollows"))}
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "20px 0 4px" }}>account</p>
            {role === "guest"
              ? item("sign up / log in", "save your follows & orders", () => go("signup"))
              : item("sign out", "back to guest", () => setRole("guest"))}
            {item("become a seller", "apply to open a store", () => go("sellerApply"))}
          </>
        )}
      </div>
    </div>
  );
}

// ============ SELLER APPLICATION (gated onboarding) ============
function SellerApply({ go }: { go: GoFn }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [insta, setInsta] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [why, setWhy] = useState("");
  const [photos, setPhotos] = useState(0);

  const toggleCat = (c: string) => setCats(cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c]);
  const ready = !!name.trim() && phone.length >= 10 && otp.length === 4 && !!email.trim() && !!city.trim() && !!insta.trim() && cats.length > 0 && why.trim().length >= 20;

  return (
    <Wrap>
      <div style={{ marginBottom: 8 }}><BackBtn onClick={() => go("feed")} /></div>
      <Screen>
        <div style={{ padding: "24px 18px 18px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 6px" }}>seller application</p>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 6px" }}>apply to sell on jhaazi</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>we curate every seller to keep quality high for buyers. takes ~2 minutes — most applications hear back within 1–2 days.</p>
        </div>

        <div style={{ padding: "20px 16px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>your name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="full name" style={fieldStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>phone</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" style={{ ...fieldStyle, flex: 1 }} />
              <button onClick={() => phone.length >= 10 && setOtpSent(true)} style={{
                padding: "0 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)",
                color: "var(--color-text-secondary)", whiteSpace: "nowrap", opacity: phone.length >= 10 ? 1 : 0.4,
              }}>{otpSent ? "resend" : "send otp"}</button>
            </div>
          </div>
          {otpSent && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>otp (try 1234)</label>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" maxLength={4} style={{ ...fieldStyle, letterSpacing: "0.4em", textAlign: "center" }} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={fieldStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>city</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" style={fieldStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>instagram</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-tertiary)" }}>@</span>
                <input value={insta} onChange={e => setInsta(e.target.value)} placeholder="handle" style={{ ...fieldStyle, paddingLeft: 24 }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>what you sell</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["western wear", "ethnic", "vintage", "y2k", "accessories", "denim", "luxury resale"].map(c => (
                <Chip key={c} active={cats.includes(c)} onClick={() => toggleCat(c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>why do you want to sell here?</label>
            <textarea value={why} onChange={e => setWhy(e.target.value.slice(0, 240))} placeholder="tell us about your sourcing, your taste, why jhaazi..." style={{ ...fieldStyle, height: 84, resize: "none", lineHeight: 1.5 }} />
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right", margin: "4px 0 0" }}>{why.length} / 240 · min 20</p>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>sample photos <span style={{ color: "var(--color-text-tertiary)" }}>(2–4 of pieces you'd sell)</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <button key={i} onClick={() => setPhotos(Math.max(photos, i + 1))} style={{
                  width: 60, height: 60, borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  border: i < photos ? "0.5px solid var(--color-border-tertiary)" : "1px dashed var(--color-border-secondary)",
                  background: i < photos ? ["#B4B2A9", "#888780", "#CECBF6", "#F4C0D1"][i] : "var(--color-background-primary)",
                  color: "var(--color-text-tertiary)", fontSize: 18,
                }}>{i < photos ? "" : "+"}</button>
              ))}
            </div>
          </div>
          <button onClick={() => ready && go("sellerApplyPending")} disabled={!ready} style={{
            width: "100%", padding: 13, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: ready ? "pointer" : "not-allowed",
            opacity: ready ? 1 : 0.3, fontFamily: "inherit",
          }}>submit application</button>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            we'll review and email you a private link to set up your store.
          </p>
        </div>
      </Screen>
    </Wrap>
  );
}

function SellerApplyPending({ go, onApprove }: { go: GoFn; onApprove: () => void }) {
  return (
    <Wrap>
      <div style={{ marginBottom: 8 }}><BackBtn onClick={() => go("feed")} /></div>
      <Screen>
        <div style={{ padding: "44px 24px 28px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>📨</div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>application received</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 14px", lineHeight: 1.5 }}>thanks for applying. our team reviews every seller — we'll email you within 1–2 days.</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 20, background: "var(--color-background-warning)", color: "var(--color-text-warning)", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> under review
          </span>
        </div>
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 10px" }}>what happens next</p>
          {[
            ["1", "we check your insta, sourcing & sample photos"],
            ["2", "you get an email with a private store-setup link"],
            ["3", "set up your store, schedule your first drop"],
          ].map(([n, t]) => (
            <div key={n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{n}</div>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{t}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          <button onClick={() => go("feed")} style={{
            width: "100%", padding: 13, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            border: "0.5px solid var(--color-border-secondary)", background: "none", color: "var(--color-text-primary)",
          }}>browse drops while you wait</button>
        </div>
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "12px 20px", background: "var(--color-background-secondary)", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 6px" }}>demo only</p>
          <button onClick={onApprove} style={{
            background: "none", border: "0.5px dashed var(--color-border-secondary)", padding: "6px 12px", borderRadius: 6,
            fontSize: 12, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit",
          }}>simulate approval →</button>
        </div>
      </Screen>
    </Wrap>
  );
}

function SellerApplyApproved({ go }: { go: GoFn }) {
  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "44px 24px 28px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Check w={28} /></div>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 6px" }}>you're in</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>welcome to jhaazi. your private store-setup link is ready.</p>
        </div>
        <div style={{ padding: "20px 20px 12px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 8px" }}>your invite link</p>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "ui-monospace, monospace", wordBreak: "break-all" }}>
            jhaazi.com/seller/setup?invite=jp-x7q2
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "8px 0 0", lineHeight: 1.5 }}>also sent to your email. link expires in 7 days.</p>
        </div>
        <div style={{ padding: "16px 20px 24px" }}>
          <button onClick={() => go("sellerProfile")} style={{
            width: "100%", padding: 13, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>create your store →</button>
          <button onClick={() => go("dashboard")} style={{
            width: "100%", padding: 12, borderRadius: 8, marginTop: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            border: "0.5px solid var(--color-border-secondary)", background: "none", color: "var(--color-text-primary)",
          }}>skip · go to dashboard</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ MY FOLLOWS (placeholder) ============
function MyFollows({ go }: { go: GoFn }) {
  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "28px 20px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 6px" }}>my follows</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>sellers you follow drop here first. you'll get a ping the moment they go live.</p>
        </div>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-background-secondary)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 6px" }}>no follows yet</p>
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 18px", lineHeight: 1.5 }}>find sellers whose taste matches yours.</p>
          <button onClick={() => go("feed")} style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>browse drops →</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ LANDING ============
function Landing({ go }: { go: GoFn }) {
  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "64px 24px 32px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 28, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.01em" }}>jhaazi</p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            social commerce for thrift sellers in india
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <button onClick={() => go("sellerApply")} style={{
            width: "100%", padding: 16, borderRadius: 10, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
          }}>apply to sell →</button>
          <button onClick={() => go("feed")} style={{
            width: "100%", padding: 16, borderRadius: 10,
            border: "0.5px solid var(--color-border-secondary)", background: "none",
            color: "var(--color-text-primary)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>browse drops</button>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 18 }}>
            your store · your followers · no algorithm
          </p>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ SELLER 1 — PROFILE CREATION ============
function SellerProfile({ go }: { go: GoFn }) {
  const [name, setName] = useState("");
  const [insta, setInsta] = useState("");
  const [photo, setPhoto] = useState(false);
  const [bio, setBio] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const initials = (name || "JP").slice(0, 2).toUpperCase();
  const ready = !!name.trim() && !!insta.trim();
  const toggleCat = (c: string) => setCats(cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c]);

  return (
    <Wrap>
      <div style={{ marginBottom: 0, padding: "12px 16px 8px" }}><BackBtn onClick={() => go("landing")} /></div>
      <Screen>
        <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>jhaazi</span>
          <StepBars active={1} />
        </div>
        <div style={{ padding: "28px 16px 22px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 22, fontWeight: 500, margin: "0 0 6px", letterSpacing: "-0.01em" }}>set up your store</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>this is your page on jhaazi — your buyers will see this every time you drop.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div onClick={() => setPhoto(true)} style={{
            width: 80, height: 80, borderRadius: "50%",
            background: photo ? "#E1F5EE" : "var(--color-background-secondary)",
            border: photo ? "0.5px solid var(--color-border-tertiary)" : "2px dashed var(--color-border-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 10,
          }}>
            {photo ? (
              <span style={{ fontSize: 24, fontWeight: 500, color: "#085041" }}>{initials}</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="var(--color-text-tertiary)" /><path d="M3 17c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="var(--color-text-tertiary)" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>add photo</span>
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>your drop page profile photo</span>
        </div>

        <div style={{ padding: "20px 16px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>store name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. jhaazi_picks" style={fieldStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>instagram handle</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-tertiary)" }}>@</span>
              <input value={insta} onChange={e => setInsta(e.target.value)} placeholder="yourhandle" style={{ ...fieldStyle, paddingLeft: 24 }} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>what you sell</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["western wear", "ethnic", "vintage", "y2k", "accessories", "denim", "luxury resale"].map(c => (
                <Chip key={c} active={cats.includes(c)} onClick={() => toggleCat(c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>your vibe <span style={{ color: "var(--color-text-tertiary)" }}>(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 120))} placeholder="tell buyers what makes your drops special..." style={{ ...fieldStyle, height: 72, resize: "none", lineHeight: 1.5 }} />
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right", margin: "4px 0 0" }}>{bio.length} / 120</p>
          </div>
        </div>
        <div style={{ padding: "0 16px 20px" }}>
          <button onClick={() => ready && go("createDrop")} disabled={!ready} style={{
            width: "100%", padding: 13, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: ready ? "pointer" : "not-allowed",
            opacity: ready ? 1 : 0.3, fontFamily: "inherit",
          }}>set up my first drop →</button>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 10 }}>your store is yours · no algorithm · no takedowns</p>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ SELLER 2 — CREATE DROP ============
type DropItem = { name: string; sub: string; color: string };
const MOCK_DROP_ITEMS: DropItem[] = [
  { name: "Floral midi dress", sub: "₹850 · size S · excellent", color: "#B4B2A9" },
  { name: "Vintage blazer", sub: "₹1,100 · size M · excellent", color: "#888780" },
  { name: "Y2K cargo pants", sub: "₹1,400 · size S · like new", color: "#CECBF6" },
];

// Module-scope so AddItem can append into the same drop
const dropState: { name: string; mode: "live" | "schedule"; date: string; time: string; items: DropItem[] } = {
  name: "", mode: "live", date: "", time: "", items: [],
};

function CreateDrop({ go }: { go: GoFn }) {
  const [, force] = useState(0);
  const tick = () => force(n => n + 1);
  const ready = !!dropState.name.trim() && dropState.items.length > 0 &&
    (dropState.mode === "live" || (dropState.date && dropState.time));

  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BackBtn onClick={() => go("sellerProfile")} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>create a drop</span>
          </div>
          <StepBars active={2} />
        </div>

        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>drop name</label>
            <input value={dropState.name} onChange={e => { dropState.name = e.target.value; tick(); }} placeholder="e.g. Summer Stories, Vol. 4" style={fieldStyle} />
          </div>
          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "4px 0 20px" }} />
          <p style={sectionLabel}>when is this dropping?</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {(["schedule", "live"] as const).map(m => {
              const active = dropState.mode === m;
              return (
                <button key={m} onClick={() => { dropState.mode = m; tick(); }} style={{
                  flex: 1, padding: 9, borderRadius: 8,
                  border: "0.5px solid " + (active ? "var(--color-text-primary)" : "var(--color-border-secondary)"),
                  background: active ? "var(--color-text-primary)" : "none",
                  color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>{m === "schedule" ? "schedule it" : "go live now"}</button>
              );
            })}
          </div>
          {dropState.mode === "schedule" && (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, marginBottom: 18 }}>
                  <label style={labelStyle}>date</label>
                  <input type="date" value={dropState.date} onChange={e => { dropState.date = e.target.value; tick(); }} style={fieldStyle} />
                </div>
                <div style={{ flex: 1, marginBottom: 18 }}>
                  <label style={labelStyle}>time</label>
                  <input type="time" value={dropState.time} onChange={e => { dropState.time = e.target.value; tick(); }} style={fieldStyle} />
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "0 0 16px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{dropState.items.length} item{dropState.items.length !== 1 ? "s" : ""} in this drop</span>
            <button onClick={() => go("addItem")} style={{
              fontSize: 12, padding: "6px 14px", borderRadius: 20,
              border: "0.5px solid var(--color-border-secondary)", background: "none",
              color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit",
            }}>+ add item</button>
          </div>

          {dropState.items.length === 0 ? (
            <div onClick={() => go("addItem")} style={{
              border: "0.5px dashed var(--color-border-secondary)", borderRadius: 8,
              padding: "24px 16px", textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👗</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 2px" }}>add your first item</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>photo, price, measurements — everything buyers need</p>
            </div>
          ) : (
            <>
              {dropState.items.map((it, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: 10,
                  border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, marginBottom: 8,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: it.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{it.name}</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{it.sub}</p>
                  </div>
                  <button onClick={() => { dropState.items.splice(i, 1); tick(); }} style={{
                    width: 24, height: 24, borderRadius: "50%", border: "0.5px solid var(--color-border-tertiary)",
                    background: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: 14,
                  }}>×</button>
                </div>
              ))}
              <div onClick={() => go("addItem")} style={{ textAlign: "center", padding: "8px 0", cursor: "pointer" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>+ add another item</span>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "12px 16px 20px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 10 }}>
          <button onClick={() => dropState.items.length > 0 && go("dropPreview")} style={{
            flex: 1, padding: 12, borderRadius: 8,
            border: "0.5px solid var(--color-border-secondary)", background: "none",
            fontSize: 14, color: "var(--color-text-secondary)", cursor: "pointer",
            opacity: dropState.items.length > 0 ? 1 : 0.4, fontFamily: "inherit",
          }}>preview</button>
          <button onClick={() => ready && go("shareDrop")} style={{
            flex: 2, padding: 12, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 14, fontWeight: 500, cursor: ready ? "pointer" : "not-allowed",
            opacity: ready ? 1 : 0.3, fontFamily: "inherit",
          }}>get my drop link →</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ SELLER 3 — ADD ITEM ============
const PHOTO_COLORS = ["#B4B2A9", "#888780", "#D3D1C7", "#5F5E5A", "#CECBF6", "#F4C0D1"];

function AddItem({ go }: { go: GoFn }) {
  const [photos, setPhotos] = useState<number>(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  const ready = !!name.trim() && !!price.trim() && !!size.trim() && photos > 0;

  const addToDrop = () => {
    if (!ready) return;
    setAdded(true);
    dropState.items.push({
      name: name.trim(),
      sub: `₹${price} · size ${size}${condition ? " · " + condition : ""}`,
      color: PHOTO_COLORS[dropState.items.length % PHOTO_COLORS.length],
    });
    setTimeout(() => go("createDrop"), 800);
  };

  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={() => go("createDrop")} />
          <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>add item</span>
          <StepBars active={3} />
        </div>

        <div style={{ maxHeight: 580, overflowY: "auto", padding: "20px 16px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>photos</label>
            {photos === 0 ? (
              <div onClick={() => setPhotos(1)} style={{
                border: "0.5px dashed var(--color-border-secondary)", borderRadius: 8,
                padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: "pointer", background: "var(--color-background-secondary)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--color-text-tertiary)" /><circle cx="8.5" cy="10.5" r="1.5" stroke="var(--color-text-tertiary)" /><path d="M3 16l5-4 4 3 3-2 6 4" stroke="var(--color-text-tertiary)" strokeLinecap="round" /></svg>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>tap to add photos</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>front, back, detail shots · up to 6 photos</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from({ length: photos }).map((_, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: 8, background: PHOTO_COLORS[i], position: "relative" }}>
                    <div onClick={() => setPhotos(p => p - 1)} style={{
                      position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%",
                      background: "var(--color-text-primary)", color: "var(--color-background-primary)",
                      fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}>×</div>
                  </div>
                ))}
                {photos < 6 && (
                  <div onClick={() => setPhotos(p => p + 1)} style={{
                    width: 64, height: 64, borderRadius: 8, border: "0.5px dashed var(--color-border-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    fontSize: 20, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)",
                  }}>+</div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>item name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Floral midi dress" style={fieldStyle} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, marginBottom: 16 }}>
              <label style={labelStyle}>price</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-tertiary)" }}>₹</span>
                <input value={price} onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ""))} placeholder="850" style={{ ...fieldStyle, paddingLeft: 24 }} />
              </div>
            </div>
            <div style={{ flex: 1, marginBottom: 16 }}>
              <label style={labelStyle}>size</label>
              <input value={size} onChange={e => setSize(e.target.value)} placeholder="S / M / W28" style={fieldStyle} />
            </div>
          </div>

          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "4px 0 18px" }} />
          <p style={sectionLabel}>measurements</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            {["bust", "waist", "length", "shoulders"].map(m => (
              <div key={m}>
                <label style={labelStyle}>{m}</label>
                <div style={{ position: "relative" }}>
                  <input placeholder="—" style={{ ...fieldStyle, paddingRight: 28 }} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--color-text-tertiary)" }}>"</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "18px 0" }} />
          <p style={sectionLabel}>condition</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            {["like new", "excellent", "good", "fair"].map(c => (
              <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>{c}</Chip>
            ))}
          </div>

          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "18px 0" }} />
          <p style={sectionLabel}>category</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            {["western", "ethnic", "vintage", "y2k", "accessories", "denim"].map(c => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
            ))}
          </div>

          <div style={{ height: 0.5, background: "var(--color-border-tertiary)", margin: "18px 0" }} />
          <div>
            <label style={labelStyle}>seller's note <span style={{ color: "var(--color-text-tertiary)" }}>(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 150))} placeholder="tell buyers something the photos can't..." style={{ ...fieldStyle, height: 80, resize: "none", lineHeight: 1.5 }} />
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right", margin: "4px 0 0" }}>{note.length} / 150</p>
          </div>
        </div>

        <div style={{ padding: "12px 16px 20px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button onClick={addToDrop} disabled={!ready || added} style={{
            width: "100%", padding: 13, borderRadius: 8, border: "none",
            background: added ? "var(--color-background-success)" : "var(--color-text-primary)",
            color: added ? "var(--color-text-success)" : "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: ready ? "pointer" : "not-allowed",
            opacity: ready || added ? 1 : 0.35, fontFamily: "inherit",
          }}>{added ? "added to drop ✓" : "add to drop"}</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ SELLER 4 — DROP PREVIEW ============
function DropPreview({ go }: { go: GoFn }) {
  const items = dropState.items.length ? dropState.items : MOCK_DROP_ITEMS;
  const dropName = dropState.name || "Summer Stories";
  const isScheduled = dropState.mode === "schedule" && dropState.date && dropState.time;
  const prices = items.map(i => parseInt(i.sub.replace(/[^\d]/g, "")) || 0);
  const minP = Math.min(...prices), maxP = Math.max(...prices);

  return (
    <Wrap>
      <div style={{ marginBottom: 0, padding: "12px 16px 8px" }}><BackBtn onClick={() => go("createDrop")} /></div>
      <Screen>
        <div style={{ background: "var(--color-background-warning)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 12, color: "var(--color-text-warning)", margin: 0, flex: 1, lineHeight: 1.4 }}>this is exactly what your buyers will see — check everything before you go live</p>
          <span onClick={() => go("createDrop")} style={{ fontSize: 12, color: "var(--color-text-warning)", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}>edit</span>
        </div>

        <div style={{ padding: "24px 16px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>JP</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>214 followers</p>
            </div>
            <button style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "0.5px solid var(--color-border-secondary)", background: "none", color: "var(--color-text-tertiary)", cursor: "default" }}>+ follow</button>
          </div>
          <p style={{ fontSize: 22, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.02em" }}>{dropName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {isScheduled
              ? <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-warning)", color: "var(--color-text-warning)", fontWeight: 500 }}>drops {dropState.date} {dropState.time}</span>
              : <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-success)", color: "var(--color-text-success)", fontWeight: 500 }}>going live now</span>}
            <Pill>{items.length} items</Pill>
            <Pill>₹{minP} – ₹{maxP}</Pill>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", overflowX: "auto" }}>
          {["all", "western", "ethnic", "vintage"].map((f, i) => <Chip key={f} active={i === 0}>{f}</Chip>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--color-border-tertiary)" }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: "var(--color-background-primary)" }}>
              <div style={{ aspectRatio: "3/4", background: it.color }} />
              <div style={{ padding: "8px 10px 12px" }}>
                <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 3px" }}>{it.name}</p>
                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>{it.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 10px" }}>before you go live</p>
          {[
            { ok: true, t: `${items.length} items added with photos` },
            { ok: true, t: isScheduled ? `drop time set — ${dropState.date} ${dropState.time}` : "going live immediately" },
            { ok: true, t: "prices and sizes filled" },
            { ok: false, t: "2 items missing measurements — buyers may ask" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: c.ok ? "var(--color-background-success)" : "var(--color-background-warning)",
              }}>
                {c.ok
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="var(--color-text-success)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 3v2.5" stroke="var(--color-text-warning)" strokeWidth="1.2" strokeLinecap="round" /><circle cx="5" cy="7.2" r="0.6" fill="var(--color-text-warning)" /></svg>}
              </div>
              <span style={{ fontSize: 12, color: c.ok ? "var(--color-text-secondary)" : "var(--color-text-warning)" }}>{c.t}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px 20px", display: "flex", gap: 10 }}>
          <button onClick={() => go("createDrop")} style={{ flex: 1, padding: 12, borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "none", fontSize: 14, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>edit drop</button>
          <button onClick={() => go("shareDrop")} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>get my link →</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ SELLER 5 — SHARE DROP LINK ============
function ShareDrop({ go }: { go: GoFn }) {
  const [mode, setMode] = useState<"live" | "schedule">(dropState.mode);
  const [date, setDate] = useState(dropState.date);
  const [time, setTime] = useState(dropState.time);
  const [copied, setCopied] = useState(false);
  const [waShared, setWaShared] = useState(false);
  const [igShared, setIgShared] = useState(false);
  const [notify, setNotify] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const dropName = dropState.name || "Summer Stories";

  const dropTime = useMemo(() => (date && time ? new Date(`${date}T${time}`) : null), [date, time]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (mode !== "schedule" || !dropTime) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mode, dropTime]);

  let h = 0, m = 0, s = 0;
  if (dropTime) {
    const diff = Math.max(0, dropTime.getTime() - now);
    h = Math.floor(diff / 3600000); m = Math.floor((diff % 3600000) / 60000); s = Math.floor((diff % 60000) / 1000);
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };
  const copyLink = () => { setCopied(true); showToast("link copied"); setTimeout(() => setCopied(false), 2000); };

  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={() => go("dropPreview")} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>share your drop</span>
        </div>

        <div style={{ padding: "32px 20px 24px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: mode === "live" ? "var(--color-background-success)" : "var(--color-background-warning)",
          }}>
            {mode === "live"
              ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11l5 5L18 6" stroke="var(--color-text-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="var(--color-text-warning)" strokeWidth="1.5" /><path d="M11 7v4.5l3 2" stroke="var(--color-text-warning)" strokeWidth="1.5" strokeLinecap="round" /></svg>}
          </div>
          <p style={{ fontSize: 19, fontWeight: 500, margin: "0 0 4px" }}>{mode === "live" ? `${dropName} is ready` : `schedule ${dropName}`}</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{mode === "live" ? "share your link — buyers click in and the drop begins" : "pick a time — your followers get notified before it drops"}</p>
        </div>

        <div style={{ display: "flex", gap: 0, margin: "20px 16px 0", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, overflow: "hidden" }}>
          {(["live", "schedule"] as const).map(opt => {
            const active = mode === opt;
            return (
              <button key={opt} onClick={() => setMode(opt)} style={{
                flex: 1, padding: 10, fontSize: 13, border: "none",
                background: active ? "var(--color-text-primary)" : "none",
                color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
                cursor: "pointer", fontWeight: active ? 500 : 400, fontFamily: "inherit",
              }}>{opt === "live" ? "🔴 go live now" : "🕐 schedule it"}</button>
            );
          })}
        </div>

        <div style={{ padding: "20px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <label style={labelStyle}>your drop link</label>
          <div style={{ display: "flex", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, overflow: "hidden" }}>
            <span style={{ flex: 1, padding: "11px 12px", fontSize: 13, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>jhaazi.com/drop/summer-stories</span>
            <button onClick={copyLink} style={{
              padding: "11px 14px", border: "none",
              background: copied ? "#1D9E75" : "var(--color-text-primary)",
              color: "var(--color-background-primary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>{copied ? "copied ✓" : "copy"}</button>
          </div>

          {mode === "schedule" && (
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>when does this drop?</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
              </div>
              {dropTime && (
                <div style={{ marginTop: 14, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 10px" }}>drop goes live in</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    {[["hours", h], ["mins", m], ["secs", s]].map(([l, n], i) => (
                      <div key={l as string} style={{ display: "flex", alignItems: "center" }}>
                        {i > 0 && <span style={{ fontSize: 20, color: "var(--color-border-secondary)", marginRight: 8 }}>:</span>}
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 24, fontWeight: 500, display: "block", lineHeight: 1 }}>{String(n).padStart(2, "0")}</span>
                          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>notify your 214 followers</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{mode === "live" ? "send them a whatsapp when this goes live" : "send them a whatsapp reminder before it drops"}</p>
          </div>
          <div onClick={() => setNotify(!notify)} style={{
            width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer", flexShrink: 0,
            background: notify ? "var(--color-text-primary)" : "var(--color-border-secondary)",
            transition: "background 0.2s",
          }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 2, right: notify ? 2 : 20, transition: "right 0.2s" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <button onClick={() => { setWaShared(true); showToast("link copied — paste into WhatsApp"); }} style={shareBtnStyle(waShared)}>
            {waShared ? "✓ shared" : "WhatsApp"}
          </button>
          <button onClick={() => { setIgShared(true); showToast("link copied — add to your story"); }} style={shareBtnStyle(igShared)}>
            {igShared ? "✓ shared" : "Instagram"}
          </button>
          <button onClick={copyLink} style={shareBtnStyle(false)}>copy link</button>
        </div>

        <div style={{ padding: "12px 16px 20px" }}>
          <button onClick={() => go("dashboard")} style={{
            width: "100%", padding: 14, borderRadius: 8, border: "none",
            background: mode === "live" ? "var(--color-text-primary)" : "#BA7517",
            color: mode === "live" ? "var(--color-background-primary)" : "white",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>{mode === "live" ? "go live now →" : "confirm schedule →"}</button>
        </div>
      </Screen>

      {toast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "var(--color-text-primary)", color: "var(--color-background-primary)",
          fontSize: 13, padding: "10px 18px", borderRadius: 20, zIndex: 80, whiteSpace: "nowrap",
        }}>{toast}</div>
      )}
    </Wrap>
  );
}
const shareBtnStyle = (shared: boolean): React.CSSProperties => ({
  flex: 1, padding: "10px 8px", borderRadius: 8,
  border: "0.5px solid " + (shared ? "var(--color-border-success)" : "var(--color-border-secondary)"),
  background: shared ? "var(--color-background-success)" : "none",
  fontSize: 12, color: shared ? "var(--color-text-success)" : "var(--color-text-secondary)",
  cursor: "pointer", fontFamily: "inherit",
});

// ============ SELLER 6 — LIVE DASHBOARD ============
function SellerDashboard({ go }: { go: GoFn }) {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState("0:00");
  const [followers, setFollowers] = useState(217);
  const [showNewFollower, setShowNewFollower] = useState(false);
  const [bookings, setBookings] = useState([
    { id: "1", initials: "PM", name: "Priya M.", item: "Floral midi dress · ₹850", color: "#E1F5EE", textColor: "#085041", status: "paid" as const, isNew: false },
    { id: "2", initials: "SR", name: "Sneha R.", item: "Vintage blazer · ₹1,100", color: "#FBEAF0", textColor: "#72243E", status: "paid" as const, isNew: false },
    { id: "3", initials: "AK", name: "Ananya K.", item: "Y2K cargo pants · ₹1,400", color: "#EEEDFE", textColor: "#3C3489", status: "pending" as const, isNew: false },
  ]);
  const [items, setItems] = useState([
    { name: "Floral midi dress", price: "₹850", state: "paid" as const },
    { name: "Vintage blazer", price: "₹1,100", state: "paid" as const },
    { name: "Y2K cargo pants", price: "₹1,400", state: "claimed" as const },
    { name: "Embroidered kurta", price: "₹650", state: "available" as const },
    { name: "Oversized white shirt", price: "₹600", state: "available" as const },
  ]);
  const [revenue, setRevenue] = useState(2600);
  const [viewers, setViewers] = useState(31);
  const [ended, setEnded] = useState(false);
  const newBookingsRef = useRef([
    { initials: "RV", name: "Riya V.", item: "Embroidered kurta · ₹650", color: "#FFF0DC", textColor: "#7A3D00", itemName: "Embroidered kurta", price: 650 },
    { initials: "MS", name: "Meera S.", item: "Oversized white shirt · ₹600", color: "#E8F4FF", textColor: "#1A3A5C", itemName: "Oversized white shirt", price: 600 },
  ]);
  const idxRef = useRef(0);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(`${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`);
      setViewers(v => Math.max(10, v + (Math.random() > 0.5 ? 1 : -1)));
    }, 1000);
    return () => clearInterval(t);
  }, [ended]);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => {
      setFollowers(f => f + 1);
      setShowNewFollower(true);
      setTimeout(() => setShowNewFollower(false), 1800);
    }, 7000);
    return () => clearInterval(t);
  }, [ended]);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => {
      if (idxRef.current >= newBookingsRef.current.length) return;
      const b = newBookingsRef.current[idxRef.current++];
      setBookings(prev => [...prev, { id: "n" + idxRef.current, initials: b.initials, name: b.name, item: b.item, color: b.color, textColor: b.textColor, status: "pending", isNew: true }]);
      setRevenue(r => r + b.price);
      setItems(prev => prev.map(it => it.name === b.itemName ? { ...it, state: "claimed" } : it));
      setTimeout(() => setBookings(prev => prev.map(x => ({ ...x, isNew: false }))), 1300);
    }, 9000);
    return () => clearInterval(t);
  }, [ended]);

  const claimed = items.filter(i => i.state !== "available").length;
  const available = items.filter(i => i.state === "available").length;
  const total = items.length;

  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "16px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 3px", letterSpacing: "-0.01em" }}>{dropState.name || "Summer Stories"}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{ended ? "drop ended" : `live for ${elapsed}`}</p>
          </div>
          {ended ? (
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-tertiary)" }} />ended
            </span>
          ) : (
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <span className="j-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-danger)" }} />live
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <Stat label="claimed" value={String(claimed)} />
          <Stat label="available" value={String(available)} />
          <Stat label="booked" value={`₹${(revenue / 1000).toFixed(1)}k`} />
          <Stat label="viewing" value={String(viewers)} />
        </div>

        <div style={{ padding: "10px 16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6 }}>
            <span>drop progress</span><span>{claimed} of {total} claimed</span>
          </div>
          <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--color-text-primary)", borderRadius: 10, width: `${(claimed / total) * 100}%`, transition: "width 0.8s ease" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--color-background-secondary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 2px" }}>jhaazi followers</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>yours forever · no algorithm</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {showNewFollower && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-success)", color: "var(--color-text-success)" }}>+1 new</span>}
            <span style={{ fontSize: 20, fontWeight: 500, color: "#1D9E75" }}>{followers}</span>
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: 0 }}>bookings</p>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{bookings.length} bookings</span>
        </div>
        <div>
          {bookings.map(b => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              background: b.isNew ? "var(--color-background-success)" : "transparent",
              transition: "background 1s ease",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: b.color, color: b.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{b.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1px" }}>{b.name}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.item}</p>
              </div>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500,
                background: b.status === "paid" ? "var(--color-background-success)" : "var(--color-background-warning)",
                color: b.status === "paid" ? "var(--color-text-success)" : "var(--color-text-warning)",
              }}>{b.status}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 16px 10px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: 0 }}>items</p>
        </div>
        <div>
          {items.map((it, i) => {
            const dotColor = it.state === "paid" ? "var(--color-border-secondary)" : it.state === "claimed" ? "#BA7517" : "#1D9E75";
            const tagBg = it.state === "available" ? "var(--color-background-success)" : it.state === "claimed" ? "var(--color-background-warning)" : "var(--color-background-secondary)";
            const tagFg = it.state === "available" ? "#1D9E75" : it.state === "claimed" ? "var(--color-text-warning)" : "var(--color-text-tertiary)";
            const tagText = it.state === "paid" ? "paid" : it.state === "claimed" ? "awaiting pay" : "available";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, color: it.state === "paid" ? "var(--color-text-tertiary)" : "var(--color-text-primary)" }}>{it.name}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{it.price}</span>
                <span style={{ fontSize: 10, color: tagFg, background: tagBg, padding: "2px 7px", borderRadius: 10 }}>{tagText}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px 20px", display: "flex", gap: 10 }}>
          <button onClick={() => go("shareDrop")} style={{ flex: 1, padding: 12, borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "none", fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>reshare link</button>
          <button onClick={() => setEnded(true)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "0.5px solid #E24B4A", background: "none", fontSize: 13, color: "var(--color-text-danger)", cursor: "pointer", fontFamily: "inherit" }}>{ended ? "drop ended" : "end drop"}</button>
        </div>
      </Screen>
    </Wrap>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div style={{ background: "var(--color-background-primary)", padding: "14px 10px", textAlign: "center" }}>
    <span style={{ fontSize: 22, fontWeight: 500, display: "block", margin: "0 0 2px" }}>{value}</span>
    <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", margin: 0 }}>{label}</p>
  </div>
);

// ============ BUYER 1 — FEED ============
type Drop = { id: string; seller: string; handle: string; avBg: string; avFg: string; init: string; name: string; status: "live" | "soon" | "sold"; soonText?: string; previews: string[]; left?: number; total?: number; price: string; sub?: string };

const DROPS: Drop[] = [
  { id: "1", seller: "jhaazi_picks", handle: "@jhaazi_picks", avBg: "#E1F5EE", avFg: "#085041", init: "JP", name: "Summer Stories", status: "live",
    previews: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1483985988-d22aee46e519?auto=format&fit=crop&w=300&q=80",
    ], left: 5, price: "₹600–₹1,400" },
  { id: "2", seller: "secondhand_ria", handle: "@secondhand_ria", avBg: "#FBEAF0", avFg: "#72243E", init: "SR", name: "Vintage Bombay Edit", status: "live",
    previews: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=300&q=80",
    ], left: 8, price: "₹400–₹1,100" },
  { id: "3", seller: "thrift_by_kavya", handle: "@thrift_by_kavya", avBg: "#EEEDFE", avFg: "#3C3489", init: "TK", name: "Y2K Drop No. 4", status: "soon", soonText: "in 2h",
    previews: [
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1483985988-d22aee46e519?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1506629905607-d9d297d7dc66?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80",
    ], total: 10, price: "₹500–₹2,000" },
  { id: "4", seller: "nomad_vintage", handle: "@nomad_vintage", avBg: "#FAEEDA", avFg: "#633806", init: "NV", name: "Monsoon Grunge", status: "sold",
    previews: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=300&q=80",
    ], sub: "all gone · 47 min ago", price: "" },
];

function Feed({ go, followingSeller, setFollowingSeller }: { go: GoFn; followingSeller: boolean; setFollowingSeller: (v: boolean) => void }) {
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

  const counts = {
    all: DROPS.length,
    live: DROPS.filter(d => d.status === "live").length,
    following: DROPS.filter(d => follows[d.id]).length,
    upcoming: DROPS.filter(d => d.status === "soon").length,
  };

  return (
    <Wrap>
      <Tabs<"all" | "live" | "following" | "upcoming">
        items={[
          { id: "all", label: "all", count: counts.all },
          { id: "live", label: "live now", count: counts.live },
          { id: "following", label: "following", count: counts.following },
          { id: "upcoming", label: "upcoming", count: counts.upcoming },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div style={{ height: 0 }} />
      {visible.length === 0 && (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>
          nothing here yet.
        </div>
      )}
      {visible.map(d => (
        <DropCard key={d.id} d={d} followed={!!follows[d.id]} onFollow={() => toggleFollow(d.id)} onView={() => go("drop")} onSeller={() => go("sellerStore")} />
      ))}
    </Wrap>
  );
}

function DropCard({ d, followed, onFollow, onView, onSeller }: { d: Drop; followed: boolean; onFollow: () => void; onView: () => void; onSeller: () => void }) {
  const isSold = d.status === "sold";
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);
  const visiblePreviews = d.previews.slice(0, 3);
  const hiddenPreviews = d.previews.slice(3, 7);

  const handlePhotoClick = (i: number) => {
    if (isSold) return;
    setActivePhoto(prev => prev === i ? null : i);
  };

  return (
    <div style={{
      background: "var(--color-background-primary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      boxShadow: followed && !isSold ? "inset 3px 0 0 var(--color-border-success)" : "none",
      borderRadius: 0, padding: "16px 16px 14px", marginBottom: 0, opacity: isSold ? 0.45 : 1,
    }}>

      {/* Row 1: Avatar + Drop name/status + follow action */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <button onClick={onSeller} aria-label={`view ${d.seller} store`} style={{ width: 34, height: 34, borderRadius: "50%", background: d.avBg, color: d.avFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0, marginTop: 1, border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>{d.init}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 4, minWidth: 0, minHeight: 18 }}>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: "-0.01em", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{d.name}</p>
            {d.status === "live" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-danger)", fontWeight: 700, lineHeight: 1, flexShrink: 0, transform: "translateY(0.5px)" }}>
                <span className="j-pulse" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-text-danger)", flexShrink: 0 }} />
                live
              </span>
            )}
            {d.status === "soon" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-warning)", fontWeight: 600, lineHeight: 1, flexShrink: 0, transform: "translateY(0.5px)" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-text-warning)", flexShrink: 0 }} />
                {d.soonText}
              </span>
            )}
            {isSold && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, lineHeight: 1, flexShrink: 0, transform: "translateY(0.5px)" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-text-tertiary)", flexShrink: 0 }} />
                sold out
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{d.handle}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {!isSold && (
            <button onClick={onFollow} style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 20,
              border: "0.5px solid " + (followed ? "var(--color-border-success)" : "var(--color-border-secondary)"),
              background: followed ? "var(--color-background-success)" : "transparent",
              color: followed ? "var(--color-text-success)" : "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "inherit",
            }}>{followed ? "following" : "+ follow"}</button>
          )}
        </div>
      </div>

      {/* Row 2: Interactive image grid — full-width, portrait 3:4 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {visiblePreviews.map((src, i) => (
          <div
            key={i}
            onClick={() => handlePhotoClick(i)}
            onMouseEnter={() => setHoveredPhoto(i)}
            onMouseLeave={() => setHoveredPhoto(null)}
            style={{
              flex: i === 0 ? 1.6 : 1,
              aspectRatio: "3/4",
              borderRadius: 8,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "var(--color-background-tertiary)",
              cursor: isSold ? "default" : "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              transform: hoveredPhoto === i && !isSold ? "scale(1.03)" : "scale(1)",
              boxShadow: activePhoto === i ? "0 0 0 2.5px var(--color-text-primary)" : hoveredPhoto === i && !isSold ? "0 3px 10px rgba(0,0,0,0.15)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          />
        ))}
        <div
          onClick={!isSold ? onView : undefined}
          onMouseEnter={() => setHoveredPhoto(99)}
          onMouseLeave={() => setHoveredPhoto(null)}
          style={{
            flex: 1,
            aspectRatio: "3/4",
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 1,
            cursor: isSold ? "default" : "pointer",
            background: "var(--color-background-tertiary)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {hiddenPreviews.map((src, i) => (
            <div key={i} style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minWidth: 0,
            }} />
          ))}
          <div style={{
            position: "absolute", inset: 0,
            background: hoveredPhoto === 99 && !isSold ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.62)",
            transition: "background 0.15s ease",
          }} />
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 14, fontWeight: 700, lineHeight: 1,
          }}>+4</span>
        </div>
      </div>

      {/* Row 3: [price] ——— [5 left] [view drop] */}
      <div style={{ display: "flex", alignItems: "center", minHeight: 32 }}>
        {isSold ? (
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{d.sub}</span>
        ) : (
          <>
            {/* Left: price */}
            {d.price && (
              <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600, lineHeight: 1 }}>{d.price}</span>
            )}
            {!d.price && d.total !== undefined && (
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600, lineHeight: 1 }}>{d.total} items</span>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right cluster: [5 left] [view drop] */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 32 }}>
              {d.left !== undefined && (
                <span style={{
                  fontSize: 12, fontWeight: 700, lineHeight: 1,
                  color: "var(--color-text-danger)",
                  whiteSpace: "nowrap",
                }}>{d.left} left</span>
              )}
              {d.status === "live" ? (
                <button onClick={onView} style={{
                  height: 32, fontSize: 12, fontWeight: 600, padding: "0 14px", borderRadius: 8,
                  background: "var(--color-text-primary)", color: "var(--color-background-primary)",
                  border: "none", cursor: "pointer", fontFamily: "inherit", lineHeight: 1,
                }}>view drop ↗</button>
              ) : (
                <button onClick={onFollow} style={{
                  height: 32, fontSize: 12, padding: "0 14px", borderRadius: 20,
                  border: "0.5px solid " + (followed ? "var(--color-border-success)" : "var(--color-border-secondary)"),
                  background: followed ? "var(--color-background-success)" : "transparent",
                  color: followed ? "var(--color-text-success)" : "var(--color-text-secondary)",
                  cursor: "pointer", fontFamily: "inherit", lineHeight: 1,
                }}>{followed ? "reminding ✓" : "remind me"}</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ BUYER 2 — DROP LANDING ============
const ITEMS = [
  { id: "i1", name: "Floral midi dress",     price: "₹850",   tag: "S · excellent",  cat: "western", status: "available", color: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80", measurements: [["bust", "34"], ["waist", "28"], ["length", "42"]] },
  { id: "i2", name: "Levi's 501 jeans",      price: "₹1,200", tag: "W28 · good",      cat: "western", status: "gone",      color: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80", measurements: [["waist", "28"], ["rise", "11"], ["inseam", "30"]] },
  { id: "i3", name: "Vintage blazer",        price: "₹1,100", tag: "M · excellent",   cat: "western", status: "available", color: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80", measurements: [["chest", "38"], ["shoulder", "15"], ["length", "25"]] },
  { id: "i4", name: "Embroidered kurta",     price: "₹650",   tag: "S · like new",    cat: "ethnic",  status: "available", color: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=300&q=80", measurements: [["bust", "34"], ["waist", "30"], ["length", "39"]] },
  { id: "i5", name: "Silk anarkali",         price: "₹900",   tag: "M · good",        cat: "ethnic",  status: "gone",      color: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=300&q=80", measurements: [["bust", "36"], ["waist", "32"], ["length", "50"]] },
  { id: "i6", name: "Oversized white shirt", price: "₹600",   tag: "L · excellent",   cat: "western", status: "available", color: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?auto=format&fit=crop&w=300&q=80", measurements: [["chest", "42"], ["shoulder", "18"], ["length", "28"]] },
  { id: "i7", name: "Y2K cargo pants",       price: "₹1,400", tag: "S/M · like new",  cat: "western", status: "available", color: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80", measurements: [["waist", "30"], ["rise", "12"], ["inseam", "31"]] },
];

function DropLanding({ go, followingSeller, setFollowingSeller }: { go: GoFn; followingSeller: boolean; setFollowingSeller: (v: boolean) => void }) {
  const [filter, setFilter] = useState<"all" | "available" | "western" | "ethnic">("all");
  const visible = ITEMS.filter(i => filter === "all" ? true : filter === "available" ? i.status === "available" : i.cat === filter);

  const available = ITEMS.filter(i => i.status === "available").length;
  const total = ITEMS.length;

  return (
    <Wrap>
      <div style={{ marginBottom: 0, padding: "12px 16px 8px" }}><BackBtn onClick={() => go("feed")} /></div>
      <Screen>
        <div style={{ padding: "20px 16px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => go("sellerStore")} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>JP</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>214 followers · view store ↗</p>
              </div>
            </button>
            <button onClick={() => setFollowingSeller(!followingSeller)} style={{
              fontSize: 12, padding: "6px 14px", borderRadius: 8,
              border: "0.5px solid " + (followingSeller ? "var(--color-border-success)" : "var(--color-border-secondary)"),
              background: followingSeller ? "var(--color-background-success)" : "none",
              color: followingSeller ? "var(--color-text-success)" : "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "inherit",
            }}>{followingSeller ? "following" : "+ follow"}</button>
          </div>
          <p style={{ fontSize: 24, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Summer Stories</p>

          {/* social proof — moved UP so buyers feel the urgency while shopping */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-danger)", fontWeight: 500 }}>
              <span className="j-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-danger)" }} />
              live
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-success)" }} />
              <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>31</strong> shopping now
            </span>
            <span><strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{available}</strong> of {total} left</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>₹600 – ₹1,400 · first come first serve</p>
        </div>

        <div style={{ padding: 0 }}>
          <Tabs<"all" | "available" | "western" | "ethnic">
            items={[
              { id: "all", label: "all", count: ITEMS.length },
              { id: "available", label: "available", count: available },
              { id: "western", label: "western" },
              { id: "ethnic", label: "ethnic" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--color-border-tertiary)" }}>
          {visible.map(it => {
            const gone = it.status === "gone";
            return (
              <div key={it.id} onClick={() => !gone && go("item")} style={{ background: "var(--color-background-primary)", cursor: gone ? "default" : "pointer" }}>
                <div style={{ aspectRatio: "3/4", backgroundImage: `url(${it.color})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--color-background-tertiary)", position: "relative" }}>
                  {!gone && (
                    <span style={{
                      position: "absolute", top: 8, right: 8,
                      padding: "4px 7px", borderRadius: 6,
                      background: "rgba(255,255,255,0.92)",
                      color: "var(--color-text-danger)",
                      fontSize: 10, fontWeight: 600, lineHeight: 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}>2 eyeing</span>
                  )}
                  {!gone && (
                    <div style={{
                      position: "absolute", right: 0, bottom: 0,
                      width: 38,
                      display: "flex", flexDirection: "column", gap: 7,
                      padding: "9px 5px 10px",
                      background: "rgba(0,0,0,0.52)",
                      textAlign: "right",
                    }}>
                      {it.measurements.map(([label, value]) => (
                        <div key={label}>
                          <p style={{ fontSize: 7, color: "rgba(255,255,255,0.72)", margin: "0 0 3px", lineHeight: 1 }}>{label}</p>
                          <p style={{ fontSize: 11, color: "white", fontWeight: 700, margin: 0, lineHeight: 1 }}>{value}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {gone && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", padding: "4px 10px", borderRadius: 6 }}>claimed</span>
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
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 3 — ITEM DETAIL ============
function ItemDetail({ go, startClaim }: { go: GoFn; startClaim: (item: Omit<ClaimedItem, "deadline">) => void }) {
  const colors = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80",
  ];
  const [photo, setPhoto] = useState(0);
  const [claimed, setClaimed] = useState(false);

  const onClaim = () => { setClaimed(true); setTimeout(() => startClaim({ name: "Floral midi dress", price: "₹850", size: "S" }), 500); };

  return (
    <Wrap>
      <Screen>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <BackBtn onClick={() => go("drop")} />
          <button onClick={() => go("sellerStore")} style={{ flex: 1, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>jhaazi_picks</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>Summer Stories drop</p>
          </button>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontWeight: 500 }}>live</span>
        </div>

        <div style={{ position: "relative", aspectRatio: "4/5", backgroundImage: `url(${colors[photo]})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--color-background-tertiary)" }}>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {colors.map((_, i) => (
              <div key={i} onClick={() => setPhoto(i)} style={{ width: 5, height: 5, borderRadius: "50%", background: i === photo ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", overflowX: "auto" }}>
          {colors.map((src, i) => (
            <div key={i} onClick={() => setPhoto(i)} style={{
              width: 52, height: 52, borderRadius: 6,
              backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center",
              backgroundColor: "var(--color-background-tertiary)",
              flexShrink: 0, cursor: "pointer",
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
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>gorgeous floral print, slight puff sleeves, midi length hits below the knee. no stains, no pilling. wore once to a wedding.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px 12px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-text-success)" }} />
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>available · <span style={{ color: "var(--color-text-danger)", fontWeight: 500 }}>2 people eyeing this</span></p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button style={{ padding: "12px 16px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "none", fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>ask seller ↗</button>
          <button onClick={onClaim} disabled={claimed} style={{
            flex: 1, padding: 13, borderRadius: 8, border: claimed ? "0.5px solid var(--color-border-success)" : "none",
            background: claimed ? "var(--color-background-success)" : "var(--color-text-primary)",
            color: claimed ? "var(--color-text-success)" : "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>{claimed ? "claimed ✓" : "claim this"}</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 4 — CLAIM HOLD (low-friction, 10-min countdown) ============
function useCountdown(deadline: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  const ms = Math.max(0, (deadline ?? 0) - now);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { ms, label: `${m}:${String(s).padStart(2, "0")}` };
}

function ClaimHold({ claim, onCheckout, onRelease }: { claim: ClaimedItem | null; onCheckout: () => void; onRelease: () => void }) {
  const { ms, label } = useCountdown(claim?.deadline);
  if (!claim) return null;
  const danger = ms < 2 * 60 * 1000;
  return (
    <Wrap>
      <Screen>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={onRelease} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>your hold</span>
        </div>

        <div style={{ padding: "28px 20px 22px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Check /></div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>held for you</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>no one else can grab this — you have time to check out</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: "#B4B2A9", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>{claim.name}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{claim.price} · size {claim.size}</p>
          </div>
        </div>

        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", margin: "0 0 8px" }}>time left to check out</p>
          <p style={{ fontSize: 36, fontWeight: 500, margin: "0 0 6px", fontVariantNumeric: "tabular-nums", color: danger ? "var(--color-text-danger)" : "var(--color-text-primary)" }}>{label}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 22px", lineHeight: 1.5 }}>after that the item goes back to the pool for others to claim</p>

          <button onClick={onCheckout} style={{
            width: "100%", padding: 14, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>check out — {claim.price}</button>
          <button onClick={onRelease} style={{ background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 12, fontFamily: "inherit" }}>release & keep browsing</button>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 5 — SIGNUP (at checkout, or from menu) ============
function Signup({ go, onDone, claim }: { go: GoFn; onDone: () => void; claim: ClaimedItem | null }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const { label, ms } = useCountdown(claim?.deadline);
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const otpOk = otp.length === 4;

  return (
    <Wrap>
      <Screen>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={() => step === 2 ? setStep(1) : (claim ? go("claimHold") : go("feed"))} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{claim ? "quick signup to check out" : "create your account"}</span>
        </div>

        {claim && ms > 0 && (
          <div style={{ padding: "10px 16px", background: "var(--color-background-warning)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-warning)", margin: 0 }}>holding {claim.name}</p>
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-warning)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{label} left</p>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: "20px 16px" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 18px", lineHeight: 1.5 }}>we just need a few details so the seller can ship to you & you can track your orders.</p>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>full name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Priya Mehta" style={fieldStyle} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>phone number</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" style={fieldStyle} /></div>
            <div style={{ marginBottom: 18 }}><label style={labelStyle}>email (optional)</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@email.com" style={fieldStyle} /></div>
            <button onClick={() => setStep(2)} disabled={!name.trim() || !phoneOk} style={{
              width: "100%", padding: 13, borderRadius: 8, border: "none", fontSize: 15, fontWeight: 500,
              background: "var(--color-text-primary)", color: "var(--color-background-primary)",
              cursor: "pointer", opacity: !name.trim() || !phoneOk ? 0.35 : 1, fontFamily: "inherit",
            }}>send OTP</button>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", margin: "14px 0 0" }}>by continuing you agree to our terms & privacy policy</p>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: "20px 16px" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>we sent a 4-digit code to</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 18px" }}>+91 {phone}</p>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="• • • •" inputMode="numeric" style={{ ...fieldStyle, textAlign: "center", fontSize: 22, letterSpacing: "0.5em", marginBottom: 14 }} />
            <button onClick={onDone} disabled={!otpOk} style={{
              width: "100%", padding: 13, borderRadius: 8, border: "none", fontSize: 15, fontWeight: 500,
              background: "var(--color-text-primary)", color: "var(--color-background-primary)",
              cursor: "pointer", opacity: !otpOk ? 0.35 : 1, fontFamily: "inherit",
            }}>{claim ? "verify & continue to checkout" : "verify & create account"}</button>
            <button style={{ background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 12, width: "100%", fontFamily: "inherit" }}>resend code</button>
          </div>
        )}
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 6 — JUST MISSED IT ============
function Missed({ go }: { go: GoFn }) {
  return (
    <Wrap>
      <Screen>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={() => go("drop")} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>just missed it</span>
        </div>
        <div style={{ padding: "44px 24px 28px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-background-warning)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>⏱</div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>your hold expired</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px", lineHeight: 1.5 }}>the item went back to the pool. someone else may have grabbed it — but the drop is still live.</p>
          <button onClick={() => go("drop")} style={{
            width: "100%", padding: 13, borderRadius: 8, border: "none",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>back to the drop</button>
          <button onClick={() => go("feed")} style={{ background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 12, fontFamily: "inherit" }}>browse other drops</button>
        </div>
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "16px 20px", background: "var(--color-background-secondary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", margin: "0 0 4px" }}>tip</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>follow this seller — you'll get notified the second their next drop goes live, before it hits the public feed.</p>
        </div>
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 7 — BOOKING (post-signup: address + confirm) ============
function Booking({ go, claim, signedIn, onDone }: { go: GoFn; claim: ClaimedItem | null; signedIn: boolean; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const { label, ms } = useCountdown(claim?.deadline);

  useEffect(() => {
    if (step === 2) {
      const t1 = setTimeout(() => setDone(true), 1600);
      const t2 = setTimeout(() => onDone(), 2600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [step, onDone]);

  const back = () => step > 1 ? setStep(step - 1) : go("claimHold");
  const labels = ["shipping & delivery", "confirming"];

  return (
    <Wrap>
      <Screen>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <BackBtn onClick={back} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{labels[step - 1]}</span>
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {[1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= step ? "var(--color-text-primary)" : "var(--color-border-secondary)" }} />)}
          </div>
        </div>

        {/* item header — focused on delivery & size, not generic info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "#B4B2A9", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{claim?.name ?? "Floral midi dress"} · {claim?.price ?? "₹850"}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>size {claim?.size ?? "S"} · ships in 2 days · delivery 4–6 days</p>
          </div>
          {claim && ms > 0 && signedIn && (
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-warning)", fontVariantNumeric: "tabular-nums" }}>{label}</span>
          )}
        </div>

        {step === 1 && (
          <div style={{ padding: "20px 16px" }}>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>delivery address</label><input placeholder="flat / house no., building" style={fieldStyle} /></div>
            <div style={{ marginBottom: 16 }}><input placeholder="area, street, locality" style={fieldStyle} /></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>city</label><input placeholder="Mumbai" style={fieldStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>pincode</label><input placeholder="400001" maxLength={6} style={fieldStyle} /></div>
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", cursor: "pointer", fontFamily: "inherit" }}>pay {claim?.price ?? "₹850"} via UPI</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>delivery address</label><input placeholder="flat / house no., building" style={fieldStyle} /></div>
            <div style={{ marginBottom: 16 }}><input placeholder="area, street, locality" style={fieldStyle} /></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>city</label><input placeholder="Mumbai" style={fieldStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>pincode</label><input placeholder="400001" maxLength={6} style={fieldStyle} /></div>
            </div>
            <button onClick={() => setStep(3)} style={{ width: "100%", padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", cursor: "pointer", fontFamily: "inherit" }}>confirm booking</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            {!done
              ? <div className="j-spin" style={{ width: 40, height: 40, border: "2px solid var(--color-border-tertiary)", borderTopColor: "var(--color-text-primary)", borderRadius: "50%", margin: "0 auto 20px" }} />
              : <div style={{ width: 40, height: 40, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}><Check w={32} /></div>}
            <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 6px" }}>{done ? "you got it" : "confirming your order"}</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{done ? "ships in 2 days · delivery 4–6 days" : "locking it in"}</p>
          </div>
        )}
      </Screen>
    </Wrap>
  );
}

// ============ BUYER 5 — FOLLOW SELLER ============
function FollowSeller({ go, setFollowingSeller }: { go: GoFn; setFollowingSeller: (v: boolean) => void }) {
  const [followed, setFollowed] = useState(false);
  const [hint, setHint] = useState(false);

  const doFollow = () => { setFollowed(true); setFollowingSeller(true); setTimeout(() => setHint(true), 300); };

  return (
    <Wrap>
      <Screen>
        <div style={{ padding: "40px 24px 28px", textAlign: "center", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}><Check /></div>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 5px", letterSpacing: "-0.01em" }}>you got it</p>
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

        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500 }}>JP</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>jhaazi_picks</p>
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{followed ? 215 : 214} followers on jhaazi</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {followed ? "you're in. jhaazi_picks' drops come straight to you now." : "get notified the moment jhaazi_picks drops next. no missing out."}
          </p>
          <button onClick={doFollow} style={{
            width: "100%", padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer",
            border: followed ? "0.5px solid var(--color-border-success)" : "none",
            background: followed ? "var(--color-background-success)" : "var(--color-text-primary)",
            color: followed ? "var(--color-text-success)" : "var(--color-background-primary)", fontFamily: "inherit",
          }}>{followed ? "following ✓" : "follow jhaazi_picks"}</button>
          <button onClick={() => go("feed")} style={{ background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 12, width: "100%", fontFamily: "inherit" }}>{followed ? "back to feed" : "maybe later"}</button>

          {hint && (
            <div style={{ marginTop: 16, padding: 12, background: "var(--color-background-secondary)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-text-success)", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>next drop · this saturday 7pm · you'll be the first to know</p>
            </div>
          )}
        </div>
      </Screen>
    </Wrap>
  );
}

// silence unused-import warning
void Heart;

// ============ SELLER STOREFRONT (public, buyer-facing) ============
const STORE_DROPS: { id: string; name: string; status: "live" | "soon" | "ended"; meta: string; colors: string[] }[] = [
  { id: "s1", name: "Summer Stories", status: "live", meta: "live · 5 left", colors: ["#D3D1C7", "#B4B2A9", "#888780", "#F4C0D1"] },
  { id: "s2", name: "Pre-loved Denim", status: "ended", meta: "ended · 12 sold", colors: ["#9DA8C4", "#5F6F8E", "#2E3A52", "#C8B89F"] },
  { id: "s3", name: "Linen Lounge", status: "ended", meta: "ended · 8 sold", colors: ["#E8DFC9", "#D2C29A", "#B59E6E", "#7E6A47"] },
  { id: "s4", name: "Y2K Reboot", status: "soon", meta: "drops fri 7pm", colors: ["#F4C0D1", "#CECBF6", "#AFA9EC", "#7F77DD"] },
];

type WallEntry = { id: string; kind: "review" | "comment"; user: string; init: string; bg: string; fg: string; rating?: number; text: string; when: string; tag?: string };
const WALL: WallEntry[] = [
  { id: "w1", kind: "review", user: "ananya_r", init: "AR", bg: "#FBEAF0", fg: "#72243E", rating: 5, text: "got my floral midi from her last drop — exactly as shown, packed beautifully, shipped in 2 days. will buy again 🌸", when: "2d", tag: "Summer Stories" },
  { id: "w2", kind: "comment", user: "thrift.queen", init: "TQ", bg: "#EEEDFE", fg: "#3C3489", text: "your taste is unreal!! when's the next ethnic drop?", when: "3d" },
  { id: "w3", kind: "review", user: "meher.s", init: "MS", bg: "#E1F5EE", fg: "#085041", rating: 5, text: "third order from JP. always honest about condition, never any surprises.", when: "1w", tag: "Pre-loved Denim" },
  { id: "w4", kind: "comment", user: "vintage.vee", init: "VV", bg: "#FAEEDA", fg: "#633806", text: "the linen kurta in your last drop was 🔥 missed it by a minute", when: "1w" },
  { id: "w5", kind: "review", user: "ria_p", init: "RP", bg: "#FBEAF0", fg: "#72243E", rating: 4, text: "loved the piece, sizing ran a touch small but seller was super helpful over chat.", when: "2w", tag: "Linen Lounge" },
];

function SellerStore({ go, followingSeller, setFollowingSeller }: { go: GoFn; followingSeller: boolean; setFollowingSeller: (v: boolean) => void }) {
  const [tab, setTab] = useState<"drops" | "wall">("drops");
  const [filter, setFilter] = useState<"all" | "review" | "comment">("all");
  const [composer, setComposer] = useState("");
  const [extraWall, setExtraWall] = useState<WallEntry[]>([]);

  const allWall = [...extraWall, ...WALL];
  const visibleWall = filter === "all" ? allWall : allWall.filter(w => w.kind === filter);
  const reviews = allWall.filter(w => w.kind === "review");
  const avg = reviews.length ? (reviews.reduce((a, w) => a + (w.rating ?? 0), 0) / reviews.length).toFixed(1) : "—";

  const submit = () => {
    if (!composer.trim()) return;
    setExtraWall([{ id: "x" + Date.now(), kind: "comment", user: "you", init: "Y", bg: "var(--color-background-secondary)", fg: "var(--color-text-primary)", text: composer.trim(), when: "now" }, ...extraWall]);
    setComposer("");
  };

  return (
    <Wrap>
      <div style={{ marginBottom: 8 }}><BackBtn onClick={() => go("feed")} /></div>
      <Screen>
        {/* cover */}
        <div style={{ height: 88, background: "linear-gradient(135deg, #E1F5EE 0%, #CDE8DA 60%, #B3D8C2 100%)" }} />
        <div style={{ padding: "0 18px 18px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ marginTop: -28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#E1F5EE", color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 500, border: "3px solid var(--color-background-primary)" }}>JP</div>
            <button onClick={() => setFollowingSeller(!followingSeller)} style={{
              fontSize: 13, padding: "8px 18px", borderRadius: 8,
              border: "0.5px solid " + (followingSeller ? "var(--color-border-success)" : "var(--color-text-primary)"),
              background: followingSeller ? "var(--color-background-success)" : "var(--color-text-primary)",
              color: followingSeller ? "var(--color-text-success)" : "var(--color-background-primary)",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
            }}>{followingSeller ? "following" : "+ follow"}</button>
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 2px" }}>jhaazi_picks</p>
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 10px" }}>@jhaazi_picks · bombay</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5, margin: "0 0 14px" }}>
            curated thrift · western & ethnic · drops every other friday. each piece checked, photographed honestly, and shipped within 48 hours.
          </p>

          {/* trust stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { v: "214", l: "followers" },
              { v: "47", l: "orders shipped" },
              { v: "1.8d", l: "avg ship time" },
              { v: avg + "★", l: reviews.length + " reviews" },
            ].map(s => (
              <div key={s.l} style={{ padding: "6px 4px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>{s.v}</p>
                <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0, lineHeight: 1.2 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div style={{ padding: "0 18px" }}>
          <Tabs<"drops" | "wall">
            items={[
              { id: "drops", label: "drops", count: STORE_DROPS.length },
              { id: "wall", label: "wall", count: allWall.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "drops" && (
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {STORE_DROPS.map(d => (
              <button key={d.id} onClick={() => d.status === "live" && go("drop")} style={{ background: "none", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: 8, cursor: d.status === "live" ? "pointer" : "default", fontFamily: "inherit", textAlign: "left", opacity: d.status === "ended" ? 0.7 : 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, aspectRatio: "1", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
                  {d.colors.slice(0, 4).map((c, i) => <div key={i} style={{ background: c }} />)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  {d.status === "live" && <span className="j-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-text-danger)" }} />}
                  <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>{d.name}</p>
                </div>
                <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0 }}>{d.meta}</p>
              </button>
            ))}
          </div>
        )}

        {tab === "wall" && (
          <div style={{ padding: "12px 18px 20px" }}>
            {/* composer */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                value={composer}
                onChange={e => setComposer(e.target.value)}
                placeholder="leave a note for jhaazi_picks…"
                style={{ ...fieldStyle, fontSize: 13, padding: "10px 12px" }}
              />
              <button onClick={submit} disabled={!composer.trim()} style={{
                padding: "0 14px", borderRadius: 8, border: "none",
                background: composer.trim() ? "var(--color-text-primary)" : "var(--color-background-tertiary)",
                color: composer.trim() ? "var(--color-background-primary)" : "var(--color-text-tertiary)",
                fontSize: 13, fontWeight: 500, cursor: composer.trim() ? "pointer" : "default", fontFamily: "inherit",
              }}>post</button>
            </div>

            {/* filter */}
            <div style={{ display: "flex", gap: 14, fontSize: 12, marginBottom: 14, color: "var(--color-text-tertiary)" }}>
              {(["all", "review", "comment"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                  fontWeight: filter === f ? 500 : 400,
                  color: filter === f ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                }}>{f}{f !== "all" ? "s" : ""}</button>
              ))}
            </div>

            {visibleWall.map(w => (
              <div key={w.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: w.bg, color: w.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{w.init}</div>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: 0, flex: 1 }}>{w.user}</p>
                  {w.kind === "review" && (
                    <span style={{ fontSize: 11, color: "var(--color-text-warning)", fontWeight: 500 }}>
                      {"★".repeat(w.rating ?? 0)}{"☆".repeat(5 - (w.rating ?? 0))}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{w.when}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px", lineHeight: 1.5 }}>{w.text}</p>
                {w.tag && <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0 }}>on {w.tag}</p>}
              </div>
            ))}
            {visibleWall.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 12, padding: "20px 0" }}>nothing here yet.</p>
            )}
          </div>
        )}
      </Screen>
    </Wrap>
  );
}
