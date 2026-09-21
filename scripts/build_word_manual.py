from pathlib import Path
import re, html
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];AS=ROOT/'docs/manual-assets';W,H=595.276,841.89;M=38;CW=W-2*M;BLUE='#165B9B';NAVY='#15375E';MUTED='#5C6E82';LIGHT='#EFF5FB';GREEN='#15877B';ORANGE='#C87A15';BORDER='#DAE4EF';pages=[]
def record(t,*v):pages[-1]['items'].append((t,*v));return 0
def start(k,t,l=''):
 pages.append({'title':t,'kicker':k,'lead':l,'items':[]});return 0
def para(t,*a,**kw):return record('p',t,kw.get('bold',False) or (len(a)>5 and a[5]))
def image(p,*a,**kw):return record('image',str(p))
def screen(n,*a,**kw):return record('screen',n)
def table(h,r,*a,**kw):return record('table',h,r)
def note(t,b,*a,**kw):return record('note',t,b)
def steps(items,*a,**kw):return record('steps',items)
def noop(*a,**kw):return None
rect=line=arrow=noop
class Canvas:
 def __getattr__(self,n):
  if n=='beginPath':return lambda:Canvas()
  return noop
c=Canvas();page=26
source=(ROOT/'scripts/build_user_manual.py').read_text().split('# 01\n',1)[1]
source=source.split('assert page==26',1)[0]
exec(source)
D=Document();sec=D.sections[0];sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.top_margin=Cm(1.4);sec.bottom_margin=Cm(1.4);sec.left_margin=Cm(1.4);sec.right_margin=Cm(1.4);sec.header_distance=Cm(.5);sec.footer_distance=Cm(.5)
for n in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3','Caption']:
 s=D.styles[n];s.font.name='Arial';s.font.color.rgb=RGBColor.from_string('15375E' if n=='Normal' else '000000');s.font.size=Pt(10.5 if n=='Normal' else 9)
 s.paragraph_format.space_after=Pt(7)
 s.paragraph_format.line_spacing=1.1
D.styles['Title'].font.size=Pt(30);D.styles['Title'].font.bold=True
D.styles['Heading 1'].font.size=Pt(23);D.styles['Heading 1'].font.bold=True;D.styles['Heading 1'].paragraph_format.space_after=Pt(10)
D.styles['Heading 2'].font.size=Pt(12);D.styles['Heading 2'].font.bold=True
D.styles['Caption'].font.size=Pt(8);D.styles['Caption'].font.color.rgb=RGBColor.from_string('5C6E82')
D.styles['Subtitle'].font.size=Pt(12)
header=sec.header.paragraphs[0];header.text='OIC  /  DOCUMENT UNIQUE DE TRANSPORT';header.runs[0].font.size=Pt(8)
f=sec.footer.paragraphs[0];f.text='Manuel illustré  •  Septembre 2026\t';f.paragraph_format.tab_stops.add_tab_stop(Cm(17));fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');f._p.append(fld)
D.core_properties.title='Manuel utilisation DUT OIC';D.core_properties.author='Projet DUT OIC';D.core_properties.subject='Guide débutant modifiable couvrant les six rôles'

def rich(p,text):
 # Preserve basic bold and line-break markup as editable Word runs.
 text=re.sub(r'<link[^>]*>', '', text).replace('</link>','')
 parts=re.split(r'(<b>|</b>|<br\s*/?>)',text);bold=False
 for s in parts:
  if s=='<b>':bold=True
  elif s=='</b>':bold=False
  elif s.startswith('<br'):p.add_run().add_break()
  elif s:
   r=p.add_run(html.unescape(re.sub('<[^>]+>','',s)));r.bold=bold
 return p

def p(text,style=None,parent=D):return rich(parent.add_paragraph(style=style),text)
def addpic(path,width=17.9,parent=D):
 pp=parent.add_paragraph();pp.alignment=WD_ALIGN_PARAGRAPH.CENTER;pp.paragraph_format.space_after=Pt(4)
 pic=pp.add_run().add_picture(str(path),width=Cm(width));pic._inline.docPr.set('descr',Path(path).stem.replace('-',' '));return pic

