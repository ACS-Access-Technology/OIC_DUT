from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]; AS=ROOT/'docs/manual-assets'; OUT=ROOT/'output/pdf/manuel-utilisation-dut-oic.pdf'
for n in ['Regular','Bold']: pdfmetrics.registerFont(TTFont('Instrument'+n,str(AS/f'fonts/InstrumentSans-{n}.ttf')))
pdfmetrics.registerFontFamily('InstrumentRegular',normal='InstrumentRegular',bold='InstrumentBold',italic='InstrumentRegular',boldItalic='InstrumentBold')
W,H=A4; M=38; CW=W-2*M
BLUE='#165B9B'; NAVY='#15375E'; MUTED='#5C6E82'; LIGHT='#EFF5FB'; GREEN='#15877B'; ORANGE='#C87A15'; BORDER='#DAE4EF'
c=canvas.Canvas(str(OUT),pagesize=A4);c.setTitle('DUT-OIC | Manuel illustré de prise en main');c.setAuthor('Projet DUT-OIC');c.setSubject('Guide débutant du POC, tous les rôles, planning et DUT recto verso')
page=0

def para(text,x,y,w=CW,size=11.5,color=NAVY,bold=False,leading=None):
 style=ParagraphStyle('p',fontName='InstrumentBold' if bold else 'InstrumentRegular',fontSize=size,leading=leading or size*1.4,textColor=HexColor(color),spaceAfter=0)
 p=Paragraph(text,style);_,h=p.wrap(w,1000)
 assert y+h< (H-8 if y>H-35 else H-38), f'Text overflow page {page}: {text[:65]} at {y+h}'
 p.drawOn(c,x,H-y-h);return y+h

def rect(x,y,w,h,fill=LIGHT,stroke=None,r=10):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))

def line(x1,y1,x2,y2,color=BORDER,width=1):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x1,H-y1,x2,H-y2)

def arrow(x1,y1,x2,y2,color=BLUE):
 line(x1,y1,x2,y2,color,1.5)
 import math
 a=math.atan2(y2-y1,x2-x1)
 for d in [-.55,.55]:line(x2,y2,x2-7*math.cos(a+d),y2-7*math.sin(a+d),color,1.5)

def image(path,x,y,w,h=None):
 im=Image.open(path);iw,ih=im.size
 if h is None:h=w*ih/iw
 c.drawImage(str(path),x,H-y-h,width=w,height=h,mask='auto');return y+h

def screen(name,y=160,hmax=300):
 path=AS/(name+'.png');im=Image.open(path);w=CW;h=w*im.height/im.width
 if h>hmax:w*=hmax/h;h=hmax
 rect(M-1,y-1,CW+2,h+2,'#FFFFFF',BORDER,5);image(path,M+(CW-w)/2,y,w,h)
 return para('Capture de la plateforme locale • données de démonstration',M,y+h+7,size=8,color=MUTED)+18

def note(title,text,y,color=BLUE):
 st=ParagraphStyle('n',fontName='InstrumentRegular',fontSize=10.5,leading=14.5)
 pp=Paragraph(text,st);_,hh=pp.wrap(CW-30,1000)
 rect(M,y,CW,hh+48,LIGHT);para(title,M+15,y+11,CW-30,11,color,True);para(text,M+15,y+33,CW-30,10.5);return y+hh+60

def steps(items,y):
 for i,(title,text) in enumerate(items,1):
  rect(M,y+1,24,24,BLUE,r=7);para(str(i),M+8,y+3,18,11,'#FFFFFF',True)
  yy=para(title,M+35,y,CW-35,12,BLUE,True)
  y=para(text,M+35,yy+4,CW-35,11)+15
 return y

def start(kicker,title,lead=''):
 global page
 if page:c.showPage()
 page+=1;c.bookmarkPage(f'p{page}');c.addOutlineEntry(title,f'p{page}',0)
 c.setFillColor(HexColor('#FFFFFF'));c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(HexColor(BLUE));c.rect(0,H-6,W,6,fill=1,stroke=0)
 para('OIC / DOCUMENT UNIQUE DE TRANSPORT',M,23,390,8,BLUE,True)
 para('GUIDE DU POC',W-135,23,100,8,MUTED)
 line(M,H-35,W-M,H-35)
 para('Manuel illustré • 21 septembre 2026',M,H-29,380,8,MUTED)
 para(f'{page:02d}',W-M-22,H-29,22,8,BLUE,True)
 para(kicker.upper(),M,65,CW,9,GREEN,True)
 yy=para(title,M,85,CW,25,NAVY,True,29)
 if lead:yy=para(lead,M,yy+12,CW,11.5,MUTED)
 return yy+20

