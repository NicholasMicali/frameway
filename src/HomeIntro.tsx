import packageInfo from '../package.json';

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
          <h3>Install from the extension ZIP</h3>
          <a
            className="primary home-cta"
            href="https://github.com/NicholasMicali/frameway/releases"
            target="_blank"
            rel="noreferrer"
          >
            Find the beta package ↗
          </a>
          <p>No Node.js or build tools needed. Works with Chrome on macOS and Windows.</p>
          <ol>
            <li>
              Download <strong>frameway-extension-v{packageInfo.version}.zip</strong> from the
              release’s <strong>Assets</strong> list. Choose the extension package, not GitHub’s
              “Source code” ZIP.
            </li>
            <li>
              Unzip it into a folder you’ll keep. On Windows, right-click the ZIP and choose{' '}
              <strong>Extract All</strong>.
            </li>
            <li>
              Open <code>chrome://extensions</code> in Chrome and turn on{' '}
              <strong>Developer mode</strong>.
            </li>
            <li>
              Click <strong>Load unpacked</strong>. Select the extracted folder containing{' '}
              <code>manifest.json</code>—not the ZIP file or its parent folder.
            </li>
            <li>
              Pin Frameway from Chrome’s Extensions menu, open the page you want to demonstrate, and
              click Frameway to record.
            </li>
          </ol>
          <p>
            Already installed? Export important projects before replacing the extension. After
            updating files in the same folder, click <strong>Reload</strong> on its Chrome card and
            reopen the editor. Keep that folder in place.
          </p>
          <details>
            <summary>Building from source?</summary>
            <p>
              Run <code>npm ci</code> and <code>npm run build</code>, then load the generated{' '}
              <code>dist</code> folder. There is no Chrome Web Store listing yet.
            </p>
          </details>
        </div>
      </section>
      <section className="use-cases home-next-steps" aria-label="After recording">
        <h2>Record it. Make it clear. Pass it on.</h2>
        <div className="use-case-grid">
          <article>
            <h3>1. Refine the steps</h3>
            <p>
              Edit screenshot and video slides, add callouts and highlights, and make the title
              slide your own.
            </p>
          </article>
          <article>
            <h3>2. Share the walkthrough</h3>
            <p>
              Choose Download HTML for one interactive file to send, or Export embed for your
              website. Recipients can open the downloaded HTML in their browser.
            </p>
          </article>
          <article>
            <h3>3. Keep an editable backup</h3>
            <p>
              Choose Export project to save a project ZIP. Use Import to restore it after
              reinstalling or move it to another computer. Playback HTML is for viewing; project
              ZIPs keep your work editable.
            </p>
          </article>
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
