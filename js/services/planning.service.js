import { getCurrentUser } from '../core/auth.js';
import { visibleDuts } from './insights.service.js';
import { dossier, saveSchedule } from './workspace.service.js';
export { saveSchedule };
export function interval(dut, record) {
  const start = record.schedule?.start || (dut.trajet?.dateDepart ? `${dut.trajet.dateDepart}T${dut.trajet.heureDepart || '00:00'}` : '');
  const end = record.schedule?.end || (dut.trajet?.dateArrivee ? `${dut.trajet.dateArrivee}T${dut.trajet.heureArrivee || '23:59'}` : '');
  return { start, end, valid: Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start) };
}
export function planningRows() {
  return visibleDuts(getCurrentUser()).map(dut => {
    const record = dossier(dut.id);
    return { dut, record, ...interval(dut, record) };
  });
}
export function overlaps(a, b) {
  return a.valid && b.valid && a.dut.id !== b.dut.id && a.dut.general?.immatriculation?.trim() && a.dut.general.immatriculation.trim().toUpperCase() === b.dut.general?.immatriculation?.trim().toUpperCase() && !['RETIRE','REJETE'].includes(a.dut.status) && !['RETIRE','REJETE'].includes(b.dut.status) && Date.parse(a.start) < Date.parse(b.end) && Date.parse(b.start) < Date.parse(a.end);
}

// Fictional planning scenarios remain separate from DUTs and official number stock.
import { readObject, writeObject } from '../core/storage.js';
const DEMO_KEY = 'dut_planning_demo_v1';
export function addPlanningExamples(now = new Date()) {
  const user = getCurrentUser();
  if (!['OIC_ADMIN','PARTNER_ADMIN'].includes(user?.role)) throw new Error('Les exemples sont ajoutés par un administrateur OIC ou partenaire.');
  const sources = visibleDuts(user).filter(d=>d.general?.immatriculation && !d.planningDemo);
  if (!sources.length) throw new Error('Un dossier avec camion est nécessaire pour rattacher les exemples au bon périmètre.');
  const current = readObject(DEMO_KEY, []);
  const key = user.role === 'OIC_ADMIN' ? 'national' : user.partnerId;
  if (current.some(r=>r.batch===key)) return 0;
  const scenarios = [
    [-3,-1,'DELIVERED','Abidjan','Bouaké'],[-2,1,'DEPARTED','San-Pédro','Korhogo'],[-1,2,'DEPARTED','Bouaké','Ferkessédougou'],[0,3,'LOADED','Abidjan','Ouangolodougou'],[1,4,'PLANNED','San-Pédro','Man'],[2,5,'PLANNED','Abidjan','Yamoussoukro'],[3,6,'PLANNED','Bouaké','Daloa'],[4,8,'PLANNED','Abidjan','Korhogo'],[6,9,'PLANNED','San-Pédro','Bouaké'],[8,11,'PLANNED','Yamoussoukro','Abidjan']
  ];
  const local = (offset,hour) => { const d=new Date(now);d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${hour}:00`; };
  const items = scenarios.map(([a,b,stage,origin,destination],i)=>({id:`planning-demo-${key}-${i+1}`,batch:key,sourceId:sources[i%sources.length].id,label:`DÉMO · T${String(i+1).padStart(2,'0')}`,origin,destination,stage,start:local(a,'08'),end:local(b,'17'),createdAt:now.toISOString()}));
  writeObject(DEMO_KEY,[...current,...items]);return items.length;
}
export function demoRows() {
  const visible = new Map(visibleDuts(getCurrentUser()).map(d=>[d.id,d]));
  return readObject(DEMO_KEY,[]).filter(r=>visible.has(r.sourceId)).map(r=>{
    const source=visible.get(r.sourceId);
    const dut={...source,id:r.id,dutNumber:r.label,status:'VALIDE',planningDemo:true,trajet:{...source.trajet,chargement:{...source.trajet.chargement,ville:r.origin},dechargement:{...source.trajet.dechargement,ville:r.destination}}};
    return {dut,record:{stage:r.stage,schedule:{start:r.start,end:r.end}},start:r.start,end:r.end,valid:true};
  });
}
export function savePlanningSchedule(id, values) {
  if (!id.startsWith('planning-demo-')) return saveSchedule(id,values);
  if (!demoRows().some(r=>r.dut.id===id)) throw new Error('Voyage hors de votre périmètre.');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(values.start||'') || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(values.end||'') || !Number.isFinite(Date.parse(values.start)) || !(Date.parse(values.end)>Date.parse(values.start))) throw new Error('L’arrivée doit être postérieure au départ.');
  const list=readObject(DEMO_KEY,[]);const item=list.find(r=>r.id===id);Object.assign(item,values,{updatedAt:new Date().toISOString(),updatedBy:getCurrentUser().name});writeObject(DEMO_KEY,list);
}