def table(headers,rows,y,widths=None,size=10.5):
 widths=widths or [CW/len(headers)]*len(headers)
 allrows=[headers]+rows
 for ri,row in enumerate(allrows):
  ps=[];hs=[]
  for text,w in zip(row,widths):
   p=Paragraph(text,ParagraphStyle('t',fontName='InstrumentBold' if ri==0 else 'InstrumentRegular',fontSize=size,leading=size*1.4,textColor=white if ri==0 else HexColor(NAVY)));_,h=p.wrap(w-18,1000);ps.append(p);hs.append(h)
  rh=max(hs)+20
  assert y+rh<H-45,f'Table overflow {page}'
  rect(M,y,CW,rh,BLUE if ri==0 else (LIGHT if ri%2 else '#FFFFFF'),r=0)
  x=M
  for p,w,h in zip(ps,widths,hs):p.drawOn(c,x+9,H-y-10-h);x+=w
  y+=rh
 return y+16

# 01
start('Bienvenue','Le DUT, simplement.','')
image(ROOT/'assets/images/logo-oic.jpg',M,151,120,66)
para('Manuel d’utilisation<br/>de la plateforme DUT-OIC',M,245,CW,29,NAVY,True,35)
para('Comprendre • préparer • suivre • contrôler',M,333,CW,15,BLUE,True)
image(ROOT/'assets/images/dut-transport-illustration.png',0,390,W,W*2/3)
rect(M,691,CW,79,'#FFFFFF',BORDER)
para('POUR DÉBUTER, AUCUNE CONNAISSANCE PRÉALABLE',M+15,705,CW-30,9,GREEN,True)
para('Six rôles expliqués, captures réelles, schémas et exercice guidé.<br/>Version du POC : 21 septembre 2026. Usage de démonstration.',M+15,724,CW-30,11)

# 02
y=start('Votre parcours de lecture','Commencez ici','Ce guide explique la version effectivement disponible. Les chiffres et les noms visibles dans les captures sont des exemples.')
chapters=[('Comprendre le DUT et les acteurs','3 à 5',3),('Se connecter et choisir son rôle','6',6),('Partenaire admin et partenaire éditeur','7 à 9',7),('Agent d’antenne, Admin OIC et transporteur','10 à 12',10),('Contrôle du document et du QR','13 à 14',13),('Planning et suivi du voyage','15 à 18',15),('PDF, numéros et ressources','19 à 21',19),('Priorités, exercice et données locales','22 à 24',22),('Aide, vocabulaire et références','25 à 26',25)]
for label,pg,target in chapters:
 rect(M,y,CW,46,LIGHT);para(label,M+14,y+12,405,11.5,NAVY,True);para(pg,W-M-70,y+12,60,11,BLUE,True);c.linkRect('',f'p{target}',(M,H-y-46,W-M,H-y),relative=0,thickness=0);y+=54
y=note('Trois repères tout au long du guide','<b>À faire</b> : les gestes dans l’écran. <b>Résultat</b> : ce que vous devez constater. <b>POC</b> : une simulation destinée à tester le fonctionnement, avant un système de production.',y+4)

# 03
y=start('01 / Comprendre','Qu’est-ce qu’un DUT ?','DUT signifie Document Unique de Transport. OIC signifie Office Ivoirien des Chargeurs.')
y=para('Le DUT décrit une opération de transport routier de marchandises. Il relie les personnes concernées, le camion, le chargement et le trajet. Selon la présentation de l’OIC, il matérialise le contrat de transport et remplace notamment la lettre de voiture et la feuille de route [1].',M,y)+24
for i,(t,b) in enumerate([('QUI ?','Expéditeur, destinataire,<br/>transporteur et conducteur.'),('QUOI ?','Marchandise, quantité,<br/>poids et valeur déclarée.'),('OÙ ET QUAND ?','Chargement, destination,<br/>dates et horaires prévus.')]):
 x=M+i*(CW/3+1);rect(x,y,CW/3-8,113,LIGHT);para(t,x+12,y+15,CW/3-32,11,BLUE,True);para(b,x+12,y+42,CW/3-32,10.5)
y+=137
y=note('Un exemple concret','Une entreprise fait partir des sacs de cacao d’Abidjan vers Bouaké. Le DUT rassemble les informations du voyage : qui envoie, qui reçoit, qui transporte, quel camion et quel chargement.',y)
y=para('<b>Le document et la plateforme :</b> le DUT est le document. La plateforme est l’outil qui permet de le préparer, d’en suivre l’état, de l’imprimer et de le vérifier.',M,y)+20
y=note('Dans ce guide','Nous décrivons un prototype local. Ses documents servent à la démonstration. Les conditions réglementaires, les exemptions et l’usage officiel sont à vérifier auprès de l’OIC [1].',y)

# 04
y=start('01 / Comprendre','Qui intervient ?','Une même opération est consultée par plusieurs acteurs. Chacun dispose d’un espace adapté à sa mission.')
y=table(['Rôle dans la plateforme','Mission et périmètre'],[
('Partenaire — Admin','Prépare et soumet les DUT de son partenaire. Suit les plages de numéros et accède au menu Référentiels.'),('Partenaire — Éditeur','Saisit, corrige et soumet les dossiers du partenaire. Il retrouve ses brouillons et les dossiers à corriger.'),('Agent Antenne','Examine les dossiers de son antenne. Valide ou rejette les dossiers soumis, dans le circuit proposé par ce POC.'),('Admin OIC','Consulte la vision nationale. Traite les demandes de plages et peut suspendre, réactiver ou retirer un DUT.'),('Transporteur','Consulte les DUT rattachés à son entreprise de transport et contribue au suivi de ses transports.'),('Agent Contrôle','Scanne ou saisit le QR et compare le résultat au document et au véhicule présentés.')],y,[155,CW-155],11)
y=note('Ne pas confondre acteur métier et compte utilisateur','L’expéditeur remet la marchandise et le destinataire la reçoit. Ils figurent dans le DUT, mais n’ont pas de portail de connexion distinct dans ce POC.',y)