def tbl(headers,rows,widths=None,parent=D,size=10):
 t=parent.add_table(rows=1,cols=len(headers));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
 widths=widths or ([5,13.2] if len(headers)==2 else [3.4,8.1,6.7])
 for col,w in zip(t.columns,widths):col.width=Cm(w)
 for vals in [headers]+rows:
  row=t.rows[0] if vals is headers else t.add_row()
  for j,(cell,text) in enumerate(zip(row.cells,vals)):
   cell.width=Cm(widths[j]);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   pp=rich(cell.paragraphs[0],text);pp.paragraph_format.space_after=Pt(3);pp.paragraph_format.space_before=Pt(3);pp.paragraph_format.line_spacing=1.04
   for rr in pp.runs:rr.font.size=Pt(size);rr.font.bold=vals is headers;rr.font.color.rgb=RGBColor.from_string('FFFFFF' if vals is headers else '15375E')
   pr=cell._tc.get_or_add_tcPr();shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'165B9B' if vals is headers else ('EFF5FB' if len(t.rows)%2==0 else 'FFFFFF'));pr.append(shade)
   mar=OxmlElement('w:tcMar')
   for edge in ['top','left','bottom','right']:
    e=OxmlElement('w:'+edge);e.set(qn('w:w'),'90');e.set(qn('w:type'),'dxa');mar.append(e)
   pr.append(mar)
   borders=OxmlElement('w:tcBorders')
   for edge in ['top','left','bottom','right']:
    e=OxmlElement('w:'+edge);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'D9D9D9');borders.append(e)
   pr.append(borders)
  noSplit=OxmlElement('w:cantSplit');row._tr.get_or_add_trPr().append(noSplit)
 repeat=OxmlElement('w:tblHeader');t.rows[0]._tr.get_or_add_trPr().append(repeat)
 D.add_paragraph().paragraph_format.space_after=Pt(0)
 return t

