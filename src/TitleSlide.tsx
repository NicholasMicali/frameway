import type { Appearance } from './appearance';
import type { Step } from './model';
export function TitleSlide({
  step,
  src,
  logo,
  appearance,
  onStart,
  thumbnail = false,
}: {
  step: Step;
  src: string;
  logo?: string;
  appearance?: Appearance;
  onStart?: () => void;
  thumbnail?: boolean;
}) {
  if (step.kind !== 'title' && step.kind !== 'closing') return null;
  return (
    <div
      className={`title-slide title-layout-${step.kind === 'closing' ? 'centered' : (appearance?.titleLayout ?? 'split')} ${step.kind === 'closing' ? 'closing-slide' : ''} ${thumbnail ? 'title-thumbnail' : ''}`}
    >
      <img className="title-preview" src={src} alt="" />
      <div className="title-copy">
        {logo && <img className="title-logo" src={logo} alt="Company logo" />}
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        {onStart ? (
          <button className="title-start" onClick={onStart}>
            {step.kind === 'closing' ? 'Replay walkthrough' : step.buttonText}
          </button>
        ) : (
          <span className="title-start">
            {step.kind === 'closing' ? 'Replay walkthrough' : step.buttonText}
          </span>
        )}
      </div>
    </div>
  );
}
