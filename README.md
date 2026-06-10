# 🎯 Multiplayer Trivia Lens

A real-time two-player trivia game built for Snap Spectacles using SpectaclesSyncKit. Players race to answer questions first, stealing turns on wrong answers, with live score tracking, auto-advancing rounds, and contextual roast messages when players answer incorrectly.

---

## Gameplay

Both players see the same question and a countdown timer. The first player to tap an answer gets first crack at it.

- **Correct answer** → earn 10 points, round ends, next question loads automatically
- **Wrong answer** → lose 5 points, opponent gets a steal attempt
- **Opponent also wrong** → round ends, correct answer revealed, next question loads
- **Nobody answers in time** → game pauses, tap any option to resume with a new question
- **Wrong answer** → a contextual roast fetched by question id is shown only to the player who got it wrong

---

## Features

- ⚡ Real-time buzzer race — fastest tap wins first turn
- 🔄 Auto-advancing rounds with a configurable between-round countdown
- ⏸️ Graceful pause on timer expiry — no infinite loops
- 🏆 Live scoreboard synced across both devices
- 🌐 Questions fetched dynamically from a Supabase edge function
- 🔥 Contextual roast messages on wrong answers — fetched by question id, shown only to the guilty player
- 🔒 Host-authoritative game state — no split-brain scoring

---

## Architecture

### Network Design

All synced state lives in a **single host-owned `SyncEntity`** (`gameSyncEntity`). The host is the sole writer. The guest never calls `setPendingValue` — instead it communicates via `session.sendMessage()`.

This is the key architectural decision. SpectaclesSyncKit determines store ownership at creation time (whichever device constructs the entity first becomes owner), not by the flag passed to the constructor. Using split entities for asymmetric writes causes silent dropped writes. `sendMessage` bypasses ownership entirely.

```
Guest tap → session.sendMessage("GUEST_BUZZ:ts:idx")
                    ↓
Host onMessageReceived → writes guestBuzzedTimeProp to store
                    ↓
gameSyncEntity propagates → onAnyChange fires on BOTH devices
                    ↓
Timer freezes, score updates, round state changes — everywhere simultaneously
```

### State Machine

```
PLAYING ──── buzz + correct ──────────────→ REVEAL_CORRECT ──→ (5s delay) ──→ PLAYING
        ──── buzz + wrong ────────────────→ steal window
        ──── steal + correct ─────────────→ REVEAL_CORRECT ──→ (5s delay) ──→ PLAYING
        ──── steal + wrong ───────────────→ REVEAL_INCORRECT ─→ (5s delay) ──→ PLAYING
        ──── timer expires (no buzz) ─────→ PAUSED ──────────→ (any tap) ───→ PLAYING
```

### SyncEntity Layout

| Entity | Owner | Properties |
|---|---|---|
| `gameSyncEntity` | Host | `jsonQuestion`, `timerStartToken`, `roundState`, `currentActiveBuzzer`, `hostScore`, `guestScore`, `hostBuzzedTime`, `guestBuzzedTime` |

### Message Protocol

Both devices subscribe to `onMessageReceived`. Each handles only the messages relevant to its role.

| Message | Direction | Trigger | Handler action |
|---|---|---|---|
| `GUEST_BUZZ:timestamp:optionIndex` | Guest → Host | Guest taps answer | Host writes `guestBuzzedTimeProp`, evaluates turn |
| `GUEST_RESUME` | Guest → Host | Guest taps while paused | Host calls `startNextRound()` |
| `HOST_ROAST:questionId:roast1\|roast2` | Host → Guest | Guest answers wrong | Guest fetches roast by question id and displays it locally |

---

## Setup

> [!IMPORTANT]
> **Testing with two Spectacles on different Snapchat accounts**
>
> By default, Connected Lenses multiplayer only works when both Spectacles are logged into the **same** Snapchat account. To test with two devices on two different accounts:
>
> 1. On the first Spectacles, go to **Developer Settings → Skip Session Selection** and set a password.
> 2. On the second Spectacles, do the same — use the **same password** on both devices.
>
> Both devices will now join the same session regardless of which Snapchat account they are logged into.

### Prerequisites

