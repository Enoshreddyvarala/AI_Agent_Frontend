"use client";

import { FormEvent, useState } from "react";

type AgentResponse = {
  session_id: string;
  status: string;
  agent_output: string;
  next_skill?: string | null;
  next_question?: string | null;
};

export default function HomePage() {
  const [candidateName, setCandidateName] = useState("Demo Candidate");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [days, setDays] = useState(14);
  const [hours, setHours] = useState(2);
  const [nextSkill, setNextSkill] = useState("");
  const [nextQuestion, setNextQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [skillsCompare, setSkillsCompare] = useState<any>(null);
  const [gaps, setGaps] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function callAgent(payload: Record<string, unknown>) {
    if (!sessionId) return;
    setLoading(true);
    const res = await fetch(`/api/agent/run/${sessionId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data: AgentResponse = await res.json();
    setLoading(false);
    setAgentOutput(data.agent_output || "");
    setNextSkill(data.next_skill || "");
    setNextQuestion(data.next_question || "");
    if (data.status === "learning_plan_generated") {
      await loadOutputs();
    }
  }

  async function onCreateSession(e: FormEvent) {
    e.preventDefault();
    if (!jdFile || !resumeFile) return;
    setLoading(true);
    const form = new FormData();
    form.append("candidate_name", candidateName);
    form.append("job_description_file", jdFile);
    form.append("resume_file", resumeFile);
    const res = await fetch("/api/ingestion", {
      method: "POST",
      body: form
    });
    const data = await res.json();
    setLoading(false);
    if (data.session_id) {
      setSessionId(data.session_id);
    }
  }

  async function loadOutputs() {
    if (!sessionId) return;
    const [s, g, p, a] = await Promise.all([
      fetch(`/api/skills/compare/${sessionId}`),
      fetch(`/api/gaps/${sessionId}`),
      fetch(`/api/learning-plan/${sessionId}?days_until_interview=${days}`),
      fetch(`/api/analytics/sessions/${sessionId}`)
    ]);
    setSkillsCompare(await s.json());
    setGaps(await g.json());
    setPlan(await p.json());
    setAnalytics(await a.json());
  }

  async function onStart(e: FormEvent) {
    e.preventDefault();
    await callAgent({
      days_until_interview: days,
      preferred_hours_per_day: hours,
      user_message: "Start interview flow"
    });
  }

  async function onSubmitAnswer(e: FormEvent) {
    e.preventDefault();
    if (!nextSkill || !answer) return;
    await callAgent({
      current_skill: nextSkill,
      answer,
      days_until_interview: days,
      preferred_hours_per_day: hours,
      user_message: "Continue interview flow"
    });
    setAnswer("");
  }

  function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );
    const escapeCell = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function skillsRows() {
    if (!skillsCompare) return [];
    return [
      ...(skillsCompare.jd_skills || []).map((skill: string) => ({ category: "jd_skill", skill })),
      ...(skillsCompare.resume_skills || []).map((skill: string) => ({ category: "resume_skill", skill })),
      ...(skillsCompare.matched_skills || []).map((skill: string) => ({ category: "matched_skill", skill })),
      ...(skillsCompare.missing_skills || []).map((skill: string) => ({ category: "missing_skill", skill })),
      ...(skillsCompare.extra_skills || []).map((skill: string) => ({ category: "extra_skill", skill }))
    ];
  }

  return (
    <main>
      <h1>AI Skill Assessment Agent (Vercel Frontend)</h1>
      <p className="muted">Backend calls go through secure server-side proxy routes.</p>

      <div className="card">
        <h3>Create Session (Upload JD + Resume)</h3>
        <form onSubmit={onCreateSession}>
          <input
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Candidate name"
          />
          <label>Job description file</label>
          <input type="file" onChange={(e) => setJdFile(e.target.files?.[0] || null)} />
          <label>Resume file</label>
          <input type="file" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={!jdFile || !resumeFile || loading}>
            Create Session
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Session</h3>
        <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID" />
        <div className="grid">
          <div>
            <label>Days until interview</label>
            <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value || 14))} />
          </div>
          <div>
            <label>Max study hours/day</label>
            <input type="number" step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value || 2))} />
          </div>
        </div>
        <button onClick={loadOutputs} disabled={!sessionId}>
          Load Outputs
        </button>
      </div>

      <div className="card">
        <h3>Agent Interview</h3>
        <form onSubmit={onStart}>
          <button type="submit" disabled={!sessionId || loading}>
            Start / Continue Interview
          </button>
        </form>
        {nextQuestion ? (
          <>
            <p>
              <strong>Skill:</strong> {nextSkill}
            </p>
            <p>{nextQuestion}</p>
            <form onSubmit={onSubmitAnswer}>
              <textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Candidate answer..." />
              <button type="submit" disabled={!answer || loading}>
                Submit Answer
              </button>
            </form>
          </>
        ) : (
          <p className="muted">No pending question yet.</p>
        )}
        {agentOutput ? <p className="muted">{agentOutput}</p> : null}
      </div>

      <div className="card">
        <h3>Skills Compare</h3>
        {skillsCompare ? (
          <>
            <button onClick={() => downloadCsv("skills_compare.csv", skillsRows())}>Download CSV</button>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Skill</th>
                </tr>
              </thead>
              <tbody>
                {skillsRows().map((row, idx) => (
                  <tr key={`${row.category}-${row.skill}-${idx}`}>
                    <td>{String(row.category)}</td>
                    <td>{String(row.skill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="muted">Not loaded</p>
        )}
      </div>

      <div className="grid">
        <div className="card">
          <h3>Gap Report</h3>
          {gaps?.gaps?.length ? (
            <>
              <button onClick={() => downloadCsv("gap_report.csv", gaps.gaps)}>Download CSV</button>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Skill</th>
                    <th>Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {gaps.gaps.map((g: any) => (
                    <tr key={`${g.canonical_name}-${g.priority_rank}`}>
                      <td>{g.priority_rank}</td>
                      <td>{g.canonical_name}</td>
                      <td>{g.weighted_gap_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="muted">Not loaded</p>
          )}
        </div>
        <div className="card">
          <h3>Learning Plan</h3>
          {plan?.items?.length ? (
            <>
              <button onClick={() => downloadCsv("learning_plan.csv", plan.items)}>Download CSV</button>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Skill</th>
                    <th>Hours</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item: any) => (
                    <tr key={`${item.focus_skill}-${item.priority_rank}`}>
                      <td>{item.priority_rank}</td>
                      <td>{item.focus_skill}</td>
                      <td>{item.estimated_hours}</td>
                      <td>
                        {item.start_day}-{item.end_day}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="muted">Not loaded</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Session Analytics</h3>
        {analytics ? (
          <>
            <button onClick={() => downloadCsv("session_analytics.csv", [analytics])}>Download CSV</button>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{typeof value === "object" ? JSON.stringify(value) : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="muted">Not loaded</p>
        )}
      </div>
    </main>
  );
}
