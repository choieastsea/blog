---
title: "Base64 Encoder / Decoder"
description: "텍스트를 Base64로 인코딩하거나, Base64를 텍스트로 디코딩합니다. 한국어(UTF-8)를 지원합니다."
---

<style>
.pg-app {
  margin-top: 1.5rem;
}

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

<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel" src="/playgrounds/base64/app.js"></script>