- [Lens Studio](https://ar.snap.com/lens-studio) with Spectacles support
- SpectaclesSyncKit package
- SpectaclesUIKit package
- A Supabase project with two edge functions: one for trivia questions, one for roasts

### Supabase Edge Functions

**Trivia question function** — accepts a POST with optional `object` and `topic` fields:

```json
{
  "ok": true,
  "record": {
    "id": 42,
    "question": "What is the capital of France?",
    "option1": "London",
    "option2": "Paris",
    "option3": "Berlin",
    "option4": "Madrid",
    "optionCount": 4,
    "answer": 2
  }
}
```

`answer` is a 1-based index matching `option1`–`option4`. `id` is the primary key used to fetch the matching roast.

**Roast function** — accepts a POST with `id` (question primary key) and a query param `?id=`, returns:

```json
{
  "data": {
    "id": 42,
    "question": "What is the capital of France?",
    "roast1": "You thought London? Did you learn geography from a pirate map?",
    "roast2": "Still wrong. Even the pigeons in Paris know this one.",
    "topic": "Geography"
  }
}
```

`roast1` is shown when the first buzzer answers wrong. `roast2` is shown when the steal attempt also fails.

### Inspector Configuration

Attach `MultiplayerTriviaManager` to a SceneObject and wire up the following inputs:

| Input | Type | Description |
|---|---|---|
| `snapCloudRequirements` | ScriptComponent | Component providing Supabase URL and headers |
| `functionName` | string | Trivia edge function name, e.g. `get-trivia-question` |
| `object` | string | Optional topic filter (e.g. `"solar system"`) |
| `topic` | string | Optional difficulty/category filter |
| `questionText` | Text | Displays the question |
| `optionButton1–4` | RectangleButton | Answer buttons |
| `optionButtonChildTextName` | string | Name of child Text node inside each button |
| `correctText` | Text | Shown on correct answer |
| `incorrectText` | Text | Shown on wrong answer |
| `myScoreValueText` | Text | Local player's score display |
| `opponentScoreValueText` | Text | Opponent's score display |
| `timerText` | Text | Countdown + between-round timer display |
| `statusText` | Text | Status/feedback messages |
| `roundDurationSeconds` | number | Seconds per question (default: `30`) |
| `nextRoundDelaySeconds` | number | Pause between rounds (default: `5`) |
| `enableDebugLogs` | bool | Prints detailed logs via `print()` |
| `roastFetcherComponent` | ScriptComponent | `EdgeFunctionRoastById` component on the RoastFetcher SceneObject |
| `roastText` | Text | Text component to display the roast message — set **Overflow → Wrap** and **Auto Height** in the inspector |

> [!NOTE]
> On the `roastText` Text component, set **Overflow** to **Wrap** (not Truncate/Clip) and enable **Auto Height** so long roast strings display in full.

---

## Scoring

| Event | Points |
|---|---|
| Correct answer | +10 |
| Wrong answer | −5 |
| Minimum score | 0 (never goes negative) |

---

## Key Files

```
MultiplayerTriviaManager.ts   — Main game logic
EdgeFunctionRoastById.ts      — Fetches roast text from Supabase by question id
SessionController.ts          — SpectaclesSyncKit session management (package)
```

---

## Lessons Learned

**SyncEntity ownership is set at creation time, not by the `isHost` flag.**
If two devices race to construct the same entity, whoever wins becomes the owner. The `isHost` parameter controls who *should* own it, but only if the host always constructs first — which isn't guaranteed. For any non-owner → owner communication, use `session.sendMessage()`.

**Register `onAnyChange` listeners after constructing SyncEntities.**
`StorageProperty.onAnyChange` only fires once the property is wired to a live entity. Attaching listeners before calling `new SyncEntity(...)` means they never trigger.

**Use `SessionController.getInstance()` directly — never cast it as `any`.**
`isHost()` returns `boolean | null`. Inside `notifyOnReady` it is guaranteed non-null. `getLocalUserId()` and `getUsers()` are the correct typed methods; `getCreatorId()` does not exist.

**A dedicated PAUSED state is safer than a timeout → REVEAL flow.**
Writing `REVEAL_INCORRECT` on timer expiry risks chaining into `scheduleNextRound`, which chains into `fetchAndSync`, which can loop under bad network conditions. A `PAUSED` state that only exits on explicit player input is clean and loop-proof.

**For per-device UI (like roasts), use messages not shared store.**
The roast text is intentionally shown only to the player who got it wrong. The host sends a `HOST_ROAST:questionId:roastField` message to the guest; each device then fetches and renders its own roast locally. Putting the roast text in the SyncEntity would show it on both screens simultaneously — the wrong behaviour for personalised feedback.

**Text truncation in Lens Studio is a component setting, not a code issue.**
If displayed text is being cut off, check the Text component's **Overflow** setting (set to **Wrap**), **Max Lines** (set to `0` for unlimited), and enable **Auto Height** so the bounding box grows with the content.

---

## License

MIT