# 05
y=start('01 / Comprendre','Le parcours d’un dossier','Deux suivis coexistent : l’état du document et l’avancement physique du transport.')
# Two-column workflow, with explicit correction branch
nodes=[('1. EN ÉDITION','Le partenaire prépare le brouillon.'),('2. TERMINÉ','La saisie est soumise à l’antenne.'),('3. VALIDÉ','L’antenne accepte ; numéro et QR sont créés.')]
for i,(t,b) in enumerate(nodes):
 yy=y+i*105;rect(M,yy,315,78,LIGHT);para(t,M+14,yy+12,285,12,BLUE,True);para(b,M+14,yy+35,285,10.5)
 if i<2:arrow(M+157,yy+80,M+157,yy+103)
rect(M+340,y+105,CW-340,110,'#FFF4E5');para('REJETÉ',M+353,y+118,CW-366,11,ORANGE,True);para('Motif → correction par le partenaire → nouvelle soumission.',M+353,y+145,CW-366,10.5)
arrow(M+315,y+143,M+337,y+143,ORANGE)
y+=327
y=para('<b>Après validation :</b> l’OIC peut suspendre le DUT, lever sa suspension ou le retirer. Un retrait n’est pas une simple correction du brouillon.',M,y)+21
labels=['À préparer','Chargé','En route','Arrivé','Livré'];bw=(CW-32)/5
for i,l in enumerate(labels):
 x=M+i*(bw+8);rect(x,y,bw,46,GREEN);para(l,x+5,y+14,bw-10,10,'#FFFFFF',True)
 if i<4:arrow(x+bw,y+23,x+bw+8,y+23,GREEN)
y+=66
y=note('Attention au mot « Terminé »','Il signifie que la saisie du DUT est terminée et soumise. Il ne signifie pas que la livraison est terminée. La validation systématique par antenne est le circuit proposé dans ce POC, pas une affirmation sur toutes les procédures réelles de l’OIC.',y)

# 06
y=start('02 / Premiers pas','Se connecter','Ouvrez l’adresse locale fournie par l’équipe. Sur cet ordinateur : http://127.0.0.1:8080.')
y=screen('connexion',y,225)
y=para('Ouvrez <b>Choisir un compte de démonstration</b>, sélectionnez un rôle, puis cliquez sur <b>Se connecter</b>. Vous pouvez aussi saisir les identifiants ci-dessous.',M,y,size=11)+14
y=table(['Rôle','Adresse de démonstration'],[(a,b) for a,b in [('Partenaire admin','partner.admin@demo.oic.ci'),('Partenaire éditeur','partner.editor@demo.oic.ci'),('Agent Antenne','antenne.agent@demo.oic.ci'),('Admin OIC','oic.admin@demo.oic.ci'),('Agent Contrôle','controle.agent@demo.oic.ci'),('Transporteur','transporteur@demo.oic.ci')]],y,[160,CW-160],9.8)
para('<b>Mot de passe de démonstration : demo123.</b> Pour changer de rôle, utilisez Se déconnecter puis reconnectez-vous. Un seul rôle est actif à la fois dans ce navigateur.',M,y,size=10.5)

# 07
y=start('03 / Rôle 1','Partenaire — Admin','Votre point de départ pour préparer les documents et suivre les ressources de votre structure.')
y=screen('partenaire',y,265)
y=steps([('Consulter les dossiers','Ouvrez <b>Mes DUT</b> ou utilisez la recherche. Une ligne de dossier permet d’accéder au détail et à ses onglets.'),('Créer ou reprendre une saisie','Cliquez sur <b>Nouveau DUT</b>. Pour votre brouillon existant, ouvrez le dossier puis <b>Continuer l’édition</b>. Pour un rejet, utilisez <b>Corriger</b>.'),('Préparer les ressources','Dans <b>Opérations &amp; plages</b>, vérifiez le nombre de numéros disponibles. Dans <b>Référentiels</b>, retrouvez les transporteurs, véhicules, conducteurs et tiers.')],y)
note('Le mot « Admin » a ici un sens limité','Le partenaire admin ne dispose pas d’un écran pour créer des utilisateurs ou modifier leurs rôles. L’administration des comptes n’est pas encore développée.',y)

