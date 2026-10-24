import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { orderedScreenshots, type Screenshot } from '../data/portfolio';
export function ScreenshotGallery({ images, name }: { images: Screenshot[]; name: string }) {
  const screenshots = orderedScreenshots(images);
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const restore = () => { document.body.style.overflow = ''; trigger.current?.focus(); };
    element.addEventListener('close', restore);
    return () => { element.removeEventListener('close', restore); document.body.style.overflow = ''; };
  }, []);
  if (!screenshots.length) return <p className="gallery-empty">Application screenshots have not been published yet. The illustration above is a visual concept.</p>;
  const active = screenshots[index];
  const move = (step: number) => setIndex(current => (current + step + screenshots.length) % screenshots.length);
  const close = () => dialog.current?.close();
  return <>
    <div className="screenshot-gallery">
      {screenshots.map((image, i) => <figure key={image.src}>
        <button className="screenshot-trigger" aria-label={`Expand ${name} screenshot ${i + 1}: ${image.alt}`}
          onClick={event => { trigger.current = event.currentTarget; setIndex(i); dialog.current?.showModal(); document.body.style.overflow = 'hidden'; closeButton.current?.focus(); }}>
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async"/>
          <span className="expand-label"><Expand size={15} aria-hidden="true"/> Expand</span>
        </button>
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>)}
    </div>
    <dialog className="screenshot-lightbox" ref={dialog} aria-labelledby="lightbox-title" aria-describedby="lightbox-caption"
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}>
      <div className="lightbox-content">
        <div className="lightbox-header"><h3 id="lightbox-title">{name} <span>{index + 1} / {screenshots.length}</span></h3>
          <button ref={closeButton} onClick={close} aria-label="Close screenshot viewer" autoFocus><X size={22}/></button></div>
        <a className="lightbox-original" href={active.src} target="_blank" rel="noopener noreferrer" aria-label="Open screenshot at full resolution in a new tab">
          <img src={active.src} alt={active.alt} width={active.width} height={active.height}/>
        </a>
        <a className="lightbox-original-link" href={active.src} target="_blank" rel="noopener noreferrer">Open full-resolution image ↗</a>
        <div className="lightbox-controls"><button onClick={() => move(-1)} aria-label="Previous screenshot" disabled={screenshots.length < 2}><ChevronLeft size={22}/></button>
          <p id="lightbox-caption" aria-live="polite">{active.caption || active.alt}</p>
          <button onClick={() => move(1)} aria-label="Next screenshot" disabled={screenshots.length < 2}><ChevronRight size={22}/></button></div>
      </div>
    </dialog>
  </>;
}
