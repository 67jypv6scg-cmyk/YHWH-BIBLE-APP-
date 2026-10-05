// Noble Vine Study & Discipleship · 2.0.0 · One-off plan: 6 months, days 140–180
'use strict';
// ---- One-off plan: Whole Bible in 6 Months, days 140 to 180. Offered until finished, then never again ----
var NV_ONEOFF = { id: 'six140', name: 'Whole Bible in 6 Months · days 140–180', offset: 139, rows: ["23-047,23-048,23-049,23-050,23-051,23-052,23-053|19-141|49-005", "23-054,23-055,23-056,23-057,23-058,23-059,23-060|19-142|49-006,50-001", "23-061,23-062,23-063,23-064,23-065,23-066|19-143|50-002,50-003", "24-001,24-002,24-003,24-004|19-144|50-004,51-001", "24-005,24-006,24-007,24-008|19-145|51-002,51-003", "24-009,24-010,24-011,24-012|19-146|51-004,52-001", "24-013,24-014,24-015,24-016,24-017|19-147|52-002,52-003,52-004", "24-018,24-019,24-020,24-021,24-022|19-148|52-005,53-001,53-002", "24-023,24-024,24-025,24-026|19-149|53-003,54-001,54-002", "24-027,24-028,24-029,24-030|19-150|54-003,54-004,54-005", "24-031,24-032,24-033|20-001|54-006,55-001", "24-034,24-035,24-036,24-037|20-002|55-002,55-003", "24-038,24-039,24-040,24-041,24-042|20-003|55-004,56-001,56-002", "24-043,24-044,24-045,24-046,24-047|20-004|56-003,57-001,58-001", "24-048,24-049,24-050|20-005|58-002,58-003,58-004", "24-051,24-052,25-001|20-006|58-005,58-006", "25-002,25-003,25-004,25-005|20-007|58-007,58-008", "26-001,26-002,26-003,26-004,26-005,26-006|20-008|58-009,58-010", "26-007,26-008,26-009,26-010,26-011|20-009|58-011", "26-012,26-013,26-014,26-015,26-016|20-010|58-012", "26-017,26-018,26-019|20-011|58-013,59-001", "26-020,26-021,26-022|20-012|59-002,59-003,59-004", "26-023,26-024,26-025,26-026,26-027|20-013|59-005,60-001", "26-028,26-029,26-030,26-031|20-014|60-002,60-003", "26-032,26-033,26-034,26-035|20-015|60-004,60-005", "26-036,26-037,26-038,26-039|20-016|61-001,61-002", "26-040,26-041,26-042|20-017|61-003,62-001,62-002", "26-043,26-044,26-045,26-046|20-018|62-003", "26-047,26-048,27-001,27-002|20-019|62-004,62-005,63-001", "27-003,27-004,27-005|20-020|64-001,65-001", "27-006,27-007,27-008|20-021|66-001,66-002", "27-009,27-010,27-011,27-012|20-022|66-003,66-004", "28-001,28-002,28-003,28-004,28-005,28-006,28-007,28-008,28-009|20-023|66-005,66-006", "28-010,28-011,28-012,28-013,28-014,29-001,29-002|20-024|66-007,66-008", "29-003,30-001,30-002,30-003,30-004,30-005,30-006|20-025|66-009,66-010,66-011", "30-007,30-008,30-009,31-001,32-001,32-002,32-003,32-004|20-026|66-012,66-013", "33-001,33-002,33-003,33-004,33-005,33-006,33-007|20-027|66-014,66-015", "34-001,34-002,34-003,35-001,35-002,35-003,36-001,36-002|20-028|66-016,66-017", "36-003,37-001,37-002,38-001,38-002,38-003,38-004|20-029|66-018", "38-005,38-006,38-007,38-008,38-009,38-010,38-011|20-030|66-019,66-020", "38-012,38-013,38-014,39-001,39-002,39-003,39-004|20-031|66-021,66-022"] };
function nvOneOffAvailable() { return !S.oneOffDone && !(plans.bible && plans.bible.oneOff === NV_ONEOFF.id); }
function nvStartOneOff() {
  try { if (plans.bible && !plans.bible.oneOff) localStorage.setItem('nb-plan-prev', JSON.stringify(plans.bible)); } catch (e) {}
  usePlan('bible');
  plan = { type: 'oneoff', oneOff: NV_ONEOFF.id, name: NV_ONEOFF.name, days: NV_ONEOFF.rows.length, passes: 1, scope: 'all', offset: NV_ONEOFF.offset,
    start: todayYmd(), schedule: NV_ONEOFF.rows.slice(), done: {}, ticks: {}, pausedFrom: null, created: Date.now() };
  savePlan(true);
  toast('Continuing at day 140. Your other plan is kept safe until you finish.');
  openPlanDay(firstOpen());
}
// When the one-off plan is complete: retire it for good and bring back the plan you had before
function nvCheckOneOff() {
  var p = plans.bible; if (!p || !p.oneOff) return;
  var sl = planSlot; usePlan('bible');
  if (firstOpen()) { usePlan(sl); return; }
  S.oneOffDone = true; saveSettings();
  var prev = null; try { prev = JSON.parse(localStorage.getItem('nb-plan-prev') || 'null'); localStorage.removeItem('nb-plan-prev'); } catch (e) {}
  plan = prev && prev.schedule ? prev : null; savePlan(true); usePlan(sl === 'bible' ? 'bible' : sl);
  setTimeout(function () { toast('Whole Bible in 6 Months complete. Well done!' + (prev ? ' Your earlier plan is back.' : '')); }, 600);
}
function nvOneOffOffer() {
  if (!nvOneOffAvailable()) return '';
  return '<div class="card" style="border-color:color-mix(in srgb, var(--c-gold) 40%, transparent)"><div class="tc-l"><span>Continue from your other app</span></div><h3>Whole Bible in 6 Months</h3><p class="tc-r">Days 140 to 180, starting with Isaiah 47–53, Psalm 141 and Ephesians 5.</p>' +
    '<p class="hint" style="margin:0">' + (plans.bible ? 'Your current plan is kept safe and comes back when you finish.' : 'Runs once; when you finish, it is retired.') + '</p>' +
    '<div class="actions"><button class="primary" id="nvOneGo">Start at day 140</button></div></div>';
}
function nvBindOneOff() { var b = document.getElementById('nvOneGo'); if (b) b.onclick = function () { closeSheet(); nvStartOneOff(); }; }
