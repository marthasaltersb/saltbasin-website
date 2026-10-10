# Training spec — Remaining raw error messages rewritten under the owner error rule

Version 1.0 · 2026-10-10 · traces to `docs/changes/owner-error-messages.md` v1.0 and the owner direction of 2026-10-10 (plain first sentence; red for a failure; amber only for a caution).

Audience: a test agent driving a browser, and a person training on the feature. All data is fictional. Every journey types a deliberately broken piece of text into a real screen and checks what the person reads and sees. No database commands are needed. Follow the steps in order.

The expected sentence, used below as **PLAIN-SENTENCE(x)**, is exactly:

`The x could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again.`

Under it, on its own line, the message continues `Technical detail: ` followed by the browser's or server's own wording. A step only checks that the second line starts with `Technical detail:`; it never checks the wording after it.

## Where things are

- **Sign in**: `/login` with the admin account (`admin@test.local`). The login endpoint allows 10 attempts per 15 minutes per address, so sign in once and reuse the session. Open each journey's first screen in a fresh browser tab (the Release tracker keeps a live connection open, and navigating away from it inside the same tab can stall); a page that shows "Loading" for a while is waiting on an outside script and finishes within 30 seconds.
- **World Shell**: `/world`. The Sun menu lists, among others, **Qualification Rules**, **Release tracker** and **My Resume**. Each opens full screen with a **← Back to World** link. The same list works on a phone. If a click on a Sun menu item does not respond (the 3D scene can make the page slow), open the same screen by its address instead: `/world?at=island:qualification-rules`, `/world?at=island:release-tracker`, `/world?at=island:resume`; it is the same screen the menu opens.
- **Release tracker → Settings**: after opening **Release tracker**, the tab **Settings**; the card **Paste a snapshot** has a text box labelled **Snapshot JSON** and the button **Store snapshot**.
- **My Resume**: the card **Import an application package** has a file chooser labelled **Application package file**; the button **Career Sources to Review** (near the top) opens a screen with a text box labelled **Package JSON** and the button **Import and check against Career Master**.
- **Methodology Config** is reachable only in Classic Tools on a desktop (`/member?workspace=1&scope=admin`, **SYSTEM**, **Methodology Config**); it has no phone route today, so it is not a journey here (see the change spec, Known limitations).
- **On a phone** (390x844): the same screens; the page itself must not scroll sideways. Buttons named below are at least 44px tall.

## Interface parity

- Website: Journeys 1 to 4, each on desktop (1280x900) and phone (390x844).
- API: Journey 5 (the snapshot-import route returns the same sentence).
- MCP: the tool `release_import_snapshot` returns the same sentence from the same server function (`jsonProblemMessage`) that Journey 5's route uses. No MCP step is walked in a browser.

## Preconditions (fictional data)

1. Signed in as `admin@test.local` with the platform and Career Portfolio terms already accepted (the test account script does this).
2. A file named `bad-package.json` outside the repository containing exactly the 15 characters `{"documents": [` (an unfinished list).
3. Nothing else is required; every journey starts by opening its screen.

## Journey 1 — Qualification Rules: broken gate list

1. Open `/world`, click **Qualification Rules** in the Sun menu. Expect the screen titled **Qualification Rules** with a text box labelled **Gates (JSON)** holding the current gate chain and the button **Save qualification rule**.
2. Replace the whole text of **Gates (JSON)** with `{"gates": [ {"key": "a", }` and click **Save qualification rule**. Expect, below the button, an alert whose first line is exactly PLAIN-SENTENCE(gate list) and whose second line starts with `Technical detail:`.
3. Check the colour of that alert text. Expect red (computed colour `rgb(165, 57, 31)`), not amber and not green.
4. Check the page for sideways scrolling and the button size. Expect no horizontal page scroll, and the button **Save qualification rule** at least 44px tall.
5. Click **← Back to World**, then **Qualification Rules** again. Expect the text box to hold the original saved gate chain, not the broken text (nothing was saved).

## Journey 2 — Release tracker: broken pasted snapshot

1. Open `/world`, click **Release tracker**, then the tab **Settings**. Expect a card headed **Paste a snapshot** with a box labelled **Snapshot JSON**.
2. Type `{"snapshot": ` into **Snapshot JSON** and click **Store snapshot**. Expect an alert box under the box whose first line is exactly PLAIN-SENTENCE(snapshot) and whose second line starts with `Technical detail:`.
3. Look for the pop-up message. Expect a red toast (role alert) whose whole text is exactly PLAIN-SENTENCE(snapshot), with no detail line.
4. Check the page for sideways scrolling. Expect none.
5. Select all the text in **Snapshot JSON** and delete it. Expect the button **Store snapshot** to be disabled.

## Journey 3 — Career Sources to Review: broken package text

1. Open `/world`, click **My Resume**, then the button **Career Sources to Review**. Expect a screen with a text box labelled **Package JSON** (placeholder "...or paste package JSON here") and the button **Import and check against Career Master**, disabled while the box is empty.
2. Type `{"package": ` into **Package JSON**. Expect the button **Import and check against Career Master** to become enabled and to be at least 44px tall.
3. Click **Import and check against Career Master**. Expect an alert whose first line is exactly PLAIN-SENTENCE(package) and whose second line starts with `Technical detail:`.
4. Check the alert background. Expect a red tint (`rgb(251, 228, 223)`), not the amber of the other cards on the screen.
5. Look for the pop-up. Expect a red toast with whole text exactly PLAIN-SENTENCE(package) and no detail line.
6. Check the page for sideways scrolling. Expect none.

## Journey 4 — My Resume: broken application package file

1. Open `/world`, click **My Resume**. Expect the card **Import an application package** with the file chooser **Application package file**.
2. Choose `bad-package.json` in **Application package file**. Expect an alert under the chooser whose first line is exactly PLAIN-SENTENCE(package file) and whose second line starts with `Technical detail:`.
3. Check the alert colour. Expect red (`rgb(179, 38, 30)`).
4. Check the page for sideways scrolling. Expect none.

## Journey 5 — Same sentence over the API

1. While signed in, in the browser console on any page of the app run `fetch('/api/release-intelligence/import/snapshot', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({releaseKey:'r1', snapshot:'{"a": '})}).then(async r => [r.status, (await r.json()).error])`. Expect the result `[400, "<text>"]` where `<text>` starts with PLAIN-SENTENCE(snapshot) followed by a newline and `Technical detail:`.

## Edge cases

1. [E.1] Journey 2 step 2 with the box holding only spaces. Expect **Store snapshot** to stay disabled and no alert.
2. [E.2] Journey 3: type valid text `{"package": {}}` and click the import button. Expect that no alert contains the words "could not be read because part of its text" (the text is well formed, so the parser sentence must not appear; whatever the server then answers is out of scope for this step).
3. [E.3] Journey 1 on a phone (390x844): both lines of the alert wrap inside the card; nothing is cut off at the right edge and the page does not scroll sideways.
4. [E.4] Journey 5 in a private window with no sign-in (run the same `fetch`). Expect status `401` and a non-empty error text.
