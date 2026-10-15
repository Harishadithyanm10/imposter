# Imposter: real-time multiplayer social deduction word game

Vite + React + JavaScript, Tailwind CSS v4, React Router, Framer Motion, Lucide.
**Runs on Firebase's free Spark plan using only Authentication + Cloud Firestore** (Hosting optional).
No Realtime Database, no Cloud Functions, no App Check, no billing.

**Trust Nobody. Read Everybody.**

## 1. How it works without a server

Cloud Functions need a paid plan, so the **host's browser acts as the game server** and **Firestore Security Rules act as the referee**.

| Who | Can do | Enforced by |
|---|---|---|
| Any player | Toggle own ready flag (lobby only), join (count +1 within capacity), give a clue only on their own turn, cast one vote per attempt, acknowledge their role card | `firestore.rules` |
| Host only | Write room state, rounds, results, roles, secrets; read all votes; remove players | `firestore.rules` |
| Each player | Read **only their own** role/word document | `firestore.rules` |
| Nobody | Read another player's role, read another player's vote (except the host), edit someone else's clue | `firestore.rules` |
| Each player | Record their own finished game once; stats can only go up by one per verified match | `firestore.rules` |

The host's browser (`src/lib/hostGame.js`, run by `src/hooks/useHostEngine.js`) deals roles with a cryptographically secure shuffle, advances timers, counts votes, runs tie revotes and decides winners. Every transition runs in a transaction that re-checks the round is still in the expected state, so a repeated step (or a host handover mid-phase) cannot apply twice.

### Honest limits of the free design
* **The host can see everything.** The host's browser deals roles, so a determined host could inspect them (and individual votes). Other players cannot. Play with a host you trust; the game is built for friends.
* The word bank ships in the web app bundle (another player could read the *list*, but cannot tell which pair was chosen).
* If the host closes the tab, the game pauses until another player takes over (about 30 seconds; see below).
* No scheduled cleanup: old rooms simply expire (they cannot be joined after 24 h).
* Presence is a Firestore heartbeat (one tiny write per player every 12 s while a room is open). Free quota is 20,000 writes/day, roughly 50 player-hours of play per day.

### Firestore data model

```
users/{uid}                      profile + gamesPlayed/gamesWon/lastMatchId (stats only change together with a verified history record)
  history/{matchId}              one result per finished match (create-only, validated against the room's finished round)
usernames/{lowerName}            unique display names (create-only)
roomCodes/{CODE}                 unique 6-character room codes (create-only, transactional)
rooms/{roomId}                   public room state: hostUid, status, settings, currentPhase, currentRoundId, memberCount ...
  members/{uid}                  displayName, avatar, isReady, joinedAt, lastSeen (heartbeat)
  privateRoles/{uid}             role + secret word, readable ONLY by that uid
  secrets/{matchId|_config|_meta} real words, role map, custom words, recent words. Host only.
  rounds/{roundId}               phase, phaseEndsAt, turnOrder, alive, voted (uids only), result
    clues/{uid}                  clue (or "skipped")
    votes/{a1_uid|a2_uid}        voter + host can read; one per attempt
    acks/{uid}                   "I have seen my role"
```

### Game flow
`WAITING -> ROLE_REVEAL -> CLUE -> DISCUSSION -> VOTING -> RESULT`, then Next Round or Return to Lobby.

* **Voting:** one vote per player per attempt, no self-votes. A tie triggers one revote among the tied players; a second tie eliminates nobody. Totals appear only on the result screen.
* **Rounds:** "Rounds" is the number of elimination cycles per match. Roles stay fixed inside a match. When a match ends (all imposters out, imposters >= crew, or the round limit with an imposter alive), **Next Round** deals fresh roles and a new word pair.
* **Presence and reconnection:** each client stamps `lastSeen` on its own member document every 12 s; a member whose stamp stops changing for 35 s counts as offline. Refreshing or reopening the room restores the current phase. An offline player's clue turn is skipped after 10 s.
* **Host handover:** if the host goes offline, any member flags it; 30 server-seconds later (enforced by the rules using `request.time`) the earliest-joined connected player claims host and the game continues.
* **Registration safety:** Auth account, then profile + display-name reservation in one transaction. If it fails (for example the name was taken a moment ago) the new Auth account is deleted.

## 2. Setup (all free)

Requirements: Node 20+ and a Firebase project on the **Spark (free) plan**.

```bash
npm install
cp .env.example .env.local     # fill in the web config values
```

1. Create a project at console.firebase.google.com and put its id in `.firebaserc`.
2. **Authentication:** enable *Email/Password* and *Google*. Add your hosting domain (and `localhost`) under Authorized domains.
3. **Firestore Database:** create it in production mode (any region).
4. **Project settings -> Your apps:** register a Web app and copy its config into `.env.local`.
5. Deploy the rules (they are what keep the game fair):

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

The `VITE_FIREBASE_*` values are public identifiers and are safe in the frontend. Never commit service-account files or private keys (none are needed here).

### Run locally
```bash
npm run dev
```
Open it in two or three browser profiles (or one normal and two private windows) to play with yourself.
Optional: `firebase emulators:start` plus `VITE_USE_EMULATORS=true` in `.env.local` for an offline sandbox.

## 3. Tests
```bash
npm test               # rules engine, validation, word bank (no emulator needed)
npm run test:rules     # Firestore Security Rules, against the emulator
```
Manual checklist: register (duplicate display name rejected), login/invalid login, Google sign-in, password reset, protected routes, invite link while logged out, full room, joining twice with one account, host-only controls, another player's role unreadable, votes unreadable, tie -> revote -> nobody eliminated, each victory condition, host closing the tab (handover after about 30 s), refresh mid-game, Next Round gives new roles.

## 4. Deploy (free Hosting)
```bash
npm run build
firebase deploy --only hosting
```
`firebase.json` rewrites every route to `/index.html`, so `/join/ABC123` invitation links and React Router deep links work. Test with several browsers and phones.

## 5. Project layout
```
src/lib/        engine.js (rules), hostGame.js (host game loop), words.jsx, settings.js, random.js
src/services/   firebase.js, authService, profileService, roomService, gameService
src/hooks/      useRoomState, useHostEngine, useHostWatch, usePresence, useRecordResult, ...
src/pages/      all 16 screens        src/components/  reusable UI
firestore.rules  firestore.indexes.json  firebase.json
tests/          engine, settings and security-rules tests
```
