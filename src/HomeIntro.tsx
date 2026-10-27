import packageInfo from '../package.json';

export function HomeIntro({ onRecord, returning }: { onRecord: () => void; returning: boolean }) {
  const extension = location.protocol === 'chrome-extension:';
  return (
    <section className="home-start" aria-label="Getting started">
      <details
        className="quick-guide"
        key={returning ? 'returning' : 'new'}
        open={returning ? undefined : true}
      >
        <summary>
          {returning
            ? 'Create another walkthrough · Recording & sharing guide'
            : 'Make your first walkthrough'}
        </summary>
        <p>
          Capture a short workflow, add context, and send an interactive file. Everything stays
          local until you share it.
        </p>
        <div className="quick-guide-grid">
          <article>
            <span className="guide-number">1</span>
            <h3>Record your clicks</h3>
            <p>
              Open the page you want to show. In Chrome’s toolbar, click Frameway →{' '}
              <strong>Record this tab</strong>. Wait for <strong>REC</strong>, then choose{' '}
              <strong>Stop recording</strong> when done.
            </p>
            <a href="demo.html" target="_blank" rel="noreferrer">
              Open the practice workspace ↗
            </a>
          </article>
          <article>
            <span className="guide-number">2</span>
            <h3>Make the steps clear</h3>
            <p>
              The editor opens automatically. Select a slide to edit its title and callout.
              Screenshot slides wait for a click; video slides show the action between clicks. Use
              Preview to try the walkthrough.
            </p>
          </article>
          <article>
            <span className="guide-number">3</span>
            <h3>Send it to someone</h3>
            <p>
              Choose <strong>Export / Download → Download HTML</strong>. Send that file; your
              recipient downloads it and opens it in a browser. Use <strong>Export project</strong>{' '}
              for an editable backup.
            </p>
          </article>
        </div>
        <p className="guide-tip">
          Coming back later? Choose <strong>Open Frameway</strong> from the extension menu. Your
          projects are saved in this browser.
        </p>
        <details id="extension-setup" className="install-guide">
          <summary>
            {extension
              ? 'Extension setup & updating'
              : 'Install the Chrome extension (recommended)'}
          </summary>
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
              choose Frameway → Record this tab.
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
        </details>
        <div className="manual-recording">
          <div>
            <h3>Need a window or your whole screen?</h3>
            <p>
              The browser recorder captures video; you add screenshot steps manually. The Chrome
              extension creates click-by-click steps automatically.
            </p>
          </div>
          <button onClick={onRecord}>Record my screen</button>
        </div>
      </details>
    </section>
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
