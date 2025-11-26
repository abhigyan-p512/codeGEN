import React, { useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./MonacoCodeRunner.css";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
];

const DEFAULT_SNIPPETS = {
  javascript: `// JavaScript template
function solve() {
  const input = require("fs").readFileSync(0, "utf8").trim();
  console.log(input);
}

solve();`,
  python: `# Python template
def solve():
    import sys
    data = sys.stdin.read().strip()
    print(data)

if __name__ == "__main__":
    solve()`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    if (getline(cin, s)) {
        cout << s << "\\n";
    }
    return 0;
}`,
  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            lines.add(line);
        }
        System.out.println(lines.size());
    }
}`,
  c: `#include <stdio.h>

int main(void) {
    char buffer[1024];
    int lines = 0;
    while (fgets(buffer, sizeof(buffer), stdin)) {
        lines++;
    }
    printf("%d\\n", lines);
    return 0;
}`,
};

// ---- Accessibility fix for Monaco tooltips ----
function useFixMonacoTooltips() {
  useEffect(() => {
    const fixTooltips = () => {
      const nodes = document.querySelectorAll(
        '.monaco-hover[role="tooltip"]:not([aria-label]):not([aria-hidden="true"])'
      );
      nodes.forEach((el) => {
        const text = el.textContent?.trim();
        if (!text) return;
        // give tooltip an accessible name (trim so it doesn't get huge)
        el.setAttribute("aria-label", text.slice(0, 120));
      });
    };

    // initial run
    fixTooltips();

    // observe DOM for new Monaco hover widgets
    const observer = new MutationObserver(fixTooltips);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
}

export default function MonacoCodeRunner({
  value,
  onChange,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  runOutput,
  isRunning = false,
  isSubmitting = false,
  allowSubmit = true,
  readOnly = false,
}) {
  useFixMonacoTooltips(); // <-- accessibility hook

  const code = value ?? DEFAULT_SNIPPETS[language] ?? "";

  const handleLanguageChange = (event) => {
    const next = event.target.value;
    onLanguageChange?.(next);
  };

  const toolbarButtons = useMemo(
    () => [
      {
        key: "run",
        label: isRunning ? "Running..." : "Run Code",
        disabled: readOnly || isRunning,
        action: () => onRun?.(),
        className: "monaco-btn primary",
      },
      allowSubmit && {
        key: "submit",
        label: isSubmitting ? "Submitting..." : "Submit to Duel",
        disabled: readOnly || isSubmitting,
        action: () => onSubmit?.(),
        className: "monaco-btn accent",
      },
    ].filter(Boolean),
    [allowSubmit, isRunning, isSubmitting, onRun, onSubmit, readOnly]
  );

  return (
    <div className="monaco-runner">
      <div className="monaco-toolbar">
        <div className="language-select">
          <label htmlFor="monaco-language">Language</label>
          <select
            id="monaco-language"
            value={language}
            onChange={handleLanguageChange}
            disabled={readOnly}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              className={btn.className}
              disabled={btn.disabled}
              onClick={btn.action}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="360px"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={(next) => onChange?.(next ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            readOnly,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            automaticLayout: true,
          }}
        />
      </div>
      <div className="output-panel">
        <div className="output-header">Output</div>
        <pre>{runOutput || "Run code to see output…"}</pre>
      </div>
    </div>
  );
}