for idx,section in enumerate(pages,1):
 if idx>1:D.add_page_break()
 if idx==1:
  addpic(ROOT/'assets/images/logo-oic.jpg',5.3)
  p('Manuel utilisation DUT OIC','Title')
  p('Guide illustré de prise en main de la plateforme','Subtitle')
  p('Ce manuel explique le Document Unique de Transport et le fonctionnement du POC. Il accompagne les personnes débutantes dans les six rôles, de la préparation du dossier au contrôle du document.')
  addpic(ROOT/'assets/images/dut-transport-illustration.png',18.1)
  p('Version du 21 septembre 2026  •  Environnement de démonstration')
  p('Textes, tableaux et schémas de fonctionnement modifiables dans Word. Les captures des écrans restent des images remplaçables.','Caption')
  continue
 title=section['title'].replace('—',' ').replace('’',' ').replace('?','').replace(',','').replace(' / ',' ').replace('  ',' ')
 p(title,'Heading 1')
 if section['lead']:p(section['lead'])
 if idx==2:
  p('Les sections sont accessibles depuis le volet Navigation de Word. Le sommaire ci-dessous reprend les rubriques du manuel.')
  tbl(['Rubrique','Section'],[[s['title'],str(i)] for i,s in enumerate(pages,1) if i>2],[15.5,2.7],size=9)
  continue
 if idx==3:
  items=section['items'];p(items[0][1]);tbl(['Qui','Quoi','Où et quand'],[['Expéditeur, destinataire, transporteur et conducteur.','Marchandise, quantité, poids et valeur déclarée.','Chargement, destination, dates et horaires prévus.']],[6.06]*3)
  for item in items[7:]:
   if item[0]=='note':p(item[1],'Heading 2');p(item[2])
   elif item[0]=='p':p(item[1])
  continue
 if idx==5:
  tbl(['État du dossier','Acteur et action'],[['1  EN ÉDITION','Le partenaire prépare le brouillon.'],['↓  Soumission','La saisie terminée est transmise à l’antenne.'],['2  TERMINÉ','L’antenne examine le dossier.'],['↳  REJETÉ','Motif → correction par le partenaire → nouvelle soumission.'],['↓  Validation','L’antenne accepte le dossier.'],['3  VALIDÉ','Un numéro et un QR sont créés.']],[5.5,12.7])
  p('Après validation, l’OIC peut suspendre le DUT, lever la suspension ou le retirer. Un retrait n’est pas une simple correction du brouillon.')
  p('Le suivi physique du transport','Heading 2');p('À préparer  →  Chargé  →  En route  →  Arrivé  →  Livré')
  for item in section['items']:
   if item[0]=='note':p(item[1],'Heading 2');p(item[2])
  continue
 if idx==15:
  t=D.add_table(rows=1,cols=2);t.autofit=False;t.columns[0].width=Cm(12);t.columns[1].width=Cm(6.2)
  pic=addpic(AS/'planning.png',11.8,t.cell(0,0))
  # Non-destructive Word crop of original screenshot.
  crop=OxmlElement('a:srcRect')
  for k,v in {'l':372/1265,'t':711/2501,'r':(1265-1211)/1265,'b':(2501-1825)/2501}.items():crop.set(k,str(round(v*100000)))
  blip=pic._inline.xpath('.//pic:blipFill')[0];blip.insert(1,crop)
  pic.height=Cm(11.8*1114/839)
  # Ensure the drawing transform uses the displayed dimensions too.
  ext=pic._inline.xpath('.//a:xfrm/a:ext')[0];ext.set('cy',str(pic.height))
  for it in section['items'][:-1]:
   if it[0]=='p':p(it[1],parent=t.cell(0,1))
  p(section['items'][-1][1]);continue
 if idx==19:
  t=D.add_table(rows=1,cols=2);t.autofit=False
  for j in range(2):addpic(AS/f'dut-exemple-{j+1}.png',8.8,t.cell(0,j));p('RECTO' if j==0 else 'VERSO','Caption',t.cell(0,j))
 if idx==24:
  tbl(['Vous','Ce navigateur','Votre écran'],[['Vous saisissez et enregistrez une action.','DUT, planning, fichiers et historique locaux.','Les données sont relues au rechargement.']],[6.06]*3)
 for item in section['items']:
  kind=item[0]
  if idx==19 and kind in ['image','p'] and (kind=='image' or item[1] in ['RECTO','VERSO']):continue
  if idx==24 and kind=='p' and item[1] in ['VOUS','Vous saisissez et<br/>enregistrez une action.','CE NAVIGATEUR','DUT, planning, fichiers<br/>et historique locaux.','VOTRE ÉCRAN','Les données sont relues<br/>au rechargement.']:continue
  if kind=='p':p(item[1],'Heading 2' if item[2] else None)
  elif kind=='note':p(item[1],'Heading 2');p(item[2])
  elif kind=='steps':
   for n,(title,body) in enumerate(item[1],1):p(f'{n}  {title}','Heading 2');p(body)
  elif kind=='table':tbl(item[1],item[2])
  elif kind=='screen':
   addpic(AS/(item[1]+'.png'),17.6);p('Capture de la plateforme locale • données de démonstration','Caption')
  elif kind=='image':addpic(item[1],9)
# Source hyperlink remains readable and editable.
p('Source OIC  https://www.oic.ci/source/fr/includes/dut/fr/index.php', 'Caption')
# French spelling language and editable ordinary document.
for style in [D.styles['Normal'],D.styles['Title'],D.styles['Heading 1']]:
 lang=OxmlElement('w:lang');lang.set(qn('w:val'),'fr-FR');style.element.get_or_add_rPr().append(lang)
OUT=ROOT/'output/docx/Manuel_DUT_OIC_modifiable.docx';OUT.parent.mkdir(exist_ok=True,parents=True);D.save(OUT);print(OUT)
