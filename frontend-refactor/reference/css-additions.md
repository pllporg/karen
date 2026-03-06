# CSS Additions

> Append these rules to `apps/web/app/globals.css`.
> These supplement the existing styles — do not remove anything from the current file.
> All values use design tokens from `lic-tokens.css`.

---

## Typography Utilities

```css
/* ── Typography Scale ─────────────────────────────────────── */

.type-display {
  font-family: var(--lic-font-mono);
  font-size: 2.5rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.1;
  text-transform: uppercase;
}

.type-h1 {
  font-family: var(--lic-font-mono);
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-transform: uppercase;
}

.type-h2 {
  font-family: var(--lic-font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.3;
  text-transform: uppercase;
}

.type-h3 {
  font-family: var(--lic-font-mono);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.3;
  text-transform: uppercase;
}

.type-body {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.6;
}

.type-caption {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.5;
}

.type-label {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  line-height: 1.4;
  text-transform: uppercase;
}

.type-micro {
  font-family: var(--lic-font-mono);
  font-size: 0.5625rem;
  font-weight: 400;
  letter-spacing: 0.25em;
  line-height: 1.4;
  text-transform: uppercase;
}
```

---

## Spacing Utilities

```css
/* ── Spacing Scale ────────────────────────────────────────── */

/* Gap utilities (for flex/grid containers) */
.gap-1 { gap: var(--lic-1); }
.gap-2 { gap: var(--lic-2); }
.gap-3 { gap: var(--lic-3); }
.gap-4 { gap: var(--lic-4); }
.gap-5 { gap: var(--lic-5); }
.gap-6 { gap: var(--lic-6); }
.gap-7 { gap: var(--lic-7); }
.gap-8 { gap: var(--lic-8); }

/* Padding utilities */
.p-1 { padding: var(--lic-1); }
.p-2 { padding: var(--lic-2); }
.p-3 { padding: var(--lic-3); }
.p-4 { padding: var(--lic-4); }
.p-5 { padding: var(--lic-5); }
.p-6 { padding: var(--lic-6); }
.p-7 { padding: var(--lic-7); }
.p-8 { padding: var(--lic-8); }

/* Margin-bottom utilities */
.mb-1 { margin-bottom: var(--lic-1); }
.mb-2 { margin-bottom: var(--lic-2); }
.mb-3 { margin-bottom: var(--lic-3); }
.mb-4 { margin-bottom: var(--lic-4); }
.mb-5 { margin-bottom: var(--lic-5); }
.mb-6 { margin-bottom: var(--lic-6); }
.mb-7 { margin-bottom: var(--lic-7); }
.mb-8 { margin-bottom: var(--lic-8); }

/* Margin-top utilities */
.mt-1 { margin-top: var(--lic-1); }
.mt-2 { margin-top: var(--lic-2); }
.mt-3 { margin-top: var(--lic-3); }
.mt-4 { margin-top: var(--lic-4); }
.mt-5 { margin-top: var(--lic-5); }
.mt-6 { margin-top: var(--lic-6); }
.mt-7 { margin-top: var(--lic-7); }
.mt-8 { margin-top: var(--lic-8); }

/* Vertical stack (flex column with gap) */
.stack-1 { display: flex; flex-direction: column; gap: var(--lic-1); }
.stack-2 { display: flex; flex-direction: column; gap: var(--lic-2); }
.stack-3 { display: flex; flex-direction: column; gap: var(--lic-3); }
.stack-4 { display: flex; flex-direction: column; gap: var(--lic-4); }
.stack-5 { display: flex; flex-direction: column; gap: var(--lic-5); }
.stack-6 { display: flex; flex-direction: column; gap: var(--lic-6); }

/* Horizontal row (flex row with gap) */
.row-1 { display: flex; flex-direction: row; gap: var(--lic-1); align-items: center; }
.row-2 { display: flex; flex-direction: row; gap: var(--lic-2); align-items: center; }
.row-3 { display: flex; flex-direction: row; gap: var(--lic-3); align-items: center; }
.row-4 { display: flex; flex-direction: row; gap: var(--lic-4); align-items: center; }
.row-5 { display: flex; flex-direction: row; gap: var(--lic-5); align-items: center; }
```

---

## Layout Grid Utilities

```css
/* ── Grid Layouts ─────────────────────────────────────────── */

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--lic-4);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--lic-4);
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--lic-4);
}

.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--lic-4);
}

.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-full { grid-column: 1 / -1; }

/* Responsive grid collapse */
@media (max-width: 1279px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1023px) {
  .grid-2,
  .grid-3,
  .grid-4 { grid-template-columns: 1fr; }
}
```

---

## Form Layout Utilities

