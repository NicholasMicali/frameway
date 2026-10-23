export function HomeIntro({ onRecord }: { onRecord: () => void }) {
  return (
    <>
      <section className="home-hero">
        <div className="eyebrow">FROM A FEW CLICKS TO A CLEARER STORY</div>
        <h1>
          Show how it works.
          <br />
          Let people try it.
        </h1>
        <p>
          Turn a real workflow into an interactive walkthrough.
          <br />
          Record your clicks, refine each step, and share it anywhere.
        </p>
        <a
          className="primary home-cta"
          href="#extension-setup"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('extension-setup')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Get started with the Chrome extension ↓
        </a>
        <p className="home-recommendation">
          Recommended · Automatic screenshots and video between your clicks
        </p>
      </section>
      <section id="extension-setup" className="extension-setup">
        <div>
          <span className="eyebrow">THE EASIEST WAY TO RECORD</span>
          <h2>
            Click through your product.
            <br />
            We’ll build the steps.
          </h2>
          <p>
            The Chrome extension captures your tab and click locations, then opens an editable
            walkthrough with screenshots and video already arranged.
          </p>
          <p>
            Pin Frameway in Chrome. Click its icon to start, wait for the <strong>REC</strong>{' '}
            badge, then click it again to finish.
          </p>
          <a href="demo.html" target="_blank" rel="noreferrer">
            Try it on the practice workspace ↗
          </a>
        </div>
        <div className="install-guide">
          <h3>Install the beta extension</h3>
          <ol>
            <li>
              Build the project with <code>npm ci</code> and <code>npm run build</code>, or unzip a
              Frameway extension release package.
            </li>
            <li>
              Open <code>chrome://extensions</code> in Chrome and turn on{' '}
              <strong>Developer mode</strong>.
            </li>
            <li>
              Choose <strong>Load unpacked</strong> and select the built <code>dist</code> folder—or
              the unzipped release folder containing <code>manifest.json</code>.
            </li>
            <li>Pin Frameway from Chrome’s Extensions menu. You’re ready to record.</li>
          </ol>
          <p>
            Already installed? Use <strong>Reload</strong> on the extension’s card after updating
            the build. No Chrome Web Store installation yet.
          </p>
        </div>
      </section>
      <section className="manual-recording">
        <div>
          <h3>Need to capture a window or your whole screen?</h3>
          <p>
            Use the browser recorder, then add screenshot steps manually. For automatic
            click-by-click steps, use the extension above.
          </p>
        </div>
        <button onClick={onRecord}>Record my screen</button>
      </section>
    </>
  );
}
export function UseCases() {
  return (
    <section className="use-cases">
      <div className="eyebrow">LESS EXPLAINING. MORE UNDERSTANDING.</div>
      <h2>Give every workflow a walkthrough.</h2>
      <div className="use-case-grid">
        {[
          [
            'Product demos',
            'Let prospects explore a key workflow at their own pace. Embed a demo on your website or send a standalone file.',
          ],
          [
            'Customer onboarding',
            'Guide new customers through their first successful task with clear steps and focused callouts.',
          ],
          [
            'Team training & SOPs',
            'Document repeatable processes so teammates can follow along without another meeting.',
          ],
          [
            'Support & handoffs',
            'Show exactly where to click when answering a question or handing a workflow to another team.',
          ],
        ].map(([title, body]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <p className="local-promise">
        Local by design. Recordings and edits stay in your browser until you export or share them.
      </p>
    </section>
  );
}
