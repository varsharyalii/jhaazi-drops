# Gated Seller Onboarding + Role-Based Views

Right now "Become a seller" jumps straight into the seller flow. We'll change it so sellers must apply and get approved, and so the logged-in role (buyer vs seller) controls what UI is shown across the app.

## 1. Seller application flow (replaces direct entry)

New screens added to the prototype:

- **`sellerApply`** — application form
  - Fields: name, phone (with OTP), email, city, Instagram/handle, what you sell (categories), why you want to sell (short text), sample photos (placeholder upload).
  - Submit → goes to `sellerApplyPending`.
- **`sellerApplyPending`** — "Application received" confirmation
  - Shows status pill: *Under review* (typical: 1–2 days).
  - Demo helper button: **Simulate approval** (since this is a prototype) → moves to `sellerApplyApproved`.
- **`sellerApplyApproved`** — "You're in"
  - Shows the (mock) invite link to create their store, plus a **Create your store** CTA → routes to existing `sellerProfile` (store creation).

Side menu "Become a seller" now points to `sellerApply` instead of `sellerProfile`.

## 2. Role-based session state

Extend the existing `signedIn` state into a `session` object:

```ts
type Role = "guest" | "buyer" | "seller";
type Session = { role: Role; name?: string; sellerApproved?: boolean };
```

- Default: `guest`.
- After buyer signup (existing flow): `buyer`.
- After seller approval + store creation: `seller`.
- Side menu gets a **Switch view** toggle when a user has both buyer and seller capability (so a seller can still browse as a buyer).

## 3. Role-aware UI

**Top bar / side menu** changes based on role:

- **Guest**: Browse drops, Sign up / Log in, Become a seller (→ application).
- **Buyer**: Feed, My follows, My orders, Account, Become a seller (→ application).
- **Seller**: Seller dashboard (default landing), My drops, Create new drop, My profile (store), Orders to ship, Switch to buyer view.

**Default landing route by role:**
- guest/buyer → `feed`
- seller → `sellerDashboard`

**Hidden from sellers in their seller view**: buyer-only CTAs like "Claim", "Follow", buyer checkout. They still work if the seller switches to buyer view.

## 4. Seller dashboard (light pass)

The existing `sellerDashboard` becomes the seller's home. Add quick tiles:
- Active drop (status, claims, time left)
- Orders to ship (count → list)
- Drop tracking (history of past drops with sold/returned counts)
- Create new drop (primary CTA)
- My profile / store (→ `sellerStore` in owner mode with edit affordance)

No new backend — all mock data, consistent with the prototype.

## 5. Demo mode drawer

The "Jump to screen" drawer gets a third section: **Seller onboarding** containing `sellerApply`, `sellerApplyPending`, `sellerApplyApproved`. Existing Buyer / Seller sections stay.

Also add a **Role switcher** at the top of the drawer: Guest / Buyer / Seller — for non-linear demoing without going through signup/approval each time.

## Technical notes

- All changes confined to `src/routes/index.tsx` (single-file prototype pattern already in use).
- Add `Screen` union members: `sellerApply`, `sellerApplyPending`, `sellerApplyApproved`.
- Replace `signedIn: boolean` with `session: Session`; update all existing checks (`session.role !== "guest"` etc.).
- Add a small `useRoleNav()` helper that returns the appropriate menu items + default screen for the current role, used by both `TopBar`/`SideMenu` and initial route.
- No new packages, no DB — pure in-memory state for the prototype.

## Out of scope (for this step)

- Real OTP, real file upload, real admin approval queue.
- Persisting role across reloads.
- Seller-side notifications/push.

Confirm and I'll implement.