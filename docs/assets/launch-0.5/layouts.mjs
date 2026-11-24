// Edit copy and media here; shared visual tokens and composition rules live in styles.css.
// Actual UI captures from the supplied CRM Training project. No mock controls or placeholder imagery.
export const assets = [
  { id: '01-walkthrough', width: 1280, height: 800, title: 'Turn your screen into a walkthrough' },
  { id: '02-capture', width: 1280, height: 800, title: 'Capture clicks as you work' },
  { id: '03-edit', width: 1280, height: 800, title: 'Make every step clear' },
  { id: '04-share', width: 1280, height: 800, title: 'Share something people can use' },
  { id: '05-local', width: 1280, height: 800, title: 'Your work stays local' },
  { id: '06-promo', width: 440, height: 280, title: 'Small promo tile' },
  { id: '07-marquee', width: 1400, height: 560, title: 'Optional marquee' },
  { id: '08-social', width: 1200, height: 630, title: 'Social image' },
];

const logo = '../../../extension/icons/frameway.svg';
const brand = () => `<div class="brand"><img src="${logo}" alt="" /><span>Frameway</span></div>`;
const footer = (number) =>
  `<footer><span>CRM TRAINING · FRAMEWAY</span><span class="folio">${number}</span></footer>`;
const capture = (name, alt, className = '') =>
  `<figure class="capture ${className}"><img src="captures/${name}.png" alt="${alt}" /></figure>`;
const compositions = [
  `${brand()}<div class="top-copy"><p class="eyebrow">RECORD → EDIT → SHARE</p><h1>Turn your screen into a walkthrough</h1></div>
   <div class="finished-hero">${capture('walkthrough', 'CRM Training: Welcome to your pipeline, with its original interactive callout', 'hero-crop')}</div>${footer('01')}`,
  `${brand()}<div class="top-copy"><p class="eyebrow">CAPTURE</p><h1>Capture clicks as you work</h1><p class="lead">Record a Chrome tab. Turn clicks into steps.</p></div>
   <div class="capture-layout"><div class="recording-story">${capture('recording-guide', 'Current Frameway Library guidance for recording Chrome tabs')}<h2>Screenshot and video steps,<br />ready to edit.</h2></div>${capture('sequence', 'The first three steps in CRM Training', 'sequence-shot')}</div>${footer('02')}`,
  `${brand()}<div class="top-copy"><p class="eyebrow">EDIT</p><h1>Make every step clear</h1><p class="lead">Add context where it matters.</p></div>
   <div class="editor-layout"><div class="editor-scene">${capture('editor-stage', 'CRM Training image step with its existing callout', 'stage-shot')}<p>Guide the next step with a clear callout.</p></div>${capture('editor-controls', 'Actual image settings: Arrow, Card, Tip, Warning, Info, and Display style', 'inspector-shot')}</div>${footer('03')}`,
  `${brand()}<div class="top-copy"><p class="eyebrow">SHARE</p><h1>Share something people can use</h1></div>
   <div class="share-layout">${capture('share', 'Actual Share walkthrough dialog for CRM Training', 'share-shot')}<div class="output-list"><div><span class="output-index">01</span><h3>Interactive HTML</h3><p>Open and follow.</p></div><div><span class="output-index">02</span><h3>Video</h3><p>Watch the workflow.</p></div><div><span class="output-index">03</span><h3>Editable project</h3><p>Import and make it your own.</p></div></div></div>${footer('04')}`,
  `${brand()}<div class="top-copy"><p class="eyebrow">LOCAL OWNERSHIP</p><h1>Your work stays local</h1><p class="lead">No Frameway account required.</p></div>
   <div class="local-layout">${capture('library', 'Actual local project library with the supplied CRM Training example', 'library-shot')}<div class="local-copy"><span class="line-marker"></span><h2>Your projects.<br />Your files.</h2><p>Stored in this browser profile.</p><p>Download editable backups to keep.</p></div></div>${footer('05')}`,
  `${brand()}<h1>Record anything.<br />Make it clear.<br /><span>Share it your way.</span></h1><div class="promo-motif" aria-hidden="true"></div>`,
  `${brand()}<div class="marquee-copy"><h1>Record anything.<br />Make it clear.<br /><span>Share it your way.</span></h1><p class="lead">Interactive walkthroughs.<br />Videos. Editable projects.</p></div><div class="marquee-example">${capture('walkthrough', 'CRM Training walkthrough with a real callout', 'hero-crop')}</div>${footer('07')}`,
  `${brand()}<div class="social-copy"><p class="eyebrow">RECORD → EDIT → SHARE</p><h1>Make the next<br />step clear.</h1><p class="lead">Turn screen recordings into<br />interactive walkthroughs.</p><p class="social-note">No Frameway account required.</p></div><div class="social-example">${capture('walkthrough', 'CRM Training walkthrough with a real callout', 'social-crop')}</div>${footer('08')}`,
];

if (typeof document !== 'undefined') {
  const selected = new URLSearchParams(location.search).get('asset');
  document.body.classList.toggle('single', Boolean(selected));
  const gallery = document.querySelector('#gallery');
  for (const [index, asset] of assets.entries()) {
    if (selected && selected !== asset.id) continue;
    const article = document.createElement('article');
    article.className = `artboard asset-${index + 1}`;
    article.id = asset.id;
    article.style.width = `${asset.width}px`;
    article.style.height = `${asset.height}px`;
    article.setAttribute('aria-label', asset.title);
    article.innerHTML = compositions[index];
    gallery.append(article);
  }
  if (!gallery.children.length) throw new Error(`Unknown asset: ${selected}`);
}
