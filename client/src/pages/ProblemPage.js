// client/src/pages/ProblemPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const languageOptions = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "cpp", label: "C++" },
];

const defaultTemplates = {
  python: `# Write your solution here...
def solve():
    # example: read input, process and print
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())
    # TODO: implement your logic
    print(n, arr, target)

if __name__ == "__main__":
    solve()`,
  javascript: `// Write your solution here...
function solve() {
  console.log("Hello from JS");
}
// solve();`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int target;
    cin >> target;

    // TODO: implement your logic

    cout << n << "\\n";
    return 0;
}`,
};

function ProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultTemplates.python);
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // submission UI state
  const [submitStatus, setSubmitStatus] = useState(null); // "Accepted" | "Rejected" | "Submitted" | null
  const [submitMessage, setSubmitMessage] = useState("");
  const [judgeDetails, setJudgeDetails] = useState(null); // { totalTests, wrongTest, expected, actual }

  const contestId = location.state?.contestId || null;
  // ✅ NEW: battleId if we came from a Team Battle Room
  const battleId = location.state?.battleId || null;

  // Load problem by slug
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/problems/${slug}`);
        setProblem(res.data);

        if (res.data.exampleTests && res.data.exampleTests.length > 0) {
          setCustomInput(res.data.exampleTests[0].input || "");
        }
      } catch (err) {
        console.error("Failed to load problem:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Change template on language switch
  useEffect(() => {
    setCode(defaultTemplates[language] || "");
  }, [language]);

  // ---------- Run Code (no auth required) ----------
  async function handleRunCode() {
    try {
      setRunning(true);
      setOutput("");

      const res = await api.post("/judge/run", {
        code,
        language,
        input: customInput,
      });

      const out =
        res.data.output || res.data.stdout || "No output received from runner.";
      setOutput(out);
    } catch (err) {
      console.error("Run code error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error executing code.";
      setOutput(msg);
    } finally {
      setRunning(false);
    }
  }

  // ---------- Submit (auto-judge, auth required) ----------
  async function handleSubmit() {
    if (!user) {
      setSubmitStatus(null);
      setSubmitMessage("You must be logged in to submit.");
      setJudgeDetails(null);
      return;
    }
    if (!problem) return;

    try {
      setSubmitting(true);
      setSubmitStatus(null);
      setSubmitMessage("");
      setJudgeDetails(null);

      // ✅ Build payload and include contestId / battleId if present
      const payload = {
        problemId: problem._id,
        code,
        language,
      };

      if (contestId) {
        payload.contestId = contestId;
      }
      if (battleId) {
        payload.battleId = battleId;
        // optional debug:
        // console.log("Submitting with battleId", battleId);
      }

      const res = await api.post("/submissions", payload);

      const data = res.data || {};
      const finalStatus = data.status || "Submitted";

      setSubmitStatus(finalStatus);
      setJudgeDetails({
        totalTests: data.totalTests ?? null,
        wrongTest: data.wrongTest,
        expected: data.expected,
        actual: data.actual,
      });

      if (finalStatus === "Accepted") {
        if (data.totalTests != null) {
          setSubmitMessage(
            `Your solution passed all ${data.totalTests}/${data.totalTests} example test cases. ✅`
          );
        } else {
          setSubmitMessage("Your solution passed all example test cases. ✅");
        }
      } else if (finalStatus === "Rejected") {
        if (data.wrongTest != null) {
          const idx = (data.wrongTest ?? 0) + 1;
          setSubmitMessage(
            `Your solution failed example test case #${idx}. ❌`
          );
        } else {
          setSubmitMessage(
            "Your solution failed one or more example test cases. ❌"
          );
        }
      } else {
        setSubmitMessage(
          "Your submission was received. Auto-judge result is not available."
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error submitting solution.";
      setSubmitStatus(null);
      setJudgeDetails(null);
      setSubmitMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !problem) {
    return (
      <div className="app-page">
        <h2 style={{ color: "#fff" }}>Loading problem...</h2>
      </div>
    );
  }

  const difficultyColor =
    problem.difficulty === "Easy"
      ? "#22c55e"
      : problem.difficulty === "Medium"
      ? "#f97316"
      : "#ef4444";

  let statusBg = "#1f2937";
  let statusTextColor = "#e5e7eb";

  if (submitStatus === "Accepted") {
    statusBg = "rgba(22, 163, 74, 0.15)";
    statusTextColor = "#22c55e";
  } else if (submitStatus === "Rejected") {
    statusBg = "rgba(239, 68, 68, 0.15)";
    statusTextColor = "#f97373";
  } else if (submitStatus === "Submitted") {
    statusBg = "rgba(59, 130, 246, 0.12)";
    statusTextColor = "#60a5fa";
  }

  return (
    <div className="app-page" style={{ display: "flex", gap: "24px" }}>
      {/* LEFT: problem panel */}
      <div
        style={{
          flex: 1,
          background: "#111827",
          borderRadius: "18px",
          padding: "24px",
          boxShadow: "0 18px 60px rgba(0,0,0,0.7)",
          color: "#e5e7eb",
          minHeight: "calc(100vh - 140px)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#5ee7ff" }}>
            {problem.title}
          </h1>
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: "#020617",
              color: difficultyColor,
              border: `1px solid ${difficultyColor}`,
            }}
          >
            {problem.difficulty}
          </span>
        </div>

        <h3 style={{ color: "#38bdf8", fontSize: 18, marginBottom: 6 }}>
          Description
        </h3>
        <p
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          {problem.description}
        </p>

        {problem.exampleTests && problem.exampleTests.length > 0 && (
          <>
            <h3
              style={{
                color: "#38bdf8",
                fontSize: 18,
                marginBottom: 10,
                marginTop: 12,
              }}
            >
              Examples
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {problem.exampleTests.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#020617",
                    borderRadius: 12,
                    padding: 16,
                    border: "1px solid #1f2937",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      color: "#9ca3af",
                      fontSize: 13,
                    }}
                  >
                    <span>Example {idx + 1}</span>
                    <button
                      onClick={() => setCustomInput(t.input || "")}
                      style={{
                        fontSize: 12,
                        padding: "2px 10px",
                        borderRadius: 999,
                        border: "1px solid #4b5563",
                        background: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                      }}
                    >
                      Use as Input
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "#e5e7eb",
                    }}
                  >
                    {t.input && `Input:\n${t.input}\n`}
                    {t.output && `Output:\n${t.output}`}
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* RIGHT: editor panel */}
      <div
        style={{
          flex: 1,
          background: "#020617",
          borderRadius: "18px",
          padding: "18px 18px 22px",
          boxShadow: "0 18px 60px rgba(0,0,0,0.7)",
          color: "#e5e7eb",
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 140px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
          }}
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: "#020617",
              border: "1px solid #4b5563",
              borderRadius: 999,
              color: "#e5e7eb",
              padding: "6px 14px",
            }}
          >
            {languageOptions.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleRunCode}
            disabled={running}
            style={{
              background: "#22c55e",
              border: "none",
              color: "#020617",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: 999,
              cursor: running ? "default" : "pointer",
              opacity: running ? 0.7 : 1,
            }}
          >
            {running ? "Running..." : "Run Code"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: "#a855f7",
              border: "none",
              color: "#f9fafb",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: 999,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #111827",
            marginBottom: 12,
          }}
        >
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 280,
              border: "none",
              outline: "none",
              resize: "none",
              background: "#020617",
              color: "#e5e7eb",
              fontFamily: "JetBrains Mono, Menlo, monospace",
              fontSize: 13,
              padding: 12,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#9ca3af",
                marginBottom: 4,
              }}
            >
              Custom Input
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: 120,
                borderRadius: 10,
                border: "1px solid #111827",
                background: "#020617",
                color: "#e5e7eb",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                padding: 10,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 13,
                color: "#9ca3af",
                marginBottom: 4,
              }}
            >
              Output
            </div>
            <pre
              style={{
                width: "100%",
                minHeight: 120,
                borderRadius: 10,
                border: "1px solid #111827",
                background: "#020617",
                color: "#e5e7eb",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                padding: 10,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {output || "Run your code to see output here."}
            </pre>
          </div>
        </div>

        {(submitStatus || submitMessage) && (
          <div style={{ marginTop: 12 }}>
            {submitStatus && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: statusBg,
                  color: statusTextColor,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {submitStatus === "Accepted" && <>✅ Accepted</>}
                {submitStatus === "Rejected" && <>❌ Rejected</>}
                {submitStatus === "Submitted" && <>ℹ️ Submitted</>}
              </div>
            )}

            {submitMessage && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                {submitMessage}
              </div>
            )}

            {/* Detailed diff when Rejected */}
            {submitStatus === "Rejected" && judgeDetails && (
              <div
                style={{
                  marginTop: 10,
                  background: "#020617",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  padding: 10,
                  fontSize: 13,
                }}
              >
                {judgeDetails.totalTests != null && (
                  <div style={{ marginBottom: 6, color: "#9ca3af" }}>
                    Checked{" "}
                    <strong>
                      {judgeDetails.totalTests} example
                      {judgeDetails.totalTests === 1 ? "" : "s"}
                    </strong>
                    .
                  </div>
                )}

                {judgeDetails.wrongTest != null && (
                  <div style={{ marginBottom: 4, color: "#e5e7eb" }}>
                    First failing example:{" "}
                    <strong>#{judgeDetails.wrongTest + 1}</strong>
                  </div>
                )}

                {judgeDetails.expected != null && (
                  <>
                    <div style={{ color: "#9ca3af" }}>Expected output:</div>
                    <pre
                      style={{
                        margin: "2px 0 8px",
                        background: "#020617",
                        borderRadius: 6,
                        border: "1px solid #111827",
                        padding: 8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {judgeDetails.expected}
                    </pre>
                  </>
                )}

                {judgeDetails.actual != null && (
                  <>
                    <div style={{ color: "#9ca3af" }}>Your output:</div>
                    <pre
                      style={{
                        margin: "2px 0 0",
                        background: "#020617",
                        borderRadius: 6,
                        border: "1px solid #111827",
                        padding: 8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {judgeDetails.actual}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemPage;
