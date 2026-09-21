import { openModal } from '../core/ui.js';
export async function showPdfPreview(doc) {
  const modal=openModal({title:'Aperçu DUT recto / verso',text:'Aperçu sans enregistrement d’impression. Utilisez « DUT recto / verso » pour choisir l’exemplaire et télécharger.',large:true,confirmLabel:'Fermer',hideCancel:true,bodyHtml:'<div class="pdf-preview-pages" style="background:#e9edf3;padding:12px;max-height:60vh;overflow:auto"><p role="status">Préparation des pages…</p></div>'});
  let task;
  const observer=new MutationObserver(()=>{if(!modal.root.isConnected){task?.destroy();observer.disconnect();}});observer.observe(document.body,{childList:true});
  const holder=modal.root.querySelector('.pdf-preview-pages');
  try {
    const pdfjs=await import('../vendor/pdf.min.mjs');
    if(!modal.root.isConnected)return;
    pdfjs.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdf.worker.min.mjs',import.meta.url).href;
    task=pdfjs.getDocument({data:new Uint8Array(doc.output('arraybuffer')),useSystemFonts:true});
    const document=await task.promise;
    holder.innerHTML='';
    for(let n=1;n<=document.numPages;n++){
      if(!modal.root.isConnected)return;
      const page=await document.getPage(n);
      const canvas=window.document.createElement('canvas');
      canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`DUT révisé - page ${n} sur ${document.numPages}`);
      canvas.style.cssText='display:block;width:100%;height:auto;background:white;margin-bottom:12px;box-shadow:0 2px 8px #14283f20';
      const viewport=page.getViewport({scale:1.5});canvas.width=viewport.width;canvas.height=viewport.height;holder.appendChild(canvas);
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    }
  } catch(error){if(modal.root.isConnected)holder.textContent='Aperçu indisponible : '+error.message;}
}