# 08
y=start('03 / Rôle 2','Partenaire — Éditeur','Votre mission : renseigner un dossier complet et cohérent, puis le soumettre.')
y=screen('creation',y,265)
y=steps([('Préparer les informations','Réunissez les éléments d’identification du transporteur, du camion et du conducteur, les coordonnées des parties et les caractéristiques du chargement.'),('Avancer dans les étapes','Renseignez les champs portant une étoile. Utilisez <b>Continuer</b> pour enregistrer l’étape et passer à la suivante ; <b>Sauvegarder brouillon</b> conserve une saisie à reprendre.'),('Relire avant de soumettre','Au <b>Récapitulatif</b>, corrigez les informations manquantes signalées puis soumettez le DUT. Le dossier passe à l’état <b>Terminé</b>, en attente d’examen.')],y)
para('En cas de rejet : lisez le motif dans le dossier, cliquez sur <b>Corriger</b>, corrigez les champs concernés puis soumettez de nouveau.',M,y,size=10.5)

# 09
y=start('03 / Saisie pas à pas','Les sept étapes de création','Exemple pédagogique : des sacs de cacao partent d’un entrepôt d’Abidjan pour un dépôt à Bouaké. Les valeurs doivent correspondre au transport que vous préparez.')
y=table(['Écran','Ce qu’il faut renseigner ou vérifier'],[
('1. Général','Date d’émission, lieu, type de compte et de transport. Choisissez le transporteur, le camion et le conducteur. Vérifiez l’immatriculation et le permis.'),('2. Parties','Expéditeur : celui qui remet la marchandise. Destinataire : celui qui la reçoit. Complétez noms, adresses et contacts.'),('3. Marchandise','Une ligne par marchandise : désignation, nature, emballage, quantité, poids, volume, valeur et devise. Le poids est en tonnes, le volume en m³.'),('4. Facturation','Renseignez les montants imputés à l’expéditeur et au destinataire. Vérifiez prix, frais, TVA et timbre. Le POC calcule les totaux ; il n’encaisse aucun paiement.'),('5. Trajet','Renseignez les lieux de chargement et de déchargement, villes, références, dates et horaires. L’arrivée prévue doit rester cohérente avec le départ.'),('6. Annexes','Instructions, prestations complémentaires, réserves et pièces. Les fichiers ajoutés au POC sont conservés dans le navigateur.'),('7. Récapitulatif','Relisez toutes les rubriques et les totaux. Corrigez les erreurs indiquées avant de soumettre.')],y,[108,CW-108],10.7)
note('La bonne unité évite une mauvaise déclaration','Exemple : 12 000 kg correspondent à 12 tonnes. Ne saisissez pas 12 000 dans un champ « poids en tonnes ». Les montants de la capture ne sont pas un barème à recopier.',y)

# 10
y=start('04 / Rôle 3','Agent d’antenne','Vous examinez les documents rattachés à votre antenne avant leur validation dans le POC.')
y=screen('validation',y,260)
y=steps([('Ouvrir le dossier à examiner','Depuis le tableau de bord, repérez <b>DUT en attente de validation</b> puis cliquez sur une ligne. Le centre d’actions permet aussi de retrouver les dossiers en attente.'),('Vérifier le contenu','Comparez transporteur, véhicule, conducteur, parties, marchandise, trajet et pièces disponibles. Consultez la Checklist sans la confondre avec une validation automatique.'),('Prendre une décision','Cliquez sur <b>Valider</b> si le dossier est conforme pour la démonstration, puis confirmez. Sinon, cliquez sur <b>Rejeter</b> et renseignez un motif précis pour permettre la correction.')],y)
note('Résultat attendu','Après validation, le dossier porte un numéro et un QR. L’attribution dépend d’une plage de numéros disponible pour le partenaire. En cas de stock indisponible, faites traiter une demande de plage par l’OIC.',y)

# 11
y=start('04 / Rôle 4','Admin OIC','Vous disposez d’une vision nationale des documents et des contrôles enregistrés dans ce navigateur.')
y=screen('oic',y,260)
y=steps([('Comprendre la situation','Consultez les indicateurs, les graphiques, les priorités et les principaux corridors. Un corridor est ici un couple origine-destination.'),('Traiter les demandes','Ouvrez <b>Demandes de plages</b>. Sur une demande en attente, attribuez une plage ou refusez-la avec un motif.'),('Agir sur un DUT','Ouvrez le dossier concerné. Un DUT validé peut être suspendu ou retiré ; un DUT suspendu peut être réactivé via <b>Lever la suspension</b>. Lisez la confirmation et renseignez le motif demandé.')],y)
note('Administration métier, pas encore administration des comptes','La gestion des utilisateurs, la réinitialisation individuelle des mots de passe et le paramétrage central ne disposent pas encore d’un écran. Les six rôles sont préconfigurés.',y)

