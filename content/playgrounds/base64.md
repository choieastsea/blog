---
title: "Base64 Encoder / Decoder"
description: "텍스트를 Base64로 인코딩하거나, Base64를 텍스트로 디코딩합니다. 한국어(UTF-8)를 지원합니다."
---

<style>
.pg-tab-group {
  display: inline-flex;
  background: var(--code-background);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 1.5rem;
}

.pg-tab-btn {
  padding: 0.4rem 1.1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: transparent;
  color: var(--content-secondary);
  font-family: var(--font-body);
}

.pg-tab-btn.active {
  background: var(--content-primary);
  color: var(--background);
}

.pg-section {
  margin-bottom: 1rem;
}

.pg-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--content-secondary);
  margin-bottom: 0.5rem;
}

.pg-textarea {
  width: 100%;
  min-height: 140px;
  padding: 0.75rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  background: var(--code-background);
  color: var(--content-primary);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.pg-textarea:focus {
  border-color: var(--content-secondary);
}

.pg-output-wrapper {
  position: relative;
}

.pg-output-box {
  width: 100%;
  min-height: 140px;
  padding: 0.75rem 1rem;
  padding-right: 5.5rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  background: var(--code-background);
  color: var(--content-primary);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  box-sizing: border-box;
}

.pg-placeholder {
  color: var(--content-secondary);
}

.pg-copy-btn {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--background);
  color: var(--content-secondary);
  border: 1px solid var(--code-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--font-body);
}

.pg-copy-btn:hover {
  background: var(--code-background);
}

.pg-copy-btn.copied {
  color: #16a34a;
  border-color: #bbf7d0;
}

.pg-error-box {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

.dark .pg-error-box {
  border-color: #7f1d1d;
  color: #f87171;
}

.pg-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  color: var(--content-secondary);
  font-size: 0.75rem;
}

.pg-divider::before,
.pg-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--code-border);
}
</style>

<div class="pg-tab-group">
  <button class="pg-tab-btn active" id="btn-encode" onclick="setMode('encode')">Encode</button>
  <button class="pg-tab-btn" id="btn-decode" onclick="setMode('decode')">Decode</button>
</div>

<div class="pg-section">
  <div class="pg-label" id="input-label">원본 텍스트</div>
  <textarea class="pg-textarea" id="pg-input" placeholder="인코딩할 텍스트를 입력하세요..." spellcheck="false" oninput="convert()"></textarea>
</div>

<div class="pg-divider" id="pg-divider">↓ 인코딩</div>

<div class="pg-section">
  <div class="pg-label" id="output-label">Base64</div>
  <div class="pg-output-wrapper">
    <div class="pg-output-box" id="pg-output"><span class="pg-placeholder">결과가 여기에 표시됩니다</span></div>
    <button class="pg-copy-btn" id="pg-copy-btn" style="display:none" onclick="copyOutput()">복사</button>
  </div>
  <div class="pg-error-box" id="pg-error" style="display:none"></div>
</div>

<script>
var mode = 'encode';

function encodeBase64(text) {
  var bytes = new TextEncoder().encode(text);
  var binString = Array.from(bytes, function(b) { return String.fromCodePoint(b); }).join('');
  return btoa(binString);
}

function decodeBase64(base64) {
  var cleaned = base64.replace(/\s/g, '');
  var binString = atob(cleaned);
  var bytes = Uint8Array.from(binString, function(c) { return c.codePointAt(0); });
  return new TextDecoder().decode(bytes);
}

function setMode(newMode) {
  mode = newMode;
  document.getElementById('pg-input').value = '';
  document.getElementById('pg-output').innerHTML = '<span class="pg-placeholder">결과가 여기에 표시됩니다</span>';
  document.getElementById('pg-error').style.display = 'none';
  document.getElementById('pg-copy-btn').style.display = 'none';

  var isEncode = mode === 'encode';
  document.getElementById('btn-encode').classList.toggle('active', isEncode);
  document.getElementById('btn-decode').classList.toggle('active', !isEncode);
  document.getElementById('input-label').textContent = isEncode ? '원본 텍스트' : 'Base64';
  document.getElementById('output-label').textContent = isEncode ? 'Base64' : '디코딩 결과';
  document.getElementById('pg-divider').textContent = isEncode ? '↓ 인코딩' : '↓ 디코딩';
  document.getElementById('pg-input').placeholder = isEncode
    ? '인코딩할 텍스트를 입력하세요...'
    : '디코딩할 Base64 문자열을 입력하세요...';
}

function convert() {
  var input = document.getElementById('pg-input').value;
  var outputEl = document.getElementById('pg-output');
  var errorEl = document.getElementById('pg-error');
  var copyBtn = document.getElementById('pg-copy-btn');

  if (!input.trim()) {
    outputEl.innerHTML = '<span class="pg-placeholder">결과가 여기에 표시됩니다</span>';
    errorEl.style.display = 'none';
    copyBtn.style.display = 'none';
    return;
  }

  try {
    var result = mode === 'encode' ? encodeBase64(input) : decodeBase64(input);
    outputEl.textContent = result;
    errorEl.style.display = 'none';
    copyBtn.style.display = 'block';
    copyBtn.textContent = '복사';
    copyBtn.classList.remove('copied');
  } catch (e) {
    outputEl.innerHTML = '<span class="pg-placeholder">결과가 여기에 표시됩니다</span>';
    errorEl.textContent = '유효하지 않은 Base64 문자열입니다. 입력값을 확인해주세요.';
    errorEl.style.display = 'block';
    copyBtn.style.display = 'none';
  }
}

function copyOutput() {
  var text = document.getElementById('pg-output').textContent;
  var btn = document.getElementById('pg-copy-btn');
  navigator.clipboard.writeText(text).then(function() {
    btn.textContent = '복사됨 ✓';
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = '복사';
      btn.classList.remove('copied');
    }, 2000);
  });
}
</script>