```css
/* ── Form Layouts ─────────────────────────────────────────── */

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--lic-4);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lic-4);
}

.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--lic-4);
}

.form-actions {
  display: flex;
  gap: var(--lic-3);
  justify-content: flex-end;
  padding-top: var(--lic-4);
  border-top: var(--lic-rule-1) solid var(--lic-fog);
}

/* Responsive form collapse */
@media (max-width: 1279px) {
  .form-grid-3 { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 1023px) {
  .form-grid-2,
  .form-grid-3 { grid-template-columns: 1fr; }
}
```

---

## Form Field Error State

```css
/* ── Form Field Error ─────────────────────────────────────── */

.form-field-error {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--lic-filing-red);
  border-left: var(--lic-rule-2) solid var(--lic-filing-red);
  padding-left: var(--lic-2);
  margin-top: var(--lic-1);
}

.form-field-hint {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--lic-slate);
  margin-top: var(--lic-1);
}

.form-field-required {
  color: var(--lic-filing-red);
  margin-left: 2px;
}
```

---

## Enhanced Input States

```css
/* ── Input Error State (supplement existing) ──────────────── */

.input[data-state="error"],
.select[data-state="error"],
.textarea[data-state="error"] {
  border-width: var(--lic-rule-2);
  border-color: var(--lic-filing-red);
  background-color: rgba(139, 37, 0, 0.05);
}

.input[data-state="disabled"],
.select[data-state="disabled"],
.textarea[data-state="disabled"] {
  border-color: var(--lic-fog);
  background-color: var(--lic-parchment);
  color: var(--lic-silver);
  cursor: not-allowed;
}
```

---

## Button Size Variants

```css
/* ── Button Sizes ─────────────────────────────────────────── */

.button[data-size="sm"] {
  height: 24px;
  padding: 4px 12px;
  font-size: 0.6875rem;
}

.button[data-size="md"] {
  height: 40px;
  padding: 8px 20px;
  font-size: 0.8125rem;
}

.button[data-size="lg"] {
  height: 48px;
  padding: 12px 28px;
  font-size: 0.8125rem;
}

/* Button labels: mono, uppercase, tracked */
.button {
  font-family: var(--lic-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## Stepper Component

```css
/* ── Stepper ──────────────────────────────────────────────── */

.stepper {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.stepper-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--lic-font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  border: var(--lic-rule-1) solid var(--lic-ink);
  background: var(--lic-paper);
  color: var(--lic-ink);
  position: relative;
  z-index: 1;
}

.stepper-step[data-status="active"] .stepper-circle {
  border-width: var(--lic-rule-2);
  border-color: var(--lic-institutional);
  color: var(--lic-institutional);
}

.stepper-step[data-status="complete"] .stepper-circle {
  background: var(--lic-ink);
  color: var(--lic-paper);
  border-color: var(--lic-ink);
}

.stepper-step[data-status="blocked"] .stepper-circle {
  border-color: var(--lic-fog);
  color: var(--lic-silver);
  background: var(--lic-parchment);
  cursor: not-allowed;
}

.stepper-label {
  margin-top: var(--lic-2);
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
  text-align: center;
}

.stepper-step[data-status="active"] .stepper-label {
  color: var(--lic-institutional);
}

.stepper-step[data-status="complete"] .stepper-label {
  color: var(--lic-ink);
}

.stepper-connector {
  height: 1px;
  background: var(--lic-fog);
  flex: 1;
  margin-top: 16px; /* half of circle height */
  min-width: 24px;
}

.stepper-connector[data-complete="true"] {
  background: var(--lic-ink);
}
```

---

## Key-Value Display

```css
/* ── Key-Value Display ────────────────────────────────────── */

.kv-stack {
  display: grid;
  gap: var(--lic-3);
}

.kv-stack[data-columns="2"] { grid-template-columns: repeat(2, 1fr); }
.kv-stack[data-columns="3"] { grid-template-columns: repeat(3, 1fr); }

.kv-pair-stacked {
  display: flex;
  flex-direction: column;
  gap: var(--lic-1);
}

.kv-pair-stacked .kv-label {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
}

.kv-pair-stacked .kv-value {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--lic-ink);
}

.kv-inline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.kv-pair-inline {
  display: flex;
  align-items: baseline;
  padding: var(--lic-2) 0;
  border-bottom: var(--lic-rule-1) solid var(--lic-fog);
}

.kv-pair-inline .kv-label {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
  width: 160px;
  flex-shrink: 0;
  text-align: right;
  padding-right: var(--lic-3);
}

.kv-pair-inline .kv-value {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--lic-ink);
}

