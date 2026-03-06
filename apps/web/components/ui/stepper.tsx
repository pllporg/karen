'use client';

export type StepperStep = {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'blocked';
};

export type StepperProps = {
  steps: StepperStep[];
  onStepClick?: (index: number) => void;
};

export function Stepper({ steps, onStepClick }: StepperProps) {
  return (
    <div className="stepper" role="list" aria-label="Progress steps">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isClickable = Boolean(onStepClick) && (step.status === 'complete' || step.status === 'active');

        return (
          <div key={`${step.label}-${index}`} className="stepper-step" data-status={step.status} role="listitem">
            {isClickable ? (
              <button type="button" className="stepper-circle" onClick={() => onStepClick?.(index)}>
                {step.status === 'complete' ? '✓' : index + 1}
              </button>
            ) : (
              <div className="stepper-circle">{step.status === 'complete' ? '✓' : index + 1}</div>
            )}
            <span className="stepper-label">{step.label}</span>
            {isLast ? null : (
              <span
                className="stepper-connector"
                data-complete={step.status === 'complete' ? 'true' : undefined}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
