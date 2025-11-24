// client/src/constants/languages.js

// Simple default snippets for the duel editor.
// If you already have templates elsewhere (e.g. src/lib/languageTemplates.js)
// you can import and re-export them here instead.

export const LANGUAGE_SNIPPETS = {
  python: `# Write your solution in Python
def solve():
    # TODO: read input from stdin and print output
    pass

if __name__ == "__main__":
    solve()
`,

  javascript: `// Write your solution in JavaScript (Node.js)
function solve() {
  // TODO: read input from stdin (fs.readFileSync(0, "utf8")) and print output
}

solve();
`,

  cpp: `// Write your solution in C++
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: read from std::cin and print to std::cout
    return 0;
}
`,
};
