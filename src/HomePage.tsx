import { useEffect, type ComponentProps } from 'react';
import { HomeIntro, UseCases } from './HomeIntro';
import { ProjectLibrary } from './ProjectLibrary';
import { Icon } from './Icon';
import { Button } from './ui/Button';
import './styles/home.css';

type HomePageProps = ComponentProps<typeof ProjectLibrary> & { onRecord: () => void };

export function HomePage({ onRecord, ...library }: HomePageProps) {
  useEffect(() => {
    const sections = document.querySelectorAll('.home-page .home-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('home-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <main className="welcome home-page">
      <div className="home-heading">
        <div>
          <div className="eyebrow">YOUR LOCAL WORKSPACE</div>
          <h1>Your walkthroughs</h1>
          <p>
            Turn what’s on your screen into a walkthrough. Capture websites, desktop apps, or an
            entire screen. Turn a process into something your team can watch, follow, and reuse.
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
      <section className="home-sharing home-reveal" aria-labelledby="sharing-title">
        <div className="home-section-heading">
          <span className="home-section-icon">
            <Icon name="share" />
          </span>
          <div>
            <h2 id="sharing-title">Made to share with your team.</h2>
            <p>Help someone learn the workflow—or hand it over so they can make it their own.</p>
          </div>
        </div>
        <div className="sharing-grid">
          <article>
            <span className="sharing-purpose">FOR VIEWERS</span>
            <h3>
              <Icon name="share" /> Send a walkthrough
            </h3>
            <p>
              Choose <strong>Share → Download HTML</strong> for a click-through guide that opens in
              a browser, even offline. Your teammates don’t need Frameway installed.
            </p>
            <p className="sharing-detail">
              Prefer a video? Expand <strong>Video</strong> in Share to export a watch-through
              version.
            </p>
          </article>
          <article>
            <span className="sharing-purpose">FOR COLLABORATORS</span>
            <h3>
              <Icon name="edit" /> Hand off an editable copy
            </h3>
            <p>
              Choose <strong>Share → Download project</strong> and send the{' '}
              <strong>.frameway.zip</strong> file. Your teammate chooses{' '}
              <strong>Options → Import projects</strong> in their Frameway.
            </p>
            <p className="sharing-detail">
              They can update the steps, adapt the branding, and share a new version. Each person
              keeps a separate copy; changes don’t sync automatically.
            </p>
          </article>
          <article>
            <span className="sharing-purpose">FOR YOUR TEAM’S RESOURCES</span>
            <h3>
              <Icon name="monitor" /> Add it to your training
            </h3>
            <p>
              Choose <strong>Share → Export embed</strong> for player files and HTML/React examples
              to place on a website or internal server you manage.
            </p>
            <p className="sharing-detail">
              Use individual walkthroughs in onboarding, process documentation, or a larger training
              module.
            </p>
          </article>
        </div>
        <p className="home-note">
          <Icon name="shield" /> Projects stay in this browser. Keep a downloaded project copy
          before clearing browser data or removing Frameway. HTML and video exports are for viewing,
          not restoring editable projects.
        </p>
      </section>
      <UseCases />
      <div className="home-resources">
        <a
          href="https://github.com/NicholasMicali/frameway/blob/main/docs/BETA-TESTING.md"
          target="_blank"
          rel="noreferrer"
        >
          Getting started <Icon name="external" />
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
