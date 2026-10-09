/* Tous les textes du site, EN et FR, au meme endroit.
   Les elements HTML portent data-i="cle" (texte, HTML autorise) ou data-ia="attribut=cle".
   Choix de la langue : ?lang=fr|en (memorise), sinon la valeur memorisee, sinon navigator.language. */

const NB = ' '; // espace insecable

export const DICT = {
  en: {
    'meta.title': 'Socle',
    'meta.desc': 'Turn any small company into an AI-native company, without replacing a single tool.',
    'aria.canvas': '3D illustration: six separate tool islands, a foundation slab drawn beneath them, a company brain built on it, robots switching on in every building, and a person asking a question that is answered and approved.',
    'aria.lang': 'Language',

    'nav.how': 'How it works',
    'nav.status': 'Where it stands',
    'nav.record': 'Track record',
    'nav.founder': 'Founder',
    'nav.contact': 'Contact',

    'hero.pill': 'Pre-incorporation project · Brussels · 2026',
    'hero.h1': 'AI-native, without replacing a single tool.',
    'hero.sub': 'Others start with agents. Socle starts with your company.',
    'hero.contact': 'Contact',
    'hero.how': 'How it works',

    'c1.h': 'Your tools don\'t talk.',
    'c1.p': 'Every tool is an island.',
    'c2.h': 'Socle lays the foundation.',
    'c2.p': 'Nothing is replaced.',
    'c3.h': 'A digital twin of your company.',
    'c3.p': 'Built automatically. Checked by a person.',
    'c4.h': 'Readable by any AI agent.',
    'c5.h': 'Ask. Approve. Done.',
    'fin.h': 'Your tools stay. Your company gets a foundation.',
    'fin.contact': 'Contact',
    'fin.how': 'How it works',
    'hint': 'Scroll',
    'note': 'Illustration, example data',

    'tag.tab': 'Spreadsheets',
    'tag.erp': 'Accounting',
    'tag.crm': 'CRM',
    'tag.mail': 'E-mail',
    'tag.doc': 'Files',
    'tag.pt': 'Planning',
    'q': '“Where do we stand on this job?”',
    'a': 'Budget <b>87%</b> used · <b>2 invoices</b> unpaid',
    'approve': 'Approve',
    'approved': 'Approved ✓',

    'st1.k': 'Before',
    'st1.h': 'Your tools don\'t talk.',
    'st1.p': 'Every tool is an island.',
    'st1.alt': 'Six tool islands drift apart, a runner finds nothing, a grey robot cannot help.',
    'st2.k': 'The foundation',
    'st2.h': 'Socle lays the foundation.',
    'st2.p': 'Nothing is replaced.',
    'st2.alt': 'A massive slab marked SOCLE rises and the tool islands settle onto it.',
    'st3.k': 'The digital twin',
    'st3.h': 'A digital twin of your company.',
    'st3.p': 'Built automatically. Checked by a person.',
    'st3.alt': 'A clean, ordered glass copy of the company floats above the foundation, linked to the real tools below.',
    'st4.k': 'After',
    'st4.h': 'Readable by any AI agent.',
    'st4.p': 'Ask. Approve. Done.',
    'st4.alt': 'Beams from the digital twin switch on a robot on every island, and results pop up everywhere.',

    'how.h': 'How it works',
    'how.lead': 'Turn any small company into an AI-native company, without replacing a single tool.',
    'how.intro': 'Socle connects to the tools your team already uses, builds the company brain automatically with Claude, and lets employees work with AI agents that understand the business and act on it safely. For companies of 10 to 200 people, in any sector.',
    'how.p1': '<b>1. Connect.</b> Socle plugs into the tools the team already uses (ERP, accounting, CRM, SharePoint, spreadsheets, email), read-only first. Nothing to migrate.',
    'how.p2': '<b>2. Build the digital twin automatically.</b> Claude agents read the connected data, extract clients, jobs, projects and costs, recognise the same entity across systems, and propose a company model, the digital twin of the business, that a person validates.',
    'how.p3': '<b>3. Work and act.</b> Employees work in Socle Workspace with agents that know the business. When an agent needs to change something, it goes through a governed action.',
    'how.p4': 'Most AI platforms start from agents, built one use case at a time. Socle starts from the company: its digital twin, the company brain. Every new agent reads the same twin, so it inherits the same understanding of the business.',
    'diag.title': 'Socle Workspace and Socle Core on top of existing tools',
    'diag.desc': 'Socle Workspace, the chat interface, sits on top of Socle Core, the company brain built automatically from connected tools, with governed actions exposed over MCP, which sits on top of the existing tools such as ERP, accounting, CRM, SharePoint and fleet tracking.',
    'diag.ws.t': 'Socle Workspace',
    'diag.ws.s1': 'Our chat workspace, a fork of open-source LibreChat,',
    'diag.ws.s2': 'where employees work with AI agents (Claude-first)',
    'diag.core.t': 'Socle Core',
    'diag.core.s1': 'The company brain, a digital twin built from your tools:',
    'diag.core.s2': 'clients, jobs, projects, costs, one identity across tools.',
    'diag.core.s3': 'Governed actions exposed over MCP.',
    'diag.tools.t': 'Your existing tools (nothing to migrate)',
    'diag.tools.s1': 'ERP, accounting, CRM, SharePoint, spreadsheets,',
    'diag.tools.s2': 'email: connected read-only first',
    'steps.lead': 'A governed action, step by step',
    'step.1': 'Read',
    'step.2': 'Dry-run',
    'step.3': 'Human approval',
    'step.4': 'Logged',
    'step.5': 'Written back through an adapter',
    'how.end': 'Nothing is replaced: employees keep their tools, the company owns its model and data, and it can change model provider without rebuilding.',

    'status.h': 'Where it stands',
    'status.p': 'Socle is pre-product. I am a solo founder and there is no legal entity yet. The automatic brain-building is the core I am building now. Everything below was done by hand at real companies, and it is exactly what Socle will automate.',

    'record.h': 'Track record',
    'rec1.h': 'Joinery and construction company',
    'rec1.p': 'First Socle module in progress: rebuilding job costing across four systems linked by a job code, matched by hand. Controls already delivered surfaced unallocated 2026 overhead and errors in the master costing file.',
    'rec2.h': 'Real-estate developer, 15 people',
    'rec2.p': 'Paid diagnostic, September 2026. Analysed 21 spreadsheets (46,000+ cells) and their Odoo setup, found three project-naming systems with no mapping between them, and traced a margin drop 14 months before their reporting showed it.',
    'rec3.h': 'ShiftIQ, staff-planning SaaS',
    'rec3.p': 'Multi-tenant SaaS I built with Claude Code and Lovable: 1,292 commits, 555 automated tests. A retailer used it for its staff planning this summer.',
    'rec4.h': 'Delivery channel',
    'rec4.p': 'Since October 2026 I deliver AI onboarding missions for SMEs as a subcontractor of a Belgian AI company.',

    'build.h': 'How I build',
    'build.p': 'Claude Code is my build stack and every Socle agent runs on Claude first.',
    'build.l1': '19 reusable skills and adversarial review agents',
    'build.l2': 'A state file per project, updated at each session',
    'build.l3': 'No claim shipped without a check: tests, measurements or a second reviewer.',

    'tl.h': 'Timeline',
    'tl.1': '<b>March 2026:</b> started building with Claude Code',
    'tl.2': '<b>Summer 2026:</b> ShiftIQ used by a retailer for staff planning',
    'tl.3': '<b>August 2026:</b> Socle architecture note',
    'tl.4': '<b>September 2026:</b> paid diagnostic for a real-estate developer',
    'tl.5': '<b>Late September 2026:</b> first module work at a joinery company',
    'tl.6': '<b>October 2026:</b> subcontracted AI onboarding missions for SMEs',

    'founder.h': 'Founder',
    'founder.p': 'Charles de Bellefroid, Brussels. Master in Entrepreneurship, Solvay Brussels School. About ten years of founding companies, including CheeeseBOX (co-founder and CEO, 14 people, over €1M group revenue).',
    'founder.link': 'Founder on LinkedIn',

    'foot.legal': '<strong>Legal notice.</strong> Socle is a project in pre-incorporation, led by Charles de Bellefroid, Brussels, Belgium. No legal entity has been created yet. Contact: <a href="mailto:info@getsocle.com">info@getsocle.com</a>',
    'foot.built': 'Built with Claude',
  },

  fr: {
    'meta.title': 'Socle',
    'meta.desc': 'L’IA dans votre entreprise, sans changer un seul outil.',
    'aria.canvas': 'Illustration 3D : six outils isolés, une dalle de fondation tracée dessous, le jumeau numérique de l’entreprise qui se construit au-dessus, des robots qui s’allument dans chaque bâtiment, et une personne qui valide une réponse.',
    'aria.lang': 'Langue',

    'nav.how': 'Comment ça marche',
    'nav.status': 'Où on en est',
    'nav.record': 'Références',
    'nav.founder': 'Fondateur',
    'nav.contact': 'Contact',

    'hero.pill': 'Projet en pré-incorporation · Bruxelles · 2026',
    'hero.h1': 'L’IA dans votre entreprise, sans changer un seul outil.',
    'hero.sub': 'Les autres partent des agents. Socle part de votre entreprise.',
    'hero.contact': 'Contact',
    'hero.how': 'Comment ça marche',

    'c1.h': 'Vos outils ne se parlent pas.',
    'c1.p': 'Chaque outil est une île.',
    'c2.h': 'Socle pose les fondations.',
    'c2.p': 'Rien n’est remplacé.',
    'c3.h': 'Le jumeau numérique de votre entreprise.',
    'c3.p': 'Construit automatiquement. Validé par une personne.',
    'c4.h': 'Lisible par n’importe quel agent IA.',
    'c5.h': 'Demandez. Validez. C’est fait.',
    'fin.h': 'Vos outils restent. Votre entreprise gagne un socle.',
    'fin.contact': 'Contact',
    'fin.how': 'Comment ça marche',
    'hint': 'Défiler',
    'note': 'Illustration, données d’exemple',

    'tag.tab': 'Tableurs',
    'tag.erp': 'Comptabilité',
    'tag.crm': 'CRM',
    'tag.mail': 'E-mails',
    'tag.doc': 'Documents',
    'tag.pt': 'Planning',
    'q': '« Où en est ce dossier' + NB + '? »',
    'a': '<b>87' + NB + '%</b> du budget consommé · <b>2 factures</b> impayées',
    'approve': 'Valider',
    'approved': 'Validé ✓',

    'st1.k': 'Avant',
    'st1.h': 'Vos outils ne se parlent pas.',
    'st1.p': 'Chaque outil est une île.',
    'st1.alt': 'Six îlots d’outils à la dérive, un coureur qui ne trouve rien, un robot gris qui ne peut rien faire.',
    'st2.k': 'La fondation',
    'st2.h': 'Socle pose les fondations.',
    'st2.p': 'Rien n’est remplacé.',
    'st2.alt': 'Une dalle massive marquée SOCLE s’élève et les îlots d’outils viennent s’y poser.',
    'st3.k': 'Le jumeau numérique',
    'st3.h': 'Le jumeau numérique de votre entreprise.',
    'st3.p': 'Construit automatiquement. Validé par une personne.',
    'st3.alt': 'Une copie claire et rangée de l’entreprise, en verre, flotte au-dessus de la fondation, reliée aux vrais outils en dessous.',
    'st4.k': 'Après',
    'st4.h': 'Lisible par n’importe quel agent IA.',
    'st4.p': 'Demandez. Validez. C’est fait.',
    'st4.alt': 'Des faisceaux partis du jumeau numérique allument un robot sur chaque îlot, et des résultats jaillissent partout.',

    'how.h': 'Comment ça marche',
    'how.lead': 'Faire de n’importe quelle PME une entreprise qui travaille avec l’IA, sans remplacer un seul outil.',
    'how.intro': 'Socle se connecte aux outils que votre équipe utilise déjà, construit automatiquement le cerveau de l’entreprise avec Claude, et vos employés travaillent avec des agents IA qui comprennent le métier et agissent en toute sécurité. Pour les entreprises de 10 à 200 personnes, dans tous les secteurs.',
    'how.p1': '<b>1. Connecter.</b> Socle se branche sur les outils que l’équipe utilise déjà (ERP, comptabilité, CRM, SharePoint, tableurs, e-mail), d’abord en lecture seule. Rien à migrer.',
    'how.p2': '<b>2. Construire automatiquement le jumeau numérique.</b> Des agents Claude lisent les données connectées, en extraient clients, dossiers, projets et coûts, reconnaissent la même entité d’un système à l’autre et proposent un modèle de l’entreprise, son jumeau numérique, qu’une personne valide.',
    'how.p3': '<b>3. Travailler et agir.</b> Les employés travaillent dans Socle Workspace avec des agents qui connaissent l’entreprise. Quand un agent doit modifier quelque chose, il passe par une action encadrée.',
    'how.p4': 'La plupart des plateformes d’IA partent des agents, construits cas d’usage après cas d’usage. Socle part de l’entreprise elle-même' + NB + ': son jumeau numérique. Chaque nouvel agent lit le même jumeau et hérite donc de la même compréhension du métier.',
    'diag.title': 'Socle Workspace et Socle Core au-dessus des outils existants',
    'diag.desc': 'Socle Workspace, l’interface de discussion, repose sur Socle Core, le cerveau de l’entreprise construit automatiquement à partir des outils connectés, avec des actions encadrées exposées via MCP, qui repose lui-même sur les outils existants : ERP, comptabilité, CRM, SharePoint, suivi de flotte.',
    'diag.ws.t': 'Socle Workspace',
    'diag.ws.s1': 'Notre espace de discussion, un fork de LibreChat open source,',
    'diag.ws.s2': 'où les employés travaillent avec des agents IA (Claude d’abord)',
    'diag.core.t': 'Socle Core',
    'diag.core.s1': 'Le jumeau numérique de l’entreprise, construit à partir de vos outils' + NB + ':',
    'diag.core.s2': 'clients, dossiers, projets, coûts, une seule identité d’un outil à l’autre.',
    'diag.core.s3': 'Actions encadrées exposées via MCP.',
    'diag.tools.t': 'Vos outils existants (rien à migrer)',
    'diag.tools.s1': 'ERP, comptabilité, CRM, SharePoint, tableurs,',
    'diag.tools.s2': 'e-mail' + NB + ': connectés d’abord en lecture seule',
    'steps.lead': 'Une action encadrée, étape par étape',
    'step.1': 'Lire',
    'step.2': 'Essai à blanc',
    'step.3': 'Validation humaine',
    'step.4': 'Journalisée',
    'step.5': 'Écrite dans l’outil via un adaptateur',
    'how.end': 'Rien n’est remplacé' + NB + ': les employés gardent leurs outils, l’entreprise reste propriétaire de son modèle et de ses données, et peut changer de fournisseur de modèle sans tout reconstruire.',

    'status.h': 'Où on en est',
    'status.p': 'Socle est au stade pré-produit. Je suis seul fondateur et il n’existe pas encore d’entité juridique. La construction automatique du cerveau est le cœur que je développe en ce moment. Tout ce qui suit a été fait à la main dans de vraies entreprises, et c’est exactement ce que Socle va automatiser.',

    'record.h': 'Références',
    'rec1.h': 'Entreprise de menuiserie et de construction',
    'rec1.p': 'Premier module Socle en cours' + NB + ': reconstruction du calcul de rentabilité des chantiers sur quatre systèmes reliés par un code chantier, rapprochés à la main. Les contrôles déjà livrés ont fait ressortir des frais généraux 2026 non affectés et des erreurs dans le fichier maître de calcul des coûts.',
    'rec2.h': 'Promoteur immobilier, 15 personnes',
    'rec2.p': 'Diagnostic payant, septembre 2026. 21 feuilles de calcul analysées (plus de 46' + NB + '000 cellules) ainsi que leur configuration Odoo' + NB + ': trois systèmes de nommage des projets sans aucune correspondance entre eux, et une baisse de marge repérée 14 mois avant qu’elle n’apparaisse dans leur reporting.',
    'rec3.h': 'ShiftIQ, SaaS de planification du personnel',
    'rec3.p': 'SaaS multi-locataire construit avec Claude Code et Lovable' + NB + ': 1' + NB + '292 commits, 555 tests automatisés. Un détaillant l’a utilisé cet été pour planifier son personnel.',
    'rec4.h': 'Canal de livraison',
    'rec4.p': 'Depuis octobre 2026, je livre des missions d’onboarding IA pour des PME, en sous-traitance d’une entreprise belge d’IA.',

    'build.h': 'Comment je construis',
    'build.p': 'Claude Code est mon environnement de travail et chaque agent Socle tourne d’abord sur Claude.',
    'build.l1': '19 skills réutilisables et des agents de relecture adverse',
    'build.l2': 'Un fichier d’état par projet, mis à jour à chaque session',
    'build.l3': 'Aucune affirmation livrée sans vérification' + NB + ': tests, mesures ou second relecteur.',

    'tl.h': 'Parcours',
    'tl.1': '<b>Mars 2026' + NB + ':</b> début de la construction avec Claude Code',
    'tl.2': '<b>Été 2026' + NB + ':</b> ShiftIQ utilisé par un détaillant pour sa planification',
    'tl.3': '<b>Août 2026' + NB + ':</b> note d’architecture de Socle',
    'tl.4': '<b>Septembre 2026' + NB + ':</b> diagnostic payant pour un promoteur immobilier',
    'tl.5': '<b>Fin septembre 2026' + NB + ':</b> premiers travaux de module dans une entreprise de menuiserie',
    'tl.6': '<b>Octobre 2026' + NB + ':</b> missions d’onboarding IA pour PME en sous-traitance',

    'founder.h': 'Fondateur',
    'founder.p': 'Charles de Bellefroid, Bruxelles. Master en entrepreneuriat, Solvay Brussels School. Une dizaine d’années à fonder des entreprises, dont CheeeseBOX (cofondateur et CEO, 14 personnes, plus d’1' + NB + 'M€ de chiffre d’affaires cumulé pour le groupe).',
    'founder.link': 'Fondateur sur LinkedIn',

    'foot.legal': '<strong>Mentions légales.</strong> Socle est un projet en pré-incorporation, porté par Charles de Bellefroid, Bruxelles, Belgique. Aucune entité juridique n’a encore été créée. Contact' + NB + ': <a href="mailto:info@getsocle.com">info@getsocle.com</a>',
    'foot.built': 'Construit avec Claude',
  },
};

const KEY = 'socle-lang';
const ok = l => l === 'fr' || l === 'en';
let lang = 'en';
const listeners = [];

function detect() {
  let q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { /* ignore */ }
  if (ok(q)) { store(q); return q; }
  let s = null;
  try { s = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  if (ok(s)) return s;
  return ((navigator.language || '') + '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
function store(l) { try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ } }

export const getLang = () => lang;
export const t = k => (DICT[lang] && DICT[lang][k]) ?? DICT.en[k] ?? k;
export const onLang = f => { listeners.push(f); };

function apply() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('meta.desc'));
  document.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = t(el.dataset.i); });
  document.querySelectorAll('[data-ia]').forEach(el => { el.dataset.ia.split(';').forEach(p => { const [a, k] = p.split('='); if (a && k) el.setAttribute(a, t(k)); }); });
  document.querySelectorAll('[data-lang]').forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  listeners.forEach(f => f(lang));
}
export function setLang(l, persist = true) { if (!ok(l)) return; lang = l; if (persist) store(l); apply(); }

lang = detect();
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
apply();
