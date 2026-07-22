VitalTrack — Health Monitor App
Product Requirements Document (for AI-assisted development)

Version: 1.0 Purpose of this document: This is a complete functional and design specification for an AI coding assistant to build "VitalTrack" from scratch. It is based on approved UI mockups. Follow it precisely — layout, colors, copy, field names, and behaviors described below should be reproduced unless a section says otherwise.

1. Product Summary

VitalTrack is a personal health-tracking web app (responsive, mobile-first-capable) that lets a user log blood pressure, meals, exercise, sleep, symptoms, stress, medication, and water intake, then view trends and export doctor-ready reports. Data must be stored online in a cloud backend (not local-only storage) so the same account can be accessed from desktop and mobile browsers/apps with data always in sync.

Tagline: "Your health, tracked precisely." Subtitle: "Monitor blood pressure, sleep, exercise, meals, and symptoms in one place. Share professional reports with your doctor."

Core feature pillars (shown on the auth screens' left panel)
❤️ Blood Pressure Tracking — Multiple readings per day with trend analysis
😴 Sleep & Exercise — Comprehensive wellness monitoring
📊 Doctor Reports — Professional PDF/CSV/JSON exports for appointments
2. Tech Stack & Architecture Requirements

Because the app must be reachable from mobile devices with the same data, use a client + cloud backend architecture, not local storage/IndexedDB as the source of truth.

Recommended stack (AI should pick one consistent option and implement fully):

Frontend: React (or React Native/Expo web-compatible) + TypeScript, Tailwind CSS for styling, Recharts (or Chart.js) for graphs.
Backend/Data: A managed backend-as-a-service such as Supabase (Postgres + Auth + Row Level Security + REST/Realtime API) or Firebase (Firestore + Auth). Supabase is preferred because the data is relational (records per date, per profile).
Auth: Email/password auth with session persistence (JWT), "Remember me," password reset via email, and a Demo Account mode that logs into a pre-seeded read/write sandbox account.
Sync: All CRUD operations write directly to the cloud backend so that logging in on a phone shows the same data instantly. Support optimistic UI updates.
Hosting: Deployable as a responsive web app (PWA-installable) so it can be "added to home screen" on mobile; API layer is device-agnostic so a future native app can reuse it.
Multi-tenancy: Each authenticated account can contain multiple profiles (family members). All health records belong to a profile_id, and profiles belong to an account_id. Row-level security must ensure a user only ever sees their own account's data.
3. Design System
3.1 Theme

Dark theme only (no light mode required in v1).

Token	Value (approx.)	Usage
Background (page)	
#0A0E1A – near-black navy	App shell background
Surface (card)	
#131826 / 
#141B2E	Cards, panels, inputs
Surface (elevated/hover)	
#1B2338	Selected tab backgrounds
Border	rgba(255,255,255,0.08)	Card & input borders
Primary text	
#FFFFFF	Headings, values
Secondary text	
#8B94A8 (slate/gray)	Labels, captions
Primary accent (brand/green)	
#34D399 / 
#4ADE80	Primary buttons, logo, "Normal" status, links
Danger/BP-red	
#F87171 / rose	Blood pressure category, systolic line, delete actions
Warning/amber	
#FBBF24	Elevated status, stress icon
Info/blue	
#60A5FA	Diastolic line, medication category
Meal/orange	
#FB923C	Meal category
Exercise/green	
#4ADE80	Exercise category
Sleep/indigo	
#818CF8	Sleep category
Symptoms/purple	
#A78BFA	Symptoms category
Water/teal-green	
#2DD4BF/
#4ADE80	Water category
3.2 Typography
Headings: bold geometric sans-serif (e.g., "Inter" / "Poppins").
Body/labels: same sans-serif, regular weight, muted gray.
Numeric/tabular data (BP readings, table numbers, time pickers): monospace font for alignment (as seen in History table and journal timestamps).
3.3 Layout shell
Left sidebar (persistent, ~240px wide desktop; collapses to bottom nav or hamburger on mobile):
Logo block: heart icon in rounded green badge + "VitalTrack" + "Health Monitor" subtitle.
Nav items with icons: Dashboard, Add Record, History, Reports, Settings. Active item has a green-tinted rounded background and green text/icon.
Bottom-pinned: user account mini-card (avatar circle with initial, name, email) + Sign Out link.
Top bar: current page title (left) + account switcher pill (avatar, name, chevron) (right).
Cards: rounded corners (~16px), subtle border, dark surface fill, generous padding.
Buttons: pill/rounded-rect, solid color = primary action, outline/dark = secondary, colored-per-category for "Add X" buttons inside the Add Record form.
Icons: line icons (heart, fork-and-knife, dumbbell/activity, moon, warning triangle, brain, pill/capsule, droplet).
3.4 Responsiveness
Must reflow to a single column on mobile: sidebar becomes a bottom tab bar or slide-out drawer; the two-column Add Record layout (category grid + form | journal list) stacks vertically; charts remain horizontally scrollable if needed; tables switch to stacked card rows on narrow viewports.
4. Information Architecture
/login
/register
/forgot-password
/dashboard                (default after login)
/add-record               (?type=blood|meal|exercise|sleep|symptoms|stress|medication|water, defaults to blood, date param)
/history                  (?view=timeline|calendar|table)
/reports
/settings                 (?tab=profiles|notifications|backup|security)

Authenticated app shell (sidebar + topbar) wraps all routes except the three auth screens, which share a two-column marketing layout (left: brand + pitch + feature list; right: the form).

5. Screen Specifications
5.1 Login (/login)

Layout: Split screen. Left: brand block, big headline "Your health, tracked precisely.", description paragraph, and the 3 feature-pillar rows near the bottom. Right: centered form card.

Right panel content:

Heading "Welcome back", subtext "Sign in to your account".
Field: Email — placeholder you@example.com.
Field: Password — placeholder "Your password", with a show/hide (eye) icon toggle.
Row: Remember me checkbox (left) + Forgot password? link (right, green, routes to /forgot-password).
Primary button: Sign In (full width, green, dark text).
Secondary button: Try Demo Account (full width, dark/outlined) — logs into a seeded demo account instantly, no credentials required.
Footer text: "Don't have an account? Create account" (link → /register).

Behavior:

Validate email format and required password before submit.
On success, redirect to /dashboard.
On failure, show inline error banner/message (not specified visually in mock — use a red text under the form).
"Try Demo Account" signs in as a fixed demo user (e.g., demo@example.com / seeded data) so a prospective user can explore without registering.
5.2 Register (/register)

Same split layout. Right panel:

Heading "Create account", subtext "Start monitoring your health today".
Fields: Full Name (placeholder "John Smith"), Email Address (placeholder you@example.com), Password (placeholder "Min. 8 characters", show/hide toggle), Confirm Password (placeholder "Repeat password", show/hide toggle).
Primary button: Create Account.
Footer: "Already have an account? Sign in" → /login.

Validation: name required; valid email; password ≥ 8 chars; confirm password must match. On success: create account + a default "Self" profile, then redirect to /dashboard (or to login if email verification is required by the chosen auth provider).

5.3 Forgot Password (/forgot-password)

Split layout, right panel:

"← Back to login" link at top.
Heading "Reset password", subtext "We'll send you a reset link".
Field: Email Address.
Primary button: Send Reset Link — triggers backend password-reset email flow.
Show a confirmation state/toast after sending ("Check your email for a reset link").
5.4 Dashboard (/dashboard)

Header row: Date heading formatted as e.g. "Monday, July 20" + subtext "3 BP readings today" (dynamic count of today's BP entries) on the left; + Add Record button (green) on the right → navigates to Add Record for today.

Hero card (full width, green-tinted): "Latest Blood Pressure · {time}" label, big reading SYS/DIA (e.g. 118/77) with unit "mmHg" below, divider, "Pulse" value with "bpm" unit, and a status pill (Normal / Elevated / Stage 1 High / Stage 2 High / Hypertensive Crisis) colored per severity. If no reading exists yet today, show an empty/prompt state.

Stat cards row (4 cards):

Calendar icon — big number = count of today's logged health events — caption "health events" — link label "Today's Entries" (routes to History filtered to today).
Moon icon — big value = last night's sleep duration (e.g. 6.8h) — caption = sleep quality word (e.g. "good") — trend arrow icon — link label "Sleep Last Night".
Dumbbell/activity icon — big value = total exercise minutes this week (e.g. 393m) — caption "total minutes" — trend arrow — link label "Exercise This Week".
Coffee icon — big value = cups of coffee today — caption "cups" — link label "Coffee Today".

Stress row (full width card): brain icon, "Latest Stress Level" label, a 10-segment horizontal bar (green→amber gradient, filled up to current level) + numeric "5/10".

Blood Pressure Trend chart (full width card): Heading with heart icon "Blood Pressure Trend", range label top-right "Last 14 days". Line chart, Y-axis mmHg (60–140+), X-axis = dates (Jul 6…Jul 19). Three lines: Systolic (red/rose, top), Pulse (green, bottom), Diastolic (blue, middle) — each with soft area-fill under the systolic line. Legend at bottom with colored dot markers: Diastolic, Pulse, Systolic.

Sleep chart (half-width card): Heading "Sleep" with moon icon, "Last 7 days" label. Bar chart Mon–Sun, Y-axis hours 0–10, purple/indigo bars, dashed horizontal goal line labeled "7h goal" near the bottom.

Exercise chart (half-width card): Heading "Exercise" with activity icon, "Last 7 days" label. Bar chart Mon–Sun, Y-axis minutes 0–80, green bars.

Quick action row (3 buttons, bottom): "+ Add Today's Record", "⟳ View History", "📄 Export Report" — each a large tappable card with icon above label, routing to Add Record / History / Reports respectively.

All dashboard numbers must be computed live from the user's stored records (today's date, last 7/14 days) — not hardcoded.

5.5 Add Record (/add-record)

Header: date navigator — "‹" previous-day arrow, calendar icon + weekday + full date (e.g. "Monday / July 20, 2026"), "›" next-day arrow. Changing the date reloads the category form (cleared) and the journal list for that date.

Category selector grid (2 rows × 4 columns of tappable tiles): Blood (heart icon), Meal (fork/knife), Exercise (dumbbell), Sleep (moon), Symptoms (warning triangle), Stress (brain), Medication (capsule), Water (droplets). The selected tile is highlighted with its category color (border + tinted background + colored icon/label); others are neutral gray.

Dynamic form panel (left column below the grid) — swaps by selected category:

Blood Pressure
Fields: Time (time picker, default = now), Meal Context (dropdown: N/A, Before Meal, After Meal, Fasting — infer reasonable options).
Fields row 2: Systolic (number, placeholder "120"), Diastolic (number, placeholder "80"), Pulse (number, placeholder "72").
Notes (optional, textarea, placeholder "Any observations...").
Button: + Add BP Reading (red/rose themed).
Meal / Snack
Time picker; Type dropdown (Breakfast, Lunch, Dinner, Snack, Coffee — infer from journal examples).
Notes (textarea, placeholder "What did you have?").
Button: + Add Meal Entry (orange themed).
Exercise
Time picker; Exercise Type (text or dropdown, e.g. "Walking", "Running", "Cycling", "Strength Training", "Yoga").
Duration (min) — number input.
Intensity — dropdown: Light, Moderate, Vigorous.
Notes (textarea, placeholder "How did it feel?").
Button: + Add Exercise (green themed).
Sleep
Bed Time (time picker); Wake Time (time picker).
Sleep Quality — dropdown: Poor, Fair, Good, Excellent.
Button: + Add Sleep Record (indigo themed). App should auto-calculate total sleep duration from bed/wake times for display in charts/journal.
Symptoms
Time picker; Time of Day dropdown (Morning, Afternoon, Evening, Night).
"Symptoms (select all that apply)" — multi-select chip group: Headache, Dizziness, Chest Pain, Fatigue, Shortness of Breath, Blurred Vision, Palpitations, Nausea, Sweating (chips toggle highlighted state, multiple selectable).
Severity — dropdown: Low, Medium, High.
Notes (textarea, placeholder "Additional details...").
Button: + Add Symptom Entry (purple themed).
Stress
Time picker.
"Stress Level: X/10" live label + horizontal slider (0–10), track colored amber up to the handle, labeled endpoints "Calm" (left) / "Moderate" (center) / "Extreme" (right).
Notes (textarea, placeholder "What's causing stress?").
Button: + Add Stress Entry (amber themed).
Medication
Time picker; Dosage (text, placeholder "e.g. 10mg").
Medicine Name (text, placeholder "e.g. Lisinopril").
Taken toggle/chip (checkmark + "Taken", green when active) — marks whether the dose was actually taken vs. scheduled.
Button: + Add Medication (blue themed).
Water
Time picker; Amount (ml) numeric field.
Quick-select chips: 150ml / 250ml / 350ml / 500ml — tapping fills the Amount field and highlights the chip.
Button: + Add Water (teal/green themed).

Today's Journal panel (right column): Heading "Today's Journal (N entries)" with live count. Chronological list of all entries for the selected date across every category, each row showing: category icon (colored), time (HH:MM, monospace), category label (bold), and a one-line summary (e.g. "123/80 mmHg · 73 bpm", "breakfast · Oatmeal, eggs, orange juice", "Walking · 35min · moderate", "Level 5/10", "6.8h sleep · good"). Newly added entries append here immediately (optimistic update) and persist to the backend.

Each journal entry should be tappable to edit or delete (implement edit/delete actions even if not explicit in the static mock — required for a usable app).

5.6 History (/history)

Top segmented control with 3 tabs: Timeline | Calendar | Table (icons: list, calendar, grid). Below it, all views share a global search box ("Search entries..." / "Search...") for the Table/Timeline views that filters by text across entries.

Timeline view (default):

List of day-group cards, most recent first. Each card header: full date (e.g. "Monday, July 20, 2026"), summary chips (latest BP e.g. 122/80, sleep hours e.g. 6.8h sleep, 10 events), and a chevron to expand/collapse.
The expanded (or most-recent, auto-expanded) day shows the same chronological entry rows as the Add Record journal (icon, time, colored label + value), stacked vertically.
Collapsed day cards just show the summary row with a right chevron; clicking expands in place.

Calendar view:

Month navigator: "‹ July 2026 ›" with prev/next month arrows.
Standard 7-column (Su–Sa) month grid. Each date cell with data shows the day number and a colored status dot (from the BP legend) reflecting that day's average/last BP classification.
Legend at bottom: 🟢 Normal BP, 🟡 Elevated, 🔴 High BP.
Today's cell is highlighted (green filled background) even without full data.
Clicking a day cell opens that day's entries (e.g., navigate to Add Record for that date, or expand an inline panel).

Table view:

Search bar above the table.
Sortable columns: Date (default sorted descending, with a sort-direction arrow), Systolic, Diastolic, Pulse, Classification (colored pill: "Stage 1 High" amber/orange, "Elevated" yellow, "Normal" green, etc.), Sleep (hours, blue text), Exercise (minutes, green text), Entries (total count that day).
One row per date the user has data for; clicking a row can drill into that day's Timeline/Add Record view.
Numeric values right- or center-aligned in monospace.

Classification logic (implement using standard BP staging, e.g. AHA guidelines):

Category	Systolic	Diastolic
Normal	<120	and <80
Elevated	120–129	and <80
Stage 1 High	130–139	or 80–89
Stage 2 High	≥140	or ≥90
Hypertensive Crisis	>180	and/or >120
5.7 Reports (/reports)

Report Configuration card:

"Date Range" — 4 pill buttons: Last 7 Days, Last 30 Days, Last 90 Days, Custom (selected = filled purple; Custom reveals a date-range picker).
"Export Format" — 2 pill buttons: JSON, CSV (selected = filled purple).
Button: ⬇ Export Report (solid purple) — generates and downloads the file in the chosen format for the chosen range. (Also offer a PDF export as a stretch feature, matching the "Professional PDF exports" marketing claim on the login screen.)

Patient Information card: pulled from the active profile's Settings data — Name, DOB, Blood Type, Conditions, Doctor, Doctor Phone. Editable only via Settings, read-only here.

Report period banner: activity icon + "Report period: {start} to {end}" and a right-aligned "{N} days of data" count, recalculated from the selected date range.

Blood Pressure Summary: section header with a colored classification pill next to it (e.g., "Avg: Stage 1 High") reflecting the average reading's category. 8 stat tiles in a 4-column grid: Average Systolic, Average Diastolic, Average Pulse, Total Readings (BP events) / and a second row: Highest Systolic, Lowest Systolic, Highest Diastolic, Lowest Diastolic — each with big colored numeral + unit caption.

Sleep Summary card: moon icon, big value "{avg}h", caption "Average per night", green trend note if meeting the goal (e.g. "↗ Meeting 7h goal").

Exercise Summary card: activity icon, big value "{total} min", caption "Total exercise time", green trend note if meeting guidelines (e.g. "↗ Meeting WHO guidelines" — WHO recommends ≥150 min/week moderate activity).

All figures must be computed dynamically from the selected date range's stored records, not static.

5.8 Settings (/settings)

Top tabs: Profiles | Notifications | Backup | Security (icons: person, bell, download, lock). Only "Profiles" is detailed in the mock; the others must still be built out sensibly:

Notifications: toggle list for reminder types (e.g., medication reminders, daily log reminder, weekly report).
Backup: manual "Export all data" / "Import data" and note that data auto-syncs to the cloud.
Security: change password, enable 2FA (optional), active sessions/log out of all devices, delete account.

Profiles tab:

Subheading "Manage profiles for each family member" + + Add Profile button (top right, green) which opens/clears the form below for a new entry.
Profile form fields:
Full Name * (required, placeholder "John Smith")
Relationship — dropdown (Self, Spouse, Child, Parent, Other)
Date of Birth — date picker (MM/DD/YYYY)
Gender — dropdown (Select…, Male, Female, Other, Prefer not to say)
Height (placeholder 5'10") / Weight (placeholder 170 lbs)
Blood Type — dropdown (Unknown, A+, A-, B+, B-, AB+, AB-, O+, O-)
Medical Conditions — text (placeholder "e.g. Hypertension")
Doctor Name (placeholder "Dr. Sarah Chen") / Doctor Phone (placeholder "(555) 000-0000")
Emergency Contact — text (placeholder "Name — Phone")
Notes — textarea (placeholder "Additional notes...")
Buttons: ✓ Save Profile (green) and ✕ Cancel (neutral/outline).
Below the form: list of existing profiles as compact cards — avatar initial circle, name, "Self" badge (if applicable), "Default" badge (if applicable), meta line (DOB, Blood type, Doctor), with edit (pencil) and delete (trash) icon buttons per row.
The active profile shown in the top-right account switcher (and used throughout Dashboard/Add Record/History/Reports) must match the profile selected/edited here; switching profiles changes all displayed data to that profile's records.
6. Data Model (suggested schema)
accounts
  id, email, password_hash / auth_provider_id, created_at

profiles
  id, account_id, full_name, relationship, dob, gender,
  height, weight, blood_type, medical_conditions, doctor_name,
  doctor_phone, emergency_contact, notes, is_self (bool),
  is_default (bool), created_at

blood_pressure_records
  id, profile_id, date, time, systolic, diastolic, pulse,
  meal_context, notes, created_at

meal_records
  id, profile_id, date, time, type, notes, created_at

exercise_records
  id, profile_id, date, time, exercise_type, duration_min,
  intensity, notes, created_at

sleep_records
  id, profile_id, date, bed_time, wake_time, quality,
  duration_hours (computed), created_at

symptom_records
  id, profile_id, date, time, time_of_day, symptoms (array),
  severity, notes, created_at

stress_records
  id, profile_id, date, time, level (0-10), notes, created_at

medication_records
  id, profile_id, date, time, medicine_name, dosage, taken (bool),
  created_at

water_records
  id, profile_id, date, time, amount_ml, created_at

water_intake / coffee_intake
  (coffee could be modeled as a meal_record with type = "coffee")

All tables scoped by profile_id → account_id with row-level security so users only access their own data. Use date (YYYY-MM-DD) + time (HH:MM) fields to support the date navigator and journal ordering.

7. Non-Functional Requirements
Cloud-first storage: No critical data may live only in browser local storage; every record write must persist to the backend so logging in on a different device (phone, tablet) shows identical data. Local state is used only for optimistic UI, not as the source of truth.
Authentication & security: Passwords hashed/managed by the auth provider; sessions via secure tokens; "Remember me" extends session length; profile-level data isolation via RLS.
Responsiveness: Fully usable from a phone browser (target 360–430px widths) through desktop (1440px+). Sidebar collapses to a bottom nav or drawer under a defined breakpoint (e.g., 768px); two-column layouts (Add Record, Reports patient info) stack to one column.
Performance: Dashboard and chart queries should be indexed by profile_id + date for fast range queries (7/14/30/90 day windows).
Empty/loading states: Every chart, stat card, and list must handle "no data yet" gracefully (e.g., dashed placeholder, "Log your first reading" CTA) and show loading skeletons while fetching.
Accessibility: Sufficient color contrast against the dark background, focus states on inputs/buttons, form labels tied to inputs, and status pills should not rely on color alone (include text labels, as already shown in the mocks).
Timezones/dates: Store dates/times in a consistent timezone-aware format so the "date navigator" and "today" logic is correct for the user's locale.
Extensibility: Data model should support adding new record categories later without breaking existing ones (e.g., weight tracking, glucose).
8. Extended Platform Features (in scope)

These were originally deferred but should now be included in the build plan.

8.1 Native iOS/Android Apps
Build the frontend with a framework that can ship both web and native from one codebase — React Native + Expo (with Expo Router) is the best fit alongside the React web app, or use Expo for Web so the same components render responsively in-browser and compile to native iOS/Android binaries.
Reuse the same cloud backend/API for web and native — no separate data layer.
Native-only additions: push notifications (medication/reminder alerts even when the app is closed), biometric app-lock (Face ID/Touch ID/fingerprint) as a fast unlock layered on top of the account session, and home-screen widgets for quick "Add Water" / "Add BP Reading."
Offline-first on mobile: queue writes locally (e.g., with a local SQLite/AsyncStorage cache) when there's no connection, and sync to the cloud backend automatically when connectivity returns. Show a small "Syncing…" / "Offline — changes will sync" indicator.
App Store / Play Store readiness: app icons, splash screen, and privacy nutrition labels (the app handles health data, so both stores require a clear privacy disclosure).
8.2 Direct Doctor / EHR Integration
Secure share link: generate a time-limited, revocable read-only link (or PIN-protected link) to a patient's report that a doctor can open without creating an account — satisfies "share professional reports with your doctor" without needing full EHR access.
Email/PDF delivery: let the user email a generated PDF report directly to their doctor's address from the Reports screen (in addition to JSON/CSV download).
Standards-based export: support exporting blood pressure and vitals as HL7 FHIR resources (e.g., Observation resources) so the data can be imported into EHR systems that accept FHIR bundles.
Stretch (v2): OAuth-based integration with patient portals such as Epic MyChart / Cerner (via FHIR API) to push readings directly into a patient's chart — flag this as a larger effort requiring provider partnerships, not a v1 requirement.
8.3 Wearable Device Sync
Integrate with Apple HealthKit (iOS) and Google Fit / Health Connect (Android) to automatically import: steps, heart rate, sleep sessions, and workouts, reducing manual Exercise/Sleep entry.
Integrate with the Fitbit Web API (OAuth) as a cross-platform option for users without native health apps.
Imported records should be clearly tagged as "Synced from {source}" in the journal/timeline (vs. "Manual entry") and should still be editable/deletable like manual entries.
Let the user toggle which categories auto-sync (e.g., sync Sleep + Exercise, but keep Blood Pressure manual since most consumer wearables don't measure BP accurately).
8.4 Multi-language / Localization
Implement an i18n framework (e.g., react-i18next / expo-localization) with all UI strings externalized into translation files from day one, even if only English ships first — this avoids a costly retrofit later.
Support locale-driven unit systems: mmHg stays universal for blood pressure, but Height/Weight should switch between imperial (ft/in, lbs) and metric (cm, kg) based on locale or an explicit user setting in Settings → Profiles.
Support locale-driven date/time formats (e.g., DD/MM/YYYY vs. MM/DD/YYYY, 12h vs 24h clock) throughout Dashboard, Add Record, History, and Reports.
Right-to-left (RTL) layout support should be planned for in the component/styling architecture (e.g., using logical CSS properties) even if the first RTL language ships later.
9. Additional Recommended Features

Beyond what's shown in the mockups, these are high-value additions for a health-tracking product. Suggested priority is noted; pick whichever fit your roadmap.

High priority (strongly recommended for v1):

Reminders & notifications: scheduled push/email reminders for medication doses, daily BP logging, and weekly report generation — ties directly into the existing (currently empty) Settings → Notifications tab.
Customizable goals/targets per profile: target BP range, sleep-hours goal, daily water goal, weekly exercise-minutes goal — used to drive the "Meeting 7h goal" / "Meeting WHO guidelines" style callouts already shown in Reports, and to color-code Dashboard cards (e.g., red highlight if today's BP is above target).
Trend alerts / anomaly detection: flag the user (in-app banner or notification) if a reading is unusually high/low compared to their recent baseline, or if 3+ consecutive readings trend upward — a meaningful safety feature for a hypertension-focused app.
Caregiver / family sharing (view-only access): invite a spouse or adult child to view (not edit) a profile's data and receive alerts — useful for monitoring an elderly parent, distinct from the existing multi-profile "log for family members yourself" feature.
Edit/delete history & audit trail: since health data may need correcting, keep a lightweight change log per record (who changed what, when) rather than silently overwriting.
Data import: allow CSV/JSON upload to bulk-import historical readings (e.g., from a previous app or a spreadsheet a user already kept).

Medium priority (nice-to-have, strong differentiators):

Weekly/monthly email digest: auto-generated summary email (similar to the Reports screen) sent on a schedule, so the user doesn't have to open the app to stay aware of trends.
Photo attachments: attach a photo to a Meal entry (what you ate) or a Symptom entry (e.g., a rash) for richer context.
Quick-add / voice input: a floating "+" quick-action from anywhere in the app (not just the Add Record screen) for fast logging of water or a BP reading in under 5 seconds; voice-to-text for notes fields.
Health score / weekly insight card: a simple composite score (BP stability, sleep consistency, exercise adherence) shown on the Dashboard as a motivational summary, similar to how fitness apps show a "readiness" score.
Light theme toggle: the mockups are dark-only; offering a light theme improves outdoor/daytime mobile readability and accessibility preference support.
CSV/PDF export scheduling: auto-generate and email the monthly report to the user's doctor automatically instead of requiring a manual export each time.

Lower priority / future exploration:

Medication interaction / duplicate-dose warnings using a drug database API.
Telehealth handoff: a "Start video visit" button that opens a linked telehealth provider with the latest report pre-attached.
Community/education content: short articles on managing hypertension, sleep hygiene, etc., surfaced contextually (e.g., after several high readings).
10. Build Priority Order (suggested for the AI)
Auth (login/register/forgot-password) + cloud backend + demo account.
Data model + profiles (Settings → Profiles tab) since everything else depends on a profile_id.
Add Record (all 8 categories) with journal list, since it's the primary data-entry surface.
Dashboard (reads from the same records).
History (Timeline, Calendar, Table views).
Reports (summaries + export, including secure share link and PDF/FHIR export).
Settings remaining tabs (Notifications with reminders, Backup, Security) and responsive polish.
High-priority additional features: goals/targets, trend alerts, caregiver sharing, audit trail, data import.
Native app shell (React Native/Expo) reusing the same backend, plus push notifications and offline sync.
Wearable integrations (HealthKit / Google Fit / Fitbit) and i18n/localization framework.
Medium/low-priority features as roadmap allows.