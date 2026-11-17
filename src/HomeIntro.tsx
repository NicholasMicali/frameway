import { Icon } from './Icon';

export function HomeIntro() {
  return (
    <section className="home-start" aria-labelledby="guide-title">
      <div className="quick-guide">
        <div className="home-section-heading">
          <span className="home-section-icon">
            <Icon name="edit" />
          </span>
          <div>
            <h2 id="guide-title">From recording to sharing</h2>
            <p>Three steps to a walkthrough people can follow at their own pace.</p>
          </div>
        </div>
        <div className="quick-guide-grid">
          <article>
            <span className="guide-step">01 / CAPTURE</span>
            <h3>Record your workflow</h3>
            <p>
              Pin Frameway from Chrome’s Extensions menu. For a website, choose{' '}
              <strong>Record this tab</strong> from the toolbar and wait for <strong>REC</strong>.
              Pause when needed; choose <strong>Finish recording</strong> to open the editor.
            </p>
            <p>
              Use <strong>Record my screen</strong> for desktop apps or a whole screen. Both options
              record video without audio.
            </p>
          </article>
          <article>
            <span className="guide-step">02 / EDIT</span>
            <h3>Make the steps clear</h3>
            <p>
              Arrange screenshot and video slides, add callouts, and highlight what matters.
              Screenshot slides wait for a click; video slides show the action between steps.
            </p>
            <p>
              Use <strong>Preview</strong> to try the experience before sharing.
            </p>
          </article>
          <article>
            <span className="guide-step">03 / SHARE</span>
            <h3>Send it to someone</h3>
            <p>
              Use <strong>Share</strong> to download a walkthrough or prepare an embed. Export a
              project backup when someone needs to edit it or you want to keep a separate copy.
            </p>
            <p>Come back through Chrome’s Frameway menu to open your saved projects.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function UseCases() {
  return (
    <section className="use-cases" aria-labelledby="use-cases-title">
      <h2 id="use-cases-title">A clearer way to show how things work</h2>
      <div className="use-case-grid">
        <article>
          <Icon name="record" />
          <h3>Product demos</h3>
          <p>Give people a guided look at a workflow they can explore at their own pace.</p>
        </article>
        <article>
          <Icon name="folder" />
          <h3>Training & onboarding</h3>
          <p>Make everyday processes easier to learn, revisit, and share with a team.</p>
        </article>
        <article>
          <Icon name="share" />
          <h3>Support & handoffs</h3>
          <p>Show the steps behind an answer, across websites and desktop applications.</p>
        </article>
      </div>
    </section>
  );
}
