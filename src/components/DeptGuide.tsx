"use client";

import { useState } from "react";

type Sub = "org" | "systems";

const SYSTEMS = [
  {
    name: "NetSuite (GL)",
    admin: "System Administrator",
    flow: ["Feeder systems post in", "Coded to the GL", "Reconciled at close", "Financial statements"],
    body: "The general ledger and system of record. Bill.com, Ramp, payroll, and the revenue system all feed into NetSuite, where balances are reconciled during the monthly close and statements are produced.",
  },
  {
    name: "Bill.com (A/P)",
    admin: "A/P Administrator",
    flow: ["Invoice intake", "Coding & review", "Approval", "Payment run", "Sync to GL"],
    body: "Centralised accounts payable. Invoices arrive, get coded and reviewed, route to an approver, then get paid on the payment run. Bills sync to the GL and A/P is reconciled at close.",
  },
  {
    name: "Ramp (Cards & Spend)",
    admin: "Card Program Admin",
    flow: ["Card issued", "Spend", "Coding", "Reimbursements", "Sync to GL"],
    body: "Corporate cards and expense management. Transactions are coded, reimbursements processed, and the activity syncs to the GL for the Ramp reconciliation at close.",
  },
  {
    name: "Payroll (via processor / ADP)",
    admin: "Payroll Owner",
    flow: ["Hours & changes", "Processor runs payroll", "Batch approval", "Direct deposit", "Payroll JE to GL"],
    body: "Payroll is processed each cycle: hourly hours and salaried changes are collected, the processor runs payroll, a reviewer approves the batch, employees are paid by direct deposit, and the payroll journal entry posts to the GL.",
  },
  {
    name: "Revenue System (Bookings)",
    admin: "Revenue Administrator",
    flow: ["Deal / booking entry", "Accounting record", "Weekly upload to GL", "Reconciliation"],
    body: "Bookings and deals are entered, an accounting record is created, and revenue is uploaded to the GL on a weekly cadence and reconciled to the source system at close.",
  },
];

export default function DeptGuide() {
  const [sub, setSub] = useState<Sub>("org");

  return (
    <div className="guide">
      <div className="seg" style={{ marginBottom: 4 }}>
        <button className={sub === "org" ? "on" : ""} onClick={() => setSub("org")}>Org chart</button>
        <button className={sub === "systems" ? "on" : ""} onClick={() => setSub("systems")}>System workflows</button>
      </div>

      {sub === "org" && (
        <div className="panel">
          <h2 className="sec">Accounting &amp; Finance — department map</h2>
          <p>How the team is structured. Names shown are placeholders in this sample build; real roster loads behind the login at handover.</p>
          <div className="orgwrap" style={{ marginTop: 16 }}>
            <div className="orgrow">
              <div className="obox"><div className="on">CFO</div><div className="ot">Finance lead · FP&amp;A</div></div>
              <div className="obox"><div className="on">Controller</div><div className="ot">Close &amp; reporting</div></div>
            </div>
            <div className="orgconn" />
            <div className="orgrow">
              <div className="obox"><div className="on">Senior Accounting Mgr</div><div className="ot">Close owner</div></div>
            </div>
            <div className="orgconn" />
            <div className="orgrow">
              <div className="obox"><div className="on">G/L Accountant</div><div className="ot">Recons &amp; schedules</div></div>
              <div className="obox"><div className="on">Revenue Accountant</div><div className="ot">Bookings &amp; AR</div></div>
              <div className="obox offshore"><div className="on">A/P · A/R Clerk</div><div className="ot">Offshore · intake</div></div>
              <div className="obox offshore dashed"><div className="on">New Hire</div><div className="ot">Offshore · projected</div></div>
            </div>
          </div>
          <p style={{ marginTop: 14 }}>
            <b>Legend:</b> teal = offshore · dashed = projected/open role. Final-approval and payment-release
            duties stay with an onshore approver for segregation of duties.
          </p>
        </div>
      )}

      {sub === "systems" && (
        <>
          {SYSTEMS.map((s) => (
            <div className="panel" key={s.name}>
              <h2 className="sec">{s.name}</h2>
              <p><b>Admin:</b> {s.admin}</p>
              <p>{s.body}</p>
              <div className="gcols" style={{ gridTemplateColumns: `repeat(${s.flow.length}, 1fr)`, marginTop: 14 }}>
                {s.flow.map((step, i) => (
                  <div className="gmini" key={i}>
                    <div className="wkn">Step {i + 1}</div>
                    <div className="gm-h" style={{ marginTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