@media (max-width: 1023px) {
  .kv-stack[data-columns="2"],
  .kv-stack[data-columns="3"] {
    grid-template-columns: 1fr;
  }
  .kv-pair-inline {
    flex-direction: column;
    gap: var(--lic-1);
  }
  .kv-pair-inline .kv-label {
    text-align: left;
    width: auto;
    padding-right: 0;
  }
}
```

---

## Structured Card

```css
/* ── Structured Card ──────────────────────────────────────── */

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lic-2) var(--lic-3);
  border-bottom: var(--lic-rule-1) solid var(--lic-fog);
}

.card-header .card-module {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
}

.card-body {
  padding: var(--lic-3);
}

.card-footer {
  padding: var(--lic-2) var(--lic-3);
  background: var(--lic-parchment);
  border-top: var(--lic-rule-1) solid var(--lic-fog);
}
```

---

## Checkbox, Radio, Toggle

```css
/* ── Checkbox ─────────────────────────────────────────────── */

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--lic-2);
  cursor: pointer;
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: var(--lic-rule-1) solid var(--lic-ink);
  background: var(--lic-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox-box[data-checked="true"]::after {
  content: '';
  width: 10px;
  height: 10px;
  background: var(--lic-ink);
}

.checkbox-box[data-disabled="true"] {
  border-color: var(--lic-fog);
}

.checkbox-box[data-disabled="true"][data-checked="true"]::after {
  background: var(--lic-silver);
}

.checkbox-box:focus-visible {
  outline: 2px solid var(--lic-institutional);
  outline-offset: 2px;
}

.checkbox-label {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--lic-ink);
}

.checkbox-label[data-disabled="true"] {
  color: var(--lic-silver);
}

/* ── Radio ────────────────────────────────────────────────── */

.radio-wrapper {
  display: flex;
  align-items: center;
  gap: var(--lic-2);
  cursor: pointer;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: var(--lic-rule-1) solid var(--lic-ink);
  background: var(--lic-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-circle[data-checked="true"]::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lic-ink);
}

.radio-circle:focus-visible {
  outline: 2px solid var(--lic-institutional);
  outline-offset: 2px;
}

/* ── Toggle ───────────────────────────────────────────────── */

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: var(--lic-2);
  cursor: pointer;
}

.toggle-track {
  width: 40px;
  height: 20px;
  border: var(--lic-rule-1) solid var(--lic-ink);
  background: var(--lic-paper);
  position: relative;
  flex-shrink: 0;
  transition: background var(--lic-motion-fast) linear;
}

.toggle-knob {
  width: 16px;
  height: 16px;
  background: var(--lic-ink);
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform var(--lic-motion-fast) linear;
}

.toggle-track[data-checked="true"] {
  background: var(--lic-institutional);
  border-color: var(--lic-institutional);
}

.toggle-track[data-checked="true"] .toggle-knob {
  transform: translateX(20px);
  background: var(--lic-paper);
}

.toggle-track:focus-visible {
  outline: 2px solid var(--lic-institutional);
  outline-offset: 2px;
}

.toggle-track[data-disabled="true"] {
  border-color: var(--lic-fog);
  background: var(--lic-parchment);
  cursor: not-allowed;
}

.toggle-track[data-disabled="true"] .toggle-knob {
  background: var(--lic-silver);
}
```

---

## Table Enhancements

```css
/* ── Table Enhancements (supplement existing .table rules) ── */

.table[data-alternating="true"] tbody tr:nth-child(even) {
  background: var(--lic-parchment);
}

.table thead th {
  background: var(--lic-ink);
  color: var(--lic-paper);
  font-family: var(--lic-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.6875rem;
  font-weight: 500;
}

.table th[data-sortable="true"] {
  cursor: pointer;
  user-select: none;
}

.table th[data-sortable="true"]:hover {
  background: var(--lic-graphite);
}

.sort-indicator {
  margin-left: var(--lic-1);
  font-size: 0.6875rem;
}
```

---

## Loading State

```css
/* ── Loading State ────────────────────────────────────────── */

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--lic-7) 0;
  gap: var(--lic-3);
}

.loading-bar {
  width: 120px;
  height: 2px;
  background: var(--lic-fog);
  position: relative;
  overflow: hidden;
}

.loading-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40px;
  width: 40px;
  height: 2px;
  background: var(--lic-institutional);
  animation: loading-slide 1.2s linear infinite;
}

@keyframes loading-slide {
  0% { left: -40px; }
  100% { left: 120px; }
}

.loading-label {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
}

@media (prefers-reduced-motion: reduce) {
  .loading-bar::after {
    animation: none;
    left: 40px;
    width: 40px;
  }
}
```

---

## Error and Empty States

```css
/* ── Error State ──────────────────────────────────────────── */

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--lic-7) 0;
  gap: var(--lic-3);
}