# 12
y=start('04 / Rôle 5','Transporteur','Votre espace regroupe les DUT associés à votre entreprise de transport et les informations de votre parc.')
y=screen('transporteur',y,265)
y=steps([('Retrouver un transport','Depuis le tableau de bord, ouvrez le DUT recherché. Vérifiez le camion, le trajet et l’état du document avant de poursuivre.'),('Prévoir et déclarer le voyage','Dans <b>Planning des trajets</b>, consultez ou ajustez les dates. Dans l’onglet <b>Transport</b> du dossier, déclarez successivement les étapes réellement constatées.'),('Conserver les informations utiles','Signalez une panne ou un retard dans <b>Incidents &amp; réserves</b>. Ajoutez une preuve dans <b>Documents &amp; preuves</b>. Consultez ou téléchargez le DUT avec les boutons prévus.')],y)
note('Votre périmètre','Le transporteur ne crée ni ne valide les DUT dans ce POC. Il contribue au suivi de ses dossiers. Un DUT valide est nécessaire pour faire progresser les étapes de transport.',y)

# 13
y=start('04 / Rôle 6','Agent Contrôle','Le QR est le petit carré imprimé sur le document. Sa lecture permet de retrouver le dossier associé dans le registre local du POC.')
y=screen('controle',y,245)
y=steps([('Lire le QR','Cliquez sur <b>Scanner un DUT</b> et autorisez la caméra si vous souhaitez l’utiliser. Cadrez le QR du document.'),('Utiliser le repli manuel','Si la caméra n’est pas disponible, collez le contenu du QR dans <b>Token du QR</b>, puis cliquez sur <b>Vérifier</b>. Le numéro du DUT ne remplace pas ce token.'),('Comparer les informations','Lisez le résultat, puis comparez l’immatriculation, le conducteur, le trajet et la marchandise au document et au véhicule réellement présentés.')],y)
note('Pour apprendre sans caméra','Les boutons <b>Simuler scan DUT valide</b> et <b>Simuler scan DUT faux</b> illustrent les résultats. « Faux » simule un QR inconnu du registre local ; ce seul résultat ne prouve pas une falsification.',y)

# 14
y=start('04 / Contrôle','Comprendre le résultat','Le résultat dépend du statut actuellement enregistré dans ce navigateur, et non de la couleur d’un ancien PDF.')
y=screen('resultat-controle',y,245)
y=table(['Résultat','Comment le comprendre'],[('Reconnu et valide','Le jeton correspond à un DUT actuellement valide dans le POC. Comparez aussi les champs du document et du véhicule.'),('Suspendu','Le dossier est reconnu mais sa validité est suspendue. Faites traiter la situation par l’OIC.'),('Retiré','Le document n’est plus valide dans le registre local.'),('QR non reconnu','Le dossier n’a pas été retrouvé ici. Vérifiez le contenu saisi et le contexte de démonstration ; sollicitez l’équipe concernée.')],y,[132,CW-132],10)
note('Vérifier une impression','Saisissez son rang et son empreinte de 64 caractères, puis <b>Comparer l’empreinte</b>. Le contrôle compare la référence à l’impression enregistrée localement ; il ne lit pas automatiquement le fichier PDF ni les altérations du papier.',y)

# 15
y=start('05 / Planning','Lire le planning des camions','Une ligne correspond à un voyage. Plusieurs lignes peuvent donc concerner le même camion.')
# True screenshot crop performed by PDF clipping, without altering screenshot pixels.
path=AS/'planning.png'; iw,ih=Image.open(path).size
# Region measured on the original full-page screenshot.
sx,sy,sw,sh=372,711,839,1114
scale=390/sw;dh=sh*scale
c.saveState();p=c.beginPath();p.rect(M,H-y-dh,390,dh);c.clipPath(p,stroke=0);c.drawImage(str(path),M-sx*scale,H-y+sy*scale-ih*scale,width=iw*scale,height=ih*scale);c.restoreState()
xx=M+405
for title,txt in [('La barre','Début à gauche, arrivée à droite. Sa longueur représente la durée prévue.'),('Le repère rose','« Aujourd’hui » permet de situer le voyage dans le calendrier.'),('La couleur','Bleu : prévu.<br/>Vert : en route ou arrivé.<br/>Gris : livré.<br/>Orange : blocage.'),('Le chevauchement','Deux prévisions mobilisent le même camion au même moment.'),('DÉMO','Dix voyages fictifs rendent les exemples visibles. Ce ne sont pas des DUT émis.')]:
 yy=para(title,xx,y,CW-405,10,BLUE,True);y=para(txt,xx,yy+6,CW-405,9.5)+19
y=max(y,167+dh)+17
para('Les jours et heures sont ceux du navigateur. Si les heures du DUT sont absentes, la prévision initiale couvre la journée. Une barre n’est ni une position GPS, ni une preuve du trajet réellement effectué.',M,y,CW,10.5)

# 16
y=start('05 / Planning','Ajuster le voyage prévu','Menu Pilotage → Planning des trajets. Les ajustements du planning sont conservés localement.')
y=screen('planning-edition',y,255)
y=steps([('Choisir la période','Sélectionnez 7, 14 ou 30 jours et une date de début. Les flèches changent de période. <b>Aujourd’hui</b> inclut les trois jours précédents ; <b>Derniers trajets</b> retrouve les prévisions les plus récentes.'),('Retrouver et modifier un voyage','Recherchez un camion, un DUT, un transporteur ou une ville, puis validez la recherche avec Entrée ou quittez le champ. Cliquez sur une barre ou un dossier dans la liste inférieure.'),('Enregistrer les horaires','Renseignez départ et arrivée, puis <b>Enregistrer le planning</b>. L’arrivée doit être postérieure au départ. Rechargez la page pour retrouver vos dates.')],y)
note('Prévision et document émis restent distincts','Changer le planning opérationnel ne réécrit pas le DUT émis. Les voyages DÉMO sont stockés à part, sans consommer de numéro. Les chevauchements sont des alertes dans votre périmètre visible, pas un blocage automatique.',y)

