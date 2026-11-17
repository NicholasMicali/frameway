import type { ComponentProps } from 'react';
import { Disclosure } from './Disclosure';
import { HomeIntro, UseCases } from './HomeIntro';
import { ProjectLibrary } from './ProjectLibrary';

type HomePageProps = ComponentProps<typeof ProjectLibrary> & { onRecord: () => void };

export function HomePage({
  projects,
  busy,
  onOpen,
  onBackup,
  onCopy,
  onRename,
  onDelete,
  thumbnail,
  onRecord,
}: HomePageProps) {
  return (
    <main className="welcome home-page">
      <div className="home-heading">
        <div>
          <div className="eyebrow">WELCOME TO FRAMEWAY</div>
          <h1>
            {projects.length
              ? 'Pick up where you left off.'
              : 'Show a workflow. Let people try it.'}
          </h1>
          <p>
            {projects.length
              ? 'Open a project below, or start a new recording from the Frameway toolbar icon.'
              : 'Record your screen, edit the steps, and share a walkthrough anyone can open.'}
          </p>
        </div>
      </div>
      <div className={`home-workspace ${projects.length ? 'has-projects' : ''}`}>
        {!projects.length && <HomeIntro onRecord={() => onRecord()} returning={false} />}
        <ProjectLibrary
          projects={projects}
          busy={busy}
          onOpen={onOpen}
          onBackup={onBackup}
          onCopy={onCopy}
          onRename={onRename}
          onDelete={onDelete}
          thumbnail={thumbnail}
        />
        {!!projects.length && <HomeIntro onRecord={() => onRecord()} returning />}
      </div>
      <div className="home-help">
        <Disclosure
          title="Ideas for your next walkthrough"
          description="Product demos, training, support, and more."
        >
          <UseCases />
        </Disclosure>
        <Disclosure
          title="Keeping your work safe"
          description="Projects are saved on this device. Back them up to keep a copy."
        >
          <p>
            Use Export backup on a project to save an editable ZIP. Import that backup to restore
            your work or move it to another computer. Keep a backup before removing or reinstalling
            Frameway.
          </p>
        </Disclosure>
        {location.protocol !== 'chrome-extension:' && (
          <Disclosure
            title="Can’t find a recording?"
            description="Open Frameway from Chrome’s toolbar to find extension recordings."
          >
            <p>
              This is the local development app. To find walkthroughs recorded with the Chrome
              extension, click the Frameway icon in Chrome and choose Open Frameway. Opening a
              project here does not switch apps.
            </p>
            <p>
              To bring a project here, export its project backup there, then choose Options → Import
              project backup.
            </p>
          </Disclosure>
        )}
      </div>
    </main>
  );
}
