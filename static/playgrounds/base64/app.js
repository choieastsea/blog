const { useState, useCallback, useEffect } = React;

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  const binString = Array.from(bytes, b => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

function decodeBase64(base64) {
  const cleaned = base64.replace(/\s/g, '');
  const binString = atob(cleaned);
  const bytes = Uint8Array.from(binString, c => c.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

function App() {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      if (mode === 'encode') {
        setOutput(encodeBase64(input));
      } else {
        setOutput(decodeBase64(input));
      }
      setError('');
    } catch (e) {
      setOutput('');
      setError('유효하지 않은 Base64 문자열입니다. 입력값을 확인해주세요.');
    }
  }, [input, mode]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setInput('');
    setOutput('');
    setError('');
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output]);

  const inputLabel = mode === 'encode' ? '원본 텍스트' : 'Base64';
  const outputLabel = mode === 'encode' ? 'Base64' : '디코딩 결과';
  const inputPlaceholder = mode === 'encode'
    ? '인코딩할 텍스트를 입력하세요...'
    : '디코딩할 Base64 문자열을 입력하세요...';

  return (
    <div className="pg-app">
      <div className="pg-tab-group">
        <button
          className={`pg-tab-btn${mode === 'encode' ? ' active' : ''}`}
          onClick={() => handleModeChange('encode')}
        >
          Encode
        </button>
        <button
          className={`pg-tab-btn${mode === 'decode' ? ' active' : ''}`}
          onClick={() => handleModeChange('decode')}
        >
          Decode
        </button>
      </div>

      <div className="pg-section">
        <div className="pg-label">{inputLabel}</div>
        <textarea
          className="pg-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={inputPlaceholder}
          spellCheck={false}
        />
      </div>

      <div className="pg-divider">{mode === 'encode' ? '↓ 인코딩' : '↓ 디코딩'}</div>

      <div className="pg-section">
        <div className="pg-label">{outputLabel}</div>
        <div className="pg-output-wrapper">
          <div className="pg-output-box">
            {output
              ? output
              : <span className="pg-placeholder">결과가 여기에 표시됩니다</span>
            }
          </div>
          {output && (
            <button
              className={`pg-copy-btn${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          )}
        </div>
        {error && <div className="pg-error-box">{error}</div>}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('playground-app'));
root.render(<App />);
