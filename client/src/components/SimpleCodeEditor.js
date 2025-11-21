import React, { useState } from 'react';
import './SimpleCodeEditor.css';

const SimpleCodeEditor = () => {
  const [code, setCode] = useState(`// Welcome to CodeGen4Future!
// Start coding here...

function helloWorld() {
    console.log("Hello, World!");
    return "Welcome to coding!";
}

// Run your code and see the output below
helloWorld();`);
  
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript'  },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS', icon: '🎨' }
  ];

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    // Reset code based on language
    const defaultCode = getDefaultCode(e.target.value);
    setCode(defaultCode);
  };

  const getDefaultCode = (lang) => {
    const defaults = {
      javascript: `// JavaScript Code
console.log("Hello from JavaScript!");

function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,
      
      python: `# Python Code
print("Hello from Python!")

def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,
      
      java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        String message = greet("Developer");
        System.out.println(message);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
      
      cpp: `// C++ Code
#include <iostream>
#include <string>

std::string greet(std::string name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << "Hello from C++!" << std::endl;
    std::cout << greet("Developer") << std::endl;
    return 0;
}`,
      
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My HTML Page</title>
</head>
<body>
    <h1>Hello from HTML!</h1>
    <p>Welcome to CodeGen4Future</p>
    <div id="output"></div>
    
    <script>
        document.getElementById('output').innerHTML = 'Hello, Developer!';
    </script>
</body>
</html>`,
      
      css: `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin: 0;
    padding: 20px;
    min-height: 100vh;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.1);
    padding: 30px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
}

h1 {
    text-align: center;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

p {
    line-height: 1.6;
    text-align: center;}`
    };
    
    return defaults[lang] || defaults.javascript;
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');
    
    try {
      if (language === 'javascript') {
        // For JavaScript, we'll use a safe evaluation
        const result = await executeJavaScript(code);
        setOutput(result);
      } else if (language === 'html') {
        // For HTML, show preview
        setOutput('HTML Preview:\n' + code);
      } else if (language === 'css') {
        // For CSS, show the code
        setOutput('CSS Code:\n' + code);
      } else {
        // For other languages, show a message
        setOutput(`Code execution for ${language} is not yet implemented.\nThis is a demo version.`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const executeJavaScript = async (jsCode) => {
    return new Promise((resolve) => {
      let output = '';
      let originalLog = console.log;
      
      // Override console.log to capture output
      console.log = (...args) => {
        output += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
      };
      
      try {
        // Use Function constructor for safer execution
        const func = new Function(jsCode);
        func();
        console.log = originalLog;
        resolve(output || 'Code executed successfully!');
      } catch (error) {
        console.log = originalLog;
        resolve(`Error: ${error.message}`);
      }
    });
  };

  const clearCode = () => {
    setCode(getDefaultCode(language));
    setOutput('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setOutput('Code copied to clipboard!');
    } catch (err) {
      setOutput('Failed to copy code');
    }
  };

  const downloadCode = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css'
    };
    
    const extension = extensions[language] || 'txt';
    const filename = `code.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOutput(`Code downloaded as ${filename}`);
  };

  return (
    <div className="simple-code-editor">
      <div className="editor-header">
        <div className="language-selector">
          <label htmlFor="language">Language: </label>
          <select 
            id="language" 
            value={language} 
            onChange={handleLanguageChange}
            className="language-dropdown"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="editor-actions">
          <button 
            onClick={runCode} 
            disabled={isRunning}
            className="btn btn-run"
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button onClick={clearCode} className="btn btn-clear">
             Clear
          </button>
          <button onClick={copyCode} className="btn btn-copy">
             Copy
          </button>
          <button onClick={downloadCode} className="btn btn-download">
             Download
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="code-section">
          <div className="section-header">
            <h3> Code Editor</h3>
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            placeholder="Start coding here..."
            className="code-textarea"
            spellCheck="false"
          />
        </div>

        <div className="output-section">
          <div className="section-header">
            <h3> Output</h3>
          </div>
          <div className="output-display">
            <pre>{output || 'Your output will appear here...'}</pre>
          </div>
        </div>
      </div>

      <div className="editor-footer">
        <p>💡 Tip: Use the language selector to switch between different programming languages</p>
        
      </div>
    </div>
  );
};

export default SimpleCodeEditor;
