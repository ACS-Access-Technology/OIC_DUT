import { printState, COPIES } from './dut-print.service.js';
import { computeFacturationTotals, computeMarchandiseTotals } from './dut.service.js';
const N=[12,45,74], G=[90,99,115], BORDER=[191,202,214], LIGHT=[241,245,249];
const text = value => String(value ?? '').replace(/[\u202f\u00a0]/g,' ').replace(/[–—]/g,'-').replace(/[’]/g,"'").replace(/→/g,'>');
const number = value => text(new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(Number(value)||0));
const date = value => value ? new Date(value).toLocaleDateString('fr-FR') : '-';
export function buildDutPdf(jsPDF, payload, hash, { logo, emblem, qr } = {}) {
  const d=payload.document, g=d.general, a=d.annexes || {}, state=printState(d);
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  const extras=[];
  const put=(value,x,y,size=9,bold=false,color=N,options={})=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(Array.isArray(value)?value.map(text):text(value),x,y,options);};
  const rect=(x,y,w,h,fill=LIGHT)=>{doc.setFillColor(...fill);doc.setDrawColor(...BORDER);doc.setLineWidth(.2);doc.rect(x,y,w,h,'FD');};
  const lines=(value,width,size=8)=>{doc.setFont('helvetica','normal');doc.setFontSize(size);return doc.splitTextToSize(text(value || '-'),width);};
  function block(label,value,x,y,w,max=2,size=8) {
    put(label.toUpperCase(),x,y,6.5,true,G);
    const wrapped=lines(value,w,size);
    if(wrapped.length>max) extras.push({label,value:text(value)});
    put(wrapped.length>max?[...wrapped.slice(0,max-1),wrapped[max-1]+' [...]']:wrapped,x,y+4,size,false,N,{lineHeightFactor:1.2});
  }
  function section(title,y){doc.setFillColor(...N);doc.rect(11,y-2,1.6,1.6,'F');put(title,15,y,8,true);doc.setDrawColor(...BORDER);doc.line(11,y+2,199,y+2);}
  function header(large=false){
    if(emblem) doc.addImage(emblem,'PNG',11,7,16,15);
    put("RÉPUBLIQUE DE CÔTE D'IVOIRE",31,13,9,true);
    put('Union - Discipline - Travail',31,18,7,false,G);
    if(logo) doc.addImage(logo,'JPEG',174,4,26,22);
    rect(0,26,210,large?18:13,N);
    put('Office Ivoirien des Chargeurs',11,33,large?12:10,true,[255,255,255]);
    if(large) put('DOCUMENT UNIQUE DE TRANSPORT',11,39,9,true,[255,255,255]);
    put(state.watermark==='SANS VALEUR'?'NON OFFICIEL':COPIES[payload.copy].toUpperCase(),198,32,7,true,[255,255,255],{align:'right'});
    put(large ? 'Décret n° 2015-270 du 22 avril 2015' : 'MODÈLE RÉVISÉ - POC LOCAL',198,large?39:37,6,false,[210,226,244],{align:'right'});
    const yy=large?44:39;
    doc.setDrawColor(...state.color);doc.setLineWidth(.25);
    for(let x=0;x<210;x+=2) doc.line(x,yy,x+1.2,yy+1.3);
    // Fine repeating wave band: decorative only, not an authentication guarantee.
    doc.setDrawColor(80,133,181);doc.setLineWidth(.1);
    for(let x=0;x<209;x+=.8) doc.line(x,yy+.7+Math.sin(x)*.35,x+.8,yy+.7+Math.sin(x+.8)*.35);
  }
  function status(y,compact=false){
    const issued=['VALIDE','SUSPENDU','RETIRE'].includes(d.status);
    if(state.watermark){put(state.watermark,112,y+(compact?11:16),compact?18:23,true,[229,229,232],{align:'center',angle:12});}
    put(issued?d.dutNumber:'NON ATTRIBUÉ',11,y,compact?12:19,true);
    if(d.status==='RETIRE'){doc.setDrawColor(...state.color);doc.line(11,y-2,compact?90:123,y-2);}
    rect(11,y+3,28,6,state.color);put(state.label,25,y+7.2,7,true,[255,255,255],{align:'center'});
    put(`Impression n° ${payload.rank}  |  Émis le ${date(g.dateEmission)}`,42,y+7,7,false,G);
    const statusDate=d.status==='SUSPENDU'?d.suspendedAt:d.status==='RETIRE'?d.withdrawnAt:d.status==='TERMINE'?d.submittedAt:d.status==='REJETE'?d.rejectedAt:d.status==='EN_EDITION'?d.createdAt:d.validatedAt;
    const statusText=`${state.label} : ${date(statusDate)}${statusDate ? ' '+new Date(statusDate).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : ''}${d.validatedBy&&d.status==='VALIDE'?' - '+d.validatedBy:''}`;const statusLines=lines(statusText,150,7);if(statusLines.length>2)extras.push({label:'Validation',value:statusText});put(statusLines.slice(0,2),11,y+15,7,false,G);
    if(!compact){
      block('Antenne émettrice',d.antennaName,11,y+23,47,1);
      block('Partenaire agréé',d.partnerName,64,y+23,53,1);
      block("Plage d'attribution",payload.operation,123,y+23,37,1);
      if(issued&&qr){rect(166,y-9,33,33,[255,255,255]);doc.addImage(qr,'PNG',168,y-7,29,29);put(state.qr,182.5,y+28,6.5,true,state.color,{align:'center'});}
      else {rect(166,y-9,33,33);put('AUCUN QR',182.5,y+9,8,true,G,{align:'center'});}
    }
    const warning = [payload.statusNote && ['SUSPENDU','RETIRE'].includes(d.status) ? 'Motif : '+payload.statusNote : '',state.warning].filter(Boolean).join(' ');
    const warningLines = lines(warning,188,6.5);
    if(warningLines.length>2) extras.push({label:'État et motif',value:warning});
    put(warningLines.slice(0,2),11,y+(compact?22:37),6.5,true,state.color,{lineHeightFactor:1.1});
  }
  header(true);status(57);
  section('1 - TRANSPORTEUR, VÉHICULE ET CONDUCTEUR',106);
  block('Transporteur',g.transporterName,11,112,61,2,9);block('Immatriculation',g.immatriculation,77,112,56,1,9);block('Conducteur',`${g.driverNom||''} ${g.driverPrenoms||''}`,141,112,58,2,9);
  block('Registre de commerce',payload.transporter.registre,11,128,60,1);block('Type / capacité',`${payload.vehicle.type || '-'} / ${payload.vehicle.capaciteTonnes ?? '-'} t`,77,128,58,1);block("Permis / pièce d'identité",`${g.driverPermis||'-'} / ${g.driverPiece||'-'}`,141,128,58,2,7);
  section('2 - EXPÉDITEUR ET DESTINATAIRE',144);
  for(const [party,x,label] of [[d.expediteur,11,'Expéditeur'],[d.destinataire,109,'Destinataire']]) {
    block(label,`${party.raisonSociale||'-'}\n${party.adresse||'-'} / ${party.contact||'-'}\nRC ${party.registre||'-'} / Réf. ${party.reference||'-'}`,x,150,89,4,8);
  }
  section('3 - TRAJET',175);rect(11,179,188,24);
  const t=d.trajet;
  block('Chargement',`${t.chargement.ville||'-'} / ${t.chargement.lieu||'-'}\n${t.chargement.adresse||''}\n${date(t.dateDepart)} / ${t.heureDepart||'-'}`,15,184,65,3,7.5);
  block('Déchargement',`${t.dechargement.ville||'-'} / ${t.dechargement.lieu||'-'}\n${t.dechargement.adresse||''}\n${date(t.dateArrivee)} / ${t.heureArrivee||'-'}`,132,184,63,3,7.5);
  put(text(g.transportType).replaceAll('_',' '),105,188,6.5,true,N,{align:'center'});put(text(g.compte).replaceAll('_',' '),105,194,6.5,true,N,{align:'center'});
  section('4 - MARCHANDISES TRANSPORTÉES',210);
  const columns=[11,73,112,132,152,174], widths=[60,37,18,18,20,25];
  function cargoHead(y){rect(11,y,188,7,N);['DÉSIGNATION / NATURE','EMBALLAGE','COLIS','POIDS (T)','VOL. (M³)','VALEUR'].forEach((v,i)=>put(v,columns[i]+2,y+4.5,6,true,[255,255,255]));}
  function cargoRow(m,y){const vals=[m.designation?`${m.designation} / ${m.nature}`:m.nature,m.emballage,number(m.quantite),number(m.poidsTonnes),number(m.volumeM3),`${number(m.valeur)} ${m.devise||'FCFA'}`];const rows=vals.map((v,i)=>lines(v,widths[i]-4,7));const h=Math.max(...rows.map(r=>r.length))*3+3;rows.forEach((r,i)=>put(r,columns[i]+2,y+4,7,false,N,{lineHeightFactor:1.15}));doc.setDrawColor(...BORDER);doc.line(11,y+h,199,y+h);return h;}
  cargoHead(214);let cy=221;let overflow=[];
  for(const m of d.marchandises||[]){const size=Math.max(lines(m.designation?`${m.designation} / ${m.nature}`:m.nature,56,7).length,lines(m.emballage,33,7).length,lines(`${number(m.valeur)} ${m.devise||'FCFA'}`,21,7).length)*3+3;if(cy+size>242||overflow.length) overflow.push(m);else cy+=cargoRow(m,cy);}
  if(overflow.length) put(`${overflow.length} ligne(s) supplémentaire(s) : voir annexe marchandises.`,13,cy+4,6.5,true,G);
  const totals=computeMarchandiseTotals(d.marchandises);
  const values={};for(const m of d.marchandises||[])values[m.devise||'FCFA']=(values[m.devise||'FCFA']||0)+(Number(m.valeur)||0);
  const valuesText=Object.entries(values).map(([currency,value])=>number(value)+' '+currency).join(' / ');
  put(`TOTAL : ${number(totals.quantite)} colis | ${number(totals.poidsTonnes)} t | ${number(totals.volumeM3)} m³`,11,247,7,true);
  const valLines=lines('Valeur : '+valuesText,188,6.5);if(valLines.length>1)extras.push({label:'Valeur totale par devise',value:valuesText});put(valLines[0],11,251,6.5);
  put(`Dangereuse : ${d.dangereuse?'OUI':'NON'}  /  Température dirigée : ${d.temperatureControlee?'OUI':'NON'}`,11,254,6.5,true,G);
  section('5 - CONDITIONS FINANCIÈRES',260);
  const f=computeFacturationTotals(d.facturation);
  put(`Expéditeur HT : ${number(f.totalExpediteur)} FCFA`,11,266,7);
  put(`Destinataire HT : ${number(f.totalDestinataire)} FCFA`,11,271,7);
  put(`TVA : ${number(f.tva)} / Timbres : ${number(f.timbreTotal)} FCFA`,11,276,7);
  rect(117,264,82,12,N);put('TOTAL À PERCEVOIR',121,268,6.5,true,[255,255,255]);put(`${number(f.totalAPercevoir)} FCFA`,195,273,10,true,[255,255,255],{align:'right'});
  doc.addPage();header();status(50,true);
  section('6 - DÉTAIL DES POSTES FACTURÉS',79);
  rect(11,83,188,7);put('POSTE',14,87.5,7,true);put('EXPÉDITEUR (FCFA)',139,87.5,7,true,N,{align:'right'});put('DESTINATAIRE (FCFA)',196,87.5,7,true,N,{align:'right'});
  let fy=95;
  const items=[['Prix du transport','prixTransport'],['Frais accessoires','accessoires'],['Frais complémentaires','complementaires'],['Autres frais','autres']];
  for(const [label,key] of items){put(label,14,fy,8);put(number(d.facturation?.expediteur?.[key]),139,fy,8,false,N,{align:'right'});put(number(d.facturation?.destinataire?.[key]),196,fy,8,false,N,{align:'right'});doc.setDrawColor(...BORDER);doc.line(11,fy+2,199,fy+2);fy+=7;}
  for(const [label,a,b] of [['Sous-total HT',f.totalExpediteur,f.totalDestinataire],[`TVA (${f.expediteur.tvaRate}% / ${f.destinataire.tvaRate}%)`,f.expediteur.tvaMontant,f.destinataire.tvaMontant],['Timbre fiscal',f.expediteur.timbre,f.destinataire.timbre],['Total',f.expediteur.total,f.destinataire.total]]){put(label,14,fy,7,true);put(number(a),139,fy,7,true,N,{align:'right'});put(number(b),196,fy,7,true,N,{align:'right'});fy+=6;}
  section('7 - ANNEXES ET INSTRUCTIONS',150);
  block('Emballages / supports',a.emballages,11,156,88,2);block('Pièces jointes',[...(a.pieces||[]).map(p=>p.name),...payload.files.map(p=>p.name)].join(', '),109,156,89,2);
  block('Instructions / prestations',[a.instructions,a.accessoires,a.complementaires].filter(Boolean).join('\n'),11,169,188,3,7.5);
  section('8 - RÉSERVES',188);
  rect(11,192,91,18,[255,255,255]);rect(108,192,91,18,[255,255,255]);block('À la prise en charge',a.reservePriseEnCharge,14,197,85,2,7);block('À la livraison',a.reserveLivraison,111,197,85,2,7);
  section('9 - VISAS DE CONTRÔLE ROUTIER',216);
  for(let i=0;i<4;i++){const x=11+i*48;rect(x,220,44,21,[255,255,255]);put(`CONTRÔLE ${i+1}`,x+2,224,6.5,true);put('Date / lieu',x+2,229,6,false,G);put('Agent / matricule',x+2,233,6,false,G);put('Cachet et visa',x+2,239,6,false,G);}
  put('Chaque contrôle par QR est horodaté dans le journal local du POC.',11,245,6.5,false,G);
  section('10 - SIGNATURES',249);
  ['EXPÉDITEUR','TRANSPORTEUR / CONDUCTEUR','DESTINATAIRE'].forEach((v,i)=>{const x=11+i*64;rect(x,253,60,15,[255,255,255]);put(v,x+2,257,6.2,true);put('Nom, qualité, date et signature',x+2,262,6,false,G);});
  put(lines('MENTIONS : Ce document accompagne la marchandise du voyage désigné et doit être présenté au contrôle. Toute altération doit être signalée. Un DUT suspendu ou retiré ne peut pas être présenté comme valide, même si un ancien exemplaire papier reste en circulation. Le POC simule ce contrôle dans le registre local.',188,6),11,272,6,false,G,{lineHeightFactor:1.1});
  // Long values and cargo are carried to explicitly numbered annexes, never silently dropped.
  if(overflow.length){doc.addPage();header();section('ANNEXE - MARCHANDISES (SUITE DU RECTO)',49);cargoHead(54);let y=61;for(const m of overflow){const height=Math.max(lines(m.designation?`${m.designation} / ${m.nature}`:m.nature,56,7).length,lines(m.emballage,33,7).length,lines(`${number(m.valeur)} ${m.devise||'FCFA'}`,21,7).length)*3+3;if(height>205){extras.push({label:'Marchandise (détail intégral)',value:JSON.stringify(m)});continue;}if(y+height>273){doc.addPage();header();cargoHead(47);y=54;}y+=cargoRow(m,y);} }
  if(extras.length){doc.addPage();header();section('ANNEXE - MENTIONS COMPLÉMENTAIRES',49);let y=58;for(const item of extras){if(y>260){doc.addPage();header();y=49;}put(item.label,11,y,8,true);y+=5;for(const line of lines(item.value,186,8)){if(y>272){doc.addPage();header();y=49;}put(line,11,y,8);y+=4;}y+=5;}}
  const pages=doc.getNumberOfPages();
  for(let p=1;p<=pages;p++){doc.setPage(p);if(p>2)put(`${d.dutNumber||'BROUILLON'} | ${state.label}`,11,44,7,true,state.color);doc.setDrawColor(...N);doc.line(11,280,199,280);put(`SHA-256 : ${hash.slice(0,32)}`,11,284,6);put(hash.slice(32),11,287.5,6);put(`Impression ${payload.rank} - ${COPIES[payload.copy]}`,199,284,6,true,N,{align:'right'});put(`Page ${p} / ${pages} - ${date(payload.generatedAt)} ${new Date(payload.generatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`,199,287.5,6,false,G,{align:'right'});put('POC LOCAL - Les marques visuelles et cette empreinte ne valent pas signature officielle.',11,291,6,false,G);put((`${(['VALIDE','SUSPENDU','RETIRE'].includes(d.status)?d.dutNumber:null)||'BROUILLON'} / OFFICEIVOIRIENDESCHARGEURS / `).repeat(5),11,295,3,false,G);if(p>2&&state.watermark)put(state.watermark,105,150,30,true,[225,226,230],{align:'center',angle:30});}
  doc.setProperties({title:`DUT ${d.dutNumber||'Brouillon'} - ${COPIES[payload.copy]}`,subject:`POC local - ${state.label} - SHA-256 ${hash}`,author:'DUT-OIC - POC',creator:'DUT-OIC recto-verso v2'});
  return doc;
}