# 17
y=start('05 / Suivi','Déclarer le transport réalisé','Dans le dossier, ouvrez l’onglet Transport. Le suivi progresse une étape à la fois.')
y=screen('transport',y,265)
y=steps([('Lire l’étape actuelle','Les étapes sont : <b>À préparer → Chargé → En route → Arrivé → Livré</b>. « Arrivé » signifie que le camion est arrivé ; « Livré » signifie que la remise de la marchandise a été confirmée.'),('Confirmer la prochaine étape','Ajoutez une observation utile, puis cliquez sur le bouton <b>Confirmer : …</b>. Déclarez uniquement l’événement constaté. Le POC ne propose pas de retour en arrière dans ce suivi.'),('Consulter la trace laissée','L’historique opérationnel conserve l’auteur, l’heure et la note. Une étape de transport n’efface pas un incident ni une suspension administrative du document.')],y)
note('Le suivi est déclaratif','Aucune position GPS n’est collectée. Le passage à l’étape suivante est autorisé uniquement lorsque le DUT est valide. Le planning et les déclarations doivent être lus ensemble.',y)

# 18
y=start('05 / Dossier partagé','Incidents, preuves et checklist','Ces onglets complètent le document et facilitent le passage d’information entre les acteurs.')
y=screen('incidents',y,245)
y=table(['Onglet','Mode d’emploi'],[('Incidents &amp; réserves','Choisissez le type et la priorité, indiquez un responsable et décrivez les faits. Cliquez sur Enregistrer l’incident. À la résolution, utilisez Résoudre l’incident et expliquez la solution.'),('Documents &amp; preuves','Choisissez la catégorie et le fichier, puis enregistrez. Formats : PDF, JPEG ou PNG. Limite : 300 Ko par fichier et 1,5 Mo pour l’ensemble des fichiers du POC.'),('Checklist','Vérifiez les éléments d’identification et du chargement. Cochez uniquement ce qui a été vérifié. La checklist ne prouve pas à elle seule l’authenticité d’une pièce.'),('Journal d’audit','Consultez les événements administratifs et les impressions. L’historique du transport et des incidents se trouve aussi dans l’onglet Transport.')],y,[120,CW-120],10.2)
para('<b>Exemple de fait utile :</b> « Arrêt à Bouaké à 14 h pour une panne de pneu ; responsable : exploitation ; reprise prévue à 16 h. » Cette information doit être déclarée, elle n’est pas calculée automatiquement.',M,y,size=10.5)

# 19
y=start('06 / Document','Consulter et imprimer le DUT','Depuis un dossier, Aperçu affiche le document sans enregistrer une impression. DUT recto / verso permet de télécharger un exemplaire.')
for i,n in enumerate(['dut-exemple-1.png','dut-exemple-2.png']):
 x=M+i*(CW/2+8);image(AS/n,x,y,CW/2-8);para('RECTO' if i==0 else 'VERSO',x,y+(CW/2-8)*1100/778+5,CW/2-8,9,BLUE,True)
y+=379
y=steps([('Choisir l’exemplaire','Transporteur, expéditeur, destinataire ou souche OIC. Le document contient les informations de transport, les marchandises, les finances, les annexes, les réserves, les visas et les signatures.'),('Générer le fichier','Vérifiez le statut affiché. Dès la deuxième impression, un <b>motif de réimpression</b> est requis. Le rang, l’exemplaire et l’empreinte sont conservés dans l’historique local.')],y)
para('<b>Brouillon :</b> sans numéro ni QR officiel. <b>Suspendu / retiré :</b> marquages d’alerte. Les filigranes et l’empreinte du POC ne constituent pas une signature officielle. Les cases de signature sont destinées à être complétées sur le document.',M,y,size=10.3)

# 20
y=start('06 / Ressources','Comprendre les plages de numéros','Une plage est une réserve de numéros attribuée au partenaire. Chaque validation consomme un numéro de cette réserve dans le POC.')
y=screen('plages',y,245)
y=steps([('Demander une plage','Avec un compte partenaire, ouvrez <b>Opérations &amp; plages</b>, puis <b>Demander une nouvelle plage</b>. Renseignez quantité, tarif de démonstration et commentaire, puis soumettez.'),('Traiter la demande côté OIC','Avec le compte Admin OIC, ouvrez <b>Demandes de plages</b>. Une demande en attente peut être attribuée ou refusée. Un refus nécessite un motif.'),('Surveiller le stock','Relisez l’intervalle de numéros et le nombre disponible. Si la réserve est épuisée, une nouvelle plage est nécessaire avant une validation consommant un numéro.')],y)
note('Aucun paiement réel','Les montants de demande et de facturation sont des données de simulation. Le POC ne réalise aucun encaissement bancaire. Le menu de demande est accessible aux deux comptes partenaires dans cette version.',y)