.error-state-message {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--lic-ink);
  border-left: var(--lic-rule-2) solid var(--lic-filing-red);
  padding-left: var(--lic-3);
}

/* ── Empty State ──────────────────────────────────────────── */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--lic-7) 0;
  gap: var(--lic-3);
}

.empty-state-message {
  font-family: var(--lic-font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--lic-slate);
}
```

---

## Inline Alert

```css
/* ── Inline Alert ─────────────────────────────────────────── */

.inline-alert {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  padding: var(--lic-2) var(--lic-3);
  border-left: var(--lic-rule-2) solid var(--lic-institutional);
  background: rgba(43, 76, 126, 0.05);
  color: var(--lic-ink);
}

.inline-alert[data-tone="warning"] {
  border-left-color: var(--lic-filing-red);
  background: rgba(139, 37, 0, 0.05);
}

.inline-alert[data-tone="success"] {
  border-left-color: var(--lic-ledger);
  background: rgba(45, 95, 58, 0.05);
}
```

---

## Upload Dropzone

```css
/* ── Upload Dropzone ──────────────────────────────────────── */

.upload-dropzone {
  border: 2px dashed var(--lic-fog);
  padding: var(--lic-5);
  text-align: center;
  cursor: pointer;
  transition: border-color var(--lic-motion-fast) linear;
}

.upload-dropzone:hover,
.upload-dropzone[data-active="true"] {
  border-color: var(--lic-institutional);
}

.upload-dropzone-label {
  font-family: var(--lic-font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lic-slate);
}

.upload-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.upload-status-dot[data-status="uploading"] { background: var(--lic-institutional); }
.upload-status-dot[data-status="complete"] { background: var(--lic-ledger); }
.upload-status-dot[data-status="error"] { background: var(--lic-filing-red); }
```

---

## eSign Status Tracker

```css
/* ── eSign Status Tracker ─────────────────────────────────── */

.esign-tracker {
  display: flex;
  align-items: center;
  gap: 0;
}

.esign-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.esign-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: var(--lic-rule-1) solid var(--lic-fog);
  background: var(--lic-paper);
  z-index: 1;
}

.esign-stage[data-status="active"] .esign-dot {
  border-color: var(--lic-institutional);
  background: var(--lic-institutional);
}

.esign-stage[data-status="complete"] .esign-dot {
  border-color: var(--lic-ink);
  background: var(--lic-ink);
}

.esign-stage[data-status="failed"] .esign-dot {
  border-color: var(--lic-filing-red);
  background: var(--lic-filing-red);
}

.esign-stage-label {
  margin-top: var(--lic-1);
  font-family: var(--lic-font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--lic-slate);
}

.esign-connector {
  height: 1px;
  flex: 1;
  background: var(--lic-fog);
  margin-top: 6px;
  min-width: 16px;
}

.esign-connector[data-complete="true"] {
  background: var(--lic-ink);
}
```

---

## Pagination

```css
/* ── Pagination ───────────────────────────────────────────── */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lic-3) 0;
  border-top: var(--lic-rule-1) solid var(--lic-fog);
}

.pagination-info {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  color: var(--lic-slate);
}

.pagination-buttons {
  display: flex;
  gap: var(--lic-1);
}

.pagination-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--lic-rule-1) solid var(--lic-ink);
  background: var(--lic-paper);
  font-family: var(--lic-font-mono);
  font-size: 0.8125rem;
  cursor: pointer;
}

.pagination-button:hover {
  background: var(--lic-parchment);
}

.pagination-button[data-active="true"] {
  background: var(--lic-ink);
  color: var(--lic-paper);
}

.pagination-button:disabled {
  border-color: var(--lic-fog);
  color: var(--lic-silver);
  cursor: not-allowed;
}

.pagination-button:focus-visible {
  outline: 2px solid var(--lic-institutional);
  outline-offset: 2px;
}
```

---

## Audit Trail

```css
/* ── Audit Trail ──────────────────────────────────────────── */

.audit-trail {
  border-left: var(--lic-rule-1) solid var(--lic-fog);
  padding-left: var(--lic-4);
  margin-left: var(--lic-2);
}

.audit-entry {
  position: relative;
  padding-bottom: var(--lic-3);
}

.audit-entry::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--lic-4) - 3px);
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lic-fog);
}

.audit-entry[data-current="true"]::before {
  background: var(--lic-institutional);
}

.audit-timestamp {
  font-family: var(--lic-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  color: var(--lic-slate);
}

.audit-description {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--lic-ink);
  margin-top: var(--lic-1);
}

.audit-notes {
  font-family: var(--lic-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--lic-slate);
  font-style: italic;
  margin-top: var(--lic-1);
}
```
