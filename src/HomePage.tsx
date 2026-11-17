import type { ComponentProps } from 'react';
import { HomeIntro, UseCases } from './HomeIntro';
import { ProjectLibrary } from './ProjectLibrary';
import { Icon } from './Icon';
import { Button } from './ui/Button';
import './styles/home.css';

type HomePageProps = ComponentProps<typeof ProjectLibrary> & { onRecord: () => void };

export function HomePage({ onRecord, ...library }: HomePageProps) {
  return (
    <main className="welcome home-page">
      <div className="home-heading">
        <div>
          <div className="eyebrow">YOUR LOCAL WORKSPACE</div>
          <h1>Your walkthroughs</h1>
          <p>
            Turn what’s on your screen into a walkthrough. Capture websites, desktop apps, or an
            entire screen, then edit and share.
          </p>
        </div>
        <span className="local-badge">
          <Icon name="shield" /> Local by design
        </span>
      </div>
      <section className="capture-choices" aria-label="Ways to record">
        <div className="capture-recommended">
          <span className="home-section-icon">
            <Icon name="record" />
          </span>
          <div>
            <h2>
              Recording a website? <span className="recommended-label">Recommended</span>
            </h2>
            <p>
              Open the page, then choose <strong>Frameway → Record this tab</strong> in Chrome’s
              toolbar. Video and click-by-click screenshot steps are captured together.
            </p>
          </div>
        </div>
        <div className="capture-screen">
          <div>
            <h2>Anything beyond your browser</h2>
            <p>Capture a window or your screen, then add screenshot steps in the editor.</p>
          </div>
          <Button onClick={onRecord} disabled={library.busy}>
            <Icon name="monitor" /> Record my screen
          </Button>
        </div>
      </section>
      <div className="home-workspace">
        <ProjectLibrary {...library} />
      </div>
      <HomeIntro />
      <section className="home-sharing" aria-labelledby="sharing-title">
        <div className="home-section-heading">
          <span className="home-section-icon">
            <Icon name="share" />
          </span>
          <div>
            <h2 id="sharing-title">Share the walkthrough. Keep the editable original.</h2>
            <p>Choose the file that fits what you want to do.</p>
          </div>
        </div>
        <div className="sharing-grid">
          <article>
            <h3>
              <Icon name="share" /> Send or embed
            </h3>
            <p>
              Choose <strong>Share → Send a walkthrough → Download HTML</strong>. Your recipient
              opens the downloaded file in a browser—no Frameway installation needed. Embed exports
              are available in Share too.
            </p>
          </article>
          <article>
            <h3>
              <Icon name="download" /> Back up or move a project
            </h3>
            <p>
              Choose <strong>Export backup</strong> from a project’s menu. Restore its editable ZIP
              through <strong>Options → Import project backup</strong>. Keep backups before removing
              Frameway or clearing browser data.
            </p>
          </article>
        </div>
        <p className="home-note">
          <Icon name="shield" /> Recordings and edits stay in this browser until you export or share
          them. A saved project is not a separate backup.
        </p>
      </section>
      <UseCases />
      <div className="home-resources">
        <a
          href="https://github.com/NicholasMicali/frameway/blob/main/docs/BETA-TESTING.md"
          target="_blank"
          rel="noreferrer"
        >
          Help & installation <Icon name="external" />
        </a>
        <a
          href="https://github.com/NicholasMicali/frameway/blob/main/PRIVACY.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy <Icon name="external" />
        </a>
        <a
          href="https://github.com/NicholasMicali/frameway/issues"
          target="_blank"
          rel="noreferrer"
        >
          Report an issue <Icon name="external" />
        </a>
      </div>
      {location.protocol !== 'chrome-extension:' && (
        <aside className="development-note">
          <strong>Using the development app?</strong> Recordings made with the extension are in its
          library. Open Frameway from Chrome’s toolbar to find them, or use a project backup to move
          work here.
        </aside>
      )}
    </main>
  );
}
