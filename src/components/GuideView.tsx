export default function GuideView() {
  return (
    <div className="guide">
      <div className="panel lead">
        <h2>How to Manage the Monthly Close</h2>
        <p>
          This tracker holds every task required to close the books for MACRO Media and its subsidiaries
          each month — from reconciling cash through issuing financial statements. The goal each cycle is
          simple: move every task from <b>Not Started</b> to <b>Completed</b> (or <b>N/A</b>) in the right
          week, with nothing stuck silently in review.
        </p>
      </div>

      <div className="panel">
        <h2 className="sec">The shape of the close</h2>
        <p>Every task carries two labels that tell you what it is and when it&rsquo;s due.</p>
        <div className="gcols two">
          <div className="gmini">
            <div className="gm-h" style={{ color: "var(--teal)" }}>Close</div>
            <p>Work required to actually lock the general ledger — reconciliations, schedules, journal entries, rollforwards, P&amp;Ls, and the financial statements themselves.</p>
          </div>
          <div className="gmini">
            <div className="gm-h" style={{ color: "var(--ip)" }}>Close Adjacent</div>
            <p>Supporting work that runs in the same window but isn&rsquo;t part of locking the GL — aging follow-ups, reimbursements, 1099s, cash reporting, and foundation books.</p>
          </div>
        </div>
        <div className="gcols">
          <div className="gmini"><div className="wkn">Week One</div><div className="gm-h">Reconcile &amp; gather</div>
            <p>Bank recs across all accounts, pull statements, upload bookings/bills/deposits, AR &amp; AP aging notes, fixed assets &amp; depreciation, prepaids, the prelim Development &amp; Production workbook.</p></div>
          <div className="gmini"><div className="wkn">Week Two</div><div className="gm-h">Build &amp; reconcile</div>
            <p>AR/AP recons, accruals (payroll, accrued expense), development &amp; production rollforwards, related-party recon, deferred revenue and prepaids finals, development allocations.</p></div>
          <div className="gmini"><div className="wkn">Week Three</div><div className="gm-h">Analyze, report &amp; lock</div>
            <p>Flux analysis (revenue, expense), the P&amp;Ls, GL transfers, indirect overhead, content-fund &amp; foundation reporting, financial statements, and the final department sweep.</p></div>
        </div>
      </div>

      <div className="panel">
        <h2 className="sec">What each status means</h2>
        <div className="deflist">
          <div className="defrow"><div className="dk"><span className="dot" style={{ background: "var(--ns)" }} />Not Started</div><div className="dv">Assigned to an owner but not yet begun.</div></div>
          <div className="defrow"><div className="dk"><span className="dot" style={{ background: "var(--ip)" }} />In Progress</div><div className="dv">Actively being worked by the owner.</div></div>
          <div className="defrow"><div className="dk"><span className="dot" style={{ background: "var(--ir)" }} />In Review</div><div className="dv">Finished by the preparer and waiting on reviewer sign-off. Use the note field to say who or what it&rsquo;s waiting on.</div></div>
          <div className="defrow"><div className="dk"><span className="dot" style={{ background: "var(--done)" }} />Completed</div><div className="dv">Done and reviewed. The only status that counts toward the completion percentage.</div></div>
          <div className="defrow"><div className="dk"><span className="dot" style={{ background: "var(--na)" }} />N/A</div><div className="dv">Nothing to do this period. N/A items are excluded from the percentage, so they don&rsquo;t drag the number down.</div></div>
        </div>
      </div>

      <div className="panel">
        <h2 className="sec">Running the cycle, month to month</h2>
        <div className="steps">
          <div className="step"><div className="sn">1</div><div className="sb"><b>Start a new period.</b> Click <b>+ New</b> and name it for the month. The full task list copies from the template, statuses reset to Not Started, and notes clear — N/A items stay N/A.</div></div>
          <div className="step"><div className="sn">2</div><div className="sb"><b>Confirm ownership.</b> Check the <b>Owner</b> on each task and reassign where needed. Group by <b>Owner</b> to see each person&rsquo;s full plate.</div></div>
          <div className="step"><div className="sn">3</div><div className="sb"><b>Work the weeks in order.</b> Group by <b>Week</b> and move top-down through Weeks One, Two, and Three. Update each status as it moves; drop a note on anything blocked.</div></div>
          <div className="step"><div className="sn">4</div><div className="sb"><b>Watch the dashboard.</b> The completion % and per-week bars show whether you&rsquo;re on cadence; the status chips show how much is sitting in review.</div></div>
          <div className="step"><div className="sn">5</div><div className="sb"><b>Close out.</b> Once the flux analyses, P&amp;Ls, and financial statements are Completed and the <b>Department Sweep</b> is done, the month is closed. <b>Export CSV</b> for the close file.</div></div>
        </div>
      </div>

      <div className="panel">
        <h2 className="sec">Ownership &amp; review</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          Most tasks have one preparer — the <b>Owner</b>. The <b>In Review</b> status is the handoff signal:
          when a preparer flips a task to In Review, the reviewer knows it&rsquo;s ready to check. Keep blockers
          visible in the note field so nothing stalls unnoticed. Consistent with MACRO&rsquo;s audit-trail
          standard, a schedule or journal entry should reference its supporting documentation and the required
          approver before it&rsquo;s marked Completed.
        </p>
      </div>
    </div>
  );
}