# 21
y=start('06 / Ressources','Référentiels et carte des antennes','Les référentiels sont des listes de données réutilisables. Ils évitent de ressaisir les mêmes informations à chaque voyage.')
y=screen('referentiels',y,245)
y=steps([('Consulter les listes','Depuis le menu Référentiels du partenaire admin, choisissez Transporteurs, Véhicules, Conducteurs, Tiers, Marchandises ou Emballages.'),('Ajouter ou corriger une fiche','Utilisez <b>Ajouter</b> ou <b>Modifier</b>, renseignez les champs demandés puis enregistrez. Vérifiez la fiche avant de la réutiliser dans un DUT.'),('Localiser une antenne','Dans <b>Carte des antennes</b>, utilisez la carte et le tableau pour retrouver une antenne. <b>Me guider</b> ouvre un service cartographique externe.')],y)
note('Deux limites à connaître','Les coordonnées d’antennes de la démonstration ne sont pas des localisations officielles. Modifier une fiche de référence ne doit pas être interprété comme une correction automatique d’un DUT déjà émis.',y)

# 22
y=start('07 / Pilotage','Savoir quoi traiter en premier','Le centre d’actions rassemble les points nécessitant une attention. Les tableaux de bord donnent une vue d’ensemble.')
y=screen('actions',y,245)
y=steps([('Ouvrir le centre d’actions','Depuis Pilotage ou le résumé du tableau de bord, ouvrez <b>Centre d’actions</b>. Choisissez une catégorie et recherchez le dossier concerné.'),('Prioriser et retrouver sa vue','Activez le filtre des priorités si nécessaire. Le bouton d’enregistrement mémorise vos filtres pour le compte utilisé. Réinitialiser les filtres remet seulement cette vue à zéro.'),('Lire les indicateurs dans leur contexte','Dans Pilotage opérationnel, choisissez 30 jours, 90 jours ou tout l’historique. L’export CSV permet de récupérer les données prévues par cet écran.')],y)
note('Des chiffres avec un périmètre','Les indicateurs dépendent du rôle et de la période. Les priorités portent sur les dossiers actifs hors filtre temporel. Le repère de 2 jours d’attente est un seuil de démonstration, pas un délai réglementaire. Les voyages fictifs du planning n’ajoutent pas de DUT aux statistiques.',y)

# 23
y=start('07 / Apprendre en faisant','Un premier parcours guidé','À réaliser sur les comptes de démonstration, dans le même navigateur. Prévoyez environ 20 à 30 minutes.')
y=table(['Qui ?','Action à réaliser','Résultat à observer'],[
('Partenaire éditeur','Créer un nouveau DUT et compléter les sept étapes. Utiliser des informations fictives cohérentes.','Un brouillon est enregistré, puis la soumission produit un dossier Terminé.'),('Agent Antenne','Retrouver le dossier du même partenaire dans les dossiers en attente. Examiner et valider.','Le dossier devient Validé avec un numéro et un QR, si une plage est disponible.'),('Partenaire ou transporteur','Ouvrir le planning, retrouver le dossier et préciser les horaires.','Une barre apparaît sur la période correspondante et subsiste après rechargement.'),('Partenaire ou transporteur','Confirmer Chargé puis En route dans Transport. Signaler un retard et sa résolution.','L’étape et les événements sont visibles dans le dossier.'),('Partenaire','Ouvrir Aperçu puis générer un exemplaire avec DUT recto / verso.','Le PDF est téléchargé et une impression apparaît dans le journal.'),('Agent Contrôle','Lire le QR ou saisir son contenu, puis comparer les informations.','Le registre local retourne le dossier et son statut actuel.'),('Admin OIC','Retrouver les éléments dans le pilotage et examiner le journal du DUT.','Les actions de la démonstration peuvent être retracées.')],y,[90,235,CW-325],10.3)
note('Repérez votre dossier','Notez son numéro dès qu’il est attribué. Avant cela, retrouvez-le par camion, transporteur ou date. Le destinataire et l’expéditeur ne sont pas des comptes à ouvrir.',y)

# 24
y=start('08 / Données et limites','Où sont enregistrées les données ?','LocalStorage désigne l’espace de stockage du site dans votre navigateur. Il joue ici le rôle d’une base de démonstration.')
# conceptual local storage diagram
for x,w,title,txt in [(M,140,'VOUS','Vous saisissez et<br/>enregistrez une action.'),(M+183,150,'CE NAVIGATEUR','DUT, planning, fichiers<br/>et historique locaux.'),(M+373,CW-373,'VOTRE ÉCRAN','Les données sont relues<br/>au rechargement.')]:
 rect(x,y,w,110,LIGHT);para(title,x+10,y+15,w-20,10,BLUE,True);para(txt,x+10,y+42,w-20,10)
