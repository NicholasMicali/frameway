(() => {
  const project = JSON.parse(document.getElementById('walkthrough-data').textContent);
  const root = document.getElementById('player');
  const element = (tag, className, parent, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    parent.append(el);
    return el;
  };
  document.title = project.title;
  element('h1', 'title', root, project.title);
  const stage = element('div', 'stage', root);
  const screen = element('div', 'screen', stage);
  screen.style.aspectRatio = `${project.width}/${project.height}`;
  const image = element('img', 'media', screen);
  const video = element('video', 'media', screen);
  video.src = project.video;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  const titleSlide=element('div','title-slide',screen);
  const titleImage=element('img','title-preview',titleSlide);titleImage.alt='';
  const titleCopy=element('div','title-copy',titleSlide);
  const titleLogo=element('img','title-logo',titleCopy);titleLogo.alt='Company logo';titleLogo.hidden=!project.logo;if(project.logo)titleLogo.src=project.logo;
  const titleHeading=element('h2','',titleCopy),titleBody=element('p','',titleCopy),titleStart=element('button','title-start',titleCopy);
  const hotspot = element('button', 'hotspot', screen, '●');
  hotspot.setAttribute('aria-label', 'Hotspot');
  const card = element('section', 'card', stage);
  for (const [name,value] of Object.entries(project.theme || {})) { screen.style.setProperty(name,value); card.style.setProperty(name,value); }
  const heading = element('h2', '', card);
  const body = element('p', '', card);
  const continueButton = element('button', 'primary', card, 'Continue →');
  const nav = element('nav', '', root);
  nav.setAttribute('aria-label', 'Walkthrough controls');
  const back = element('button', '', nav, '← Back');
  const restart = element('button', '', nav, 'Restart');
  const progress = element('span', 'progress', nav);
  progress.setAttribute('aria-live', 'polite');
  const play = element('button', '', nav, 'Play');
  const next = element('button', 'primary', nav, 'Next →');
  const error = element('p', 'error', root);
  error.setAttribute('role', 'alert');
  let index = 0, history = [], generation = 0, frame = 0, completed = false, ready = false;
  const step = () => project.steps[index];
  const targetIndex = () => {
    const target = step().target;
    return target === 'end' ? -1 : target === 'next' ? (index + 1 < project.steps.length ? index + 1 : -1) : project.steps.findIndex(s => s.id === target);
  };
  function positionCard() {
    if (card.hidden || matchMedia('(max-width: 600px)').matches) return;
    const bounds = screen.getBoundingClientRect();
    card.style.left = `${Math.max(0, Math.min(step().cardX * bounds.width, bounds.width - card.offsetWidth))}px`;
    card.style.top = `${Math.max(0, Math.min(step().cardY * bounds.height, bounds.height - card.offsetHeight))}px`;
    card.style.maxHeight = `${bounds.height}px`;
  }
  new ResizeObserver(positionCard).observe(screen);
  new ResizeObserver(positionCard).observe(card);
  function move(to, remember = true) {
    if (to < 0 || to >= project.steps.length) return;
    if (remember) history.push(index);
    index = to;
    render();
  }
  function advance() {
    const to = targetIndex();
    if (to >= 0) move(to);
  }
  function finish() {
    if (completed || step().kind !== 'video') return;
    completed = true;
    video.pause();
    if (targetIndex() >= 0) advance();
    else play.textContent = 'Replay clip';
  }
  function watch() {
    cancelAnimationFrame(frame);
    if (!video.paused && step().kind === 'video') {
      if (video.currentTime >= step().clipEnd - .015) finish();
      else frame = requestAnimationFrame(watch);
    }
  }
  async function start() {
    if (!ready || step().kind !== 'video') return;
    const token = generation;
    if (completed) { video.currentTime = step().clipStart; completed = false; }
    error.textContent = '';
    try { await video.play(); if (token !== generation) return; play.textContent = 'Pause'; watch(); }
    catch { if (token === generation) error.textContent = 'Playback did not start. Select Play to try again.'; }
  }
  function prepare() {
    if (step().kind !== 'video' || video.readyState < 1) return;
    ready = true;
    video.currentTime = step().clipStart;
    play.disabled = false;
    if (step().autoplay) void start();
  }
  function render() {
    generation++;
    cancelAnimationFrame(frame);
    video.pause();
    completed = false; ready = false;
    error.textContent = '';
    const s = step();
    image.classList.remove('area-zoom-image');hotspot.classList.remove('area-zoom-hotspot');
    titleSlide.hidden=s.kind!=='title';titleImage.src=s.image;titleHeading.textContent=s.title;titleBody.textContent=s.body;titleStart.textContent=s.kind==='title'?s.buttonText:'';
    image.hidden = s.kind !== 'image';
    video.hidden = s.kind !== 'video';
    image.src = s.image;
    image.alt = s.title;
    video.poster = s.image;
    video.setAttribute('aria-label', s.title);
    hotspot.hidden = s.kind !== 'image' || s.style === 'callout';
    hotspot.classList.toggle('area-hotspot', s.style === 'area');
    hotspot.style.width = s.style === 'area' ? `${(s.areaWidth ?? .25)*100}%` : '';
    hotspot.style.height = s.style === 'area' ? `${(s.areaHeight ?? .2)*100}%` : '';
    hotspot.textContent = s.style === 'area' ? '' : '●';
    const bound=(n,w)=>Math.max(w/2,Math.min(1-w/2,n));
    card.style.width = s.cardWidth ? `${s.cardWidth*100}%` : '';
    hotspot.style.left = `${(s.style === 'area' ? bound(s.x,s.areaWidth??.25) : s.x) * 100}%`;
    hotspot.style.top = `${(s.style === 'area' ? bound(s.y,s.areaHeight??.2) : s.y) * 100}%`;
    for(const [key,value] of Object.entries(s.zoomVars||{})){image.style.setProperty(key,value);hotspot.style.setProperty(key,value);}
    if(s.kind==='image'&&s.style==='area'&&s.zoomEnabled){void screen.offsetWidth;image.classList.add('area-zoom-image');hotspot.classList.add('area-zoom-hotspot');}
    card.hidden = s.kind !== 'image' || (s.style !== 'callout' && !s.openByDefault);
    heading.textContent = s.title;
    body.textContent = s.body;
    card.scrollTop = 0;
    progress.textContent = `Step ${index + 1} of ${project.steps.length}`;
    back.disabled = history.length === 0;
    play.hidden = s.kind !== 'video';
    play.disabled = true;
    play.textContent = 'Play';
    next.textContent = continueButton.textContent = targetIndex() < 0 ? 'Replay' : 'Continue →';
    positionCard();
    if (s.kind === 'video') prepare();
  }
  const reset = () => { history = []; move(0, false); };
  const go = () => targetIndex() < 0 ? reset() : advance();
  titleStart.onclick = continueButton.onclick = next.onclick = go;
  hotspot.onclick = () => { if (card.hidden) { card.hidden = false; positionCard(); } else go(); };
  back.onclick = () => { if (history.length) move(history.pop(), false); };
  restart.onclick = reset;
  play.onclick = () => { if (video.paused) void start(); else { video.pause(); play.textContent = 'Play'; } };
  video.addEventListener('loadedmetadata', prepare);
  video.addEventListener('ended', finish);
  video.addEventListener('error', () => { error.textContent = 'Video could not load. Keep the exported media folder beside index.html and use a browser that supports WebM.'; });
  image.addEventListener('error', () => { error.textContent = 'A screenshot could not load. Keep the exported media folder beside index.html.'; });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(); }
    if (e.key === 'ArrowLeft' && history.length) { e.preventDefault(); back.click(); }
  });
  render();
})();