arrow(M+143,y+55,M+178,y+55);arrow(M+336,y+55,M+368,y+55);y+=136
y=table(['Action','Conséquence dans le POC'],[('Recharger la page','Les données enregistrées sont conservées dans le même navigateur et à la même adresse.'),('Changer de compte','Le périmètre affiché change. Les données locales sont partagées entre les comptes de démonstration.'),('Utiliser un autre appareil, profil ou navigateur','Vous ne retrouvez pas automatiquement les mêmes données. 127.0.0.1 et localhost peuvent aussi utiliser des stockages distincts.'),('Effacer les données du site ou réinitialiser la démo','Les données locales peuvent être perdues. Le bouton Réinitialiser la démonstration recrée les exemples après confirmation.'),('Télécharger un PDF ou un CSV','Vous obtenez un export, pas une sauvegarde complète restaurable de la plateforme.')],y,[183,CW-183],10.5)
note('Fonctions non disponibles dans cette version','Pas de serveur partagé, GPS en direct, signature numérique officielle, paiement réel, gestion des comptes ou écran de paramétrage central. Les accès par rôle illustrent le fonctionnement attendu ; le stockage local n’est pas une sécurité de production.',y)

# 25
y=start('08 / Aide','Si quelque chose vous bloque','Commencez par vérifier le compte connecté, l’état du dossier et la période affichée.')
y=table(['Problème','Vérification ou action'],[('Je ne vois pas un DUT','Vérifiez votre rôle et votre rattachement au partenaire, à l’antenne ou au transporteur. Essayez la recherche.'),('Le planning est vide','Cliquez sur Aujourd’hui ou Derniers trajets. Vérifiez les dates du voyage. Un dossier sans dates valides reste dans la liste à planifier.'),('Je ne peux pas valider','Le dossier doit être soumis, à l’état Terminé, et ouvert avec un compte Agent Antenne. Vérifiez aussi la disponibilité d’une plage.'),('Je ne peux pas avancer le transport','Le DUT doit être valide. On confirme uniquement l’étape suivante dans l’ordre proposé.'),('Le fichier est refusé','Vérifiez PDF/JPEG/PNG, la limite de 300 Ko et le total de 1,5 Mo. Réduisez la taille du fichier avant de réessayer.'),('La caméra ne fonctionne pas','Utilisez le contenu du QR en saisie manuelle, ou les boutons de simulation pour la présentation.'),('La réimpression est refusée','Renseignez le motif demandé. L’aperçu reste consultable sans créer une nouvelle impression.')],y,[173,CW-173],10.5)
y=para('<b>À qui demander de l’aide ?</b> Au partenaire pour corriger la saisie ; à l’antenne pour l’examen ; à l’OIC pour une plage, une suspension ou un retrait ; à l’équipe du POC pour l’accès local ou un problème technique.',M,y)+16
para('Si la page locale ne s’ouvre pas, demandez à l’équipe de vérifier que le serveur de démonstration est démarré. N’utilisez pas Réinitialiser la démonstration comme premier dépannage : cette action efface les données locales.',M,y,size=10.5)

# 26
y=start('08 / Références','Le petit dictionnaire du DUT','Gardez cette page à portée de main pendant vos premières utilisations.')
y=table(['Mot','Sens dans ce guide'],[('POC','Prototype utilisé pour montrer et tester le fonctionnement.'),('DUT','Document Unique de Transport.'),('Expéditeur / destinataire','Celui qui remet la marchandise / celui qui la reçoit.'),('Transporteur / conducteur','Entreprise qui réalise le transport / personne qui conduit.'),('Antenne','Relais local de l’OIC ; dans ce POC, point d’examen des dossiers.'),('Plage de numéros','Réserve de numéros attribuée à un partenaire.'),('Référentiel','Liste réutilisable : véhicules, conducteurs, marchandises, etc.'),('QR / token','Code à lire / identifiant opaque utilisé pour retrouver un dossier.'),('Empreinte','Référence calculée sur un contenu enregistré. Ici, elle sert à comparer une impression au registre local.'),('Audit / réserve','Historique des actions / observation d’un écart ou problème.'),('Gantt','Planning à barres montrant quand chaque voyage est prévu.')],y,[145,CW-145],10)
y=para('<b>Sources et périmètre de ce manuel</b>',M,y,size=12,color=BLUE)+9
y=para('[1] OIC, présentation du Document Unique de Transport, consultée le 21 septembre 2026 : <link href="https://www.oic.ci/source/fr/includes/dut/fr/index.php" color="#165B9B">site officiel de l’OIC</link>. Les explications réglementaires restent limitées à cette présentation.',M,y,size=9.5)+10
y=para('Fonctionnement : écrans et code du POC local, vérifiés le 21 septembre 2026. Modèle du document : les quatre PDF de référence fournis (recto enrichi, verso enrichi, dispositif anti-falsification et document selon son état). Captures : application locale, comptes de démonstration. Identité visuelle : logo OIC, bleu de la plateforme et police Instrument Sans.',M,y,size=9.5)
assert page==26,page
c.save(); print(f'{page} pages créées : {OUT}')
