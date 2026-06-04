import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {
  ArrowRight,
  BadgeEuro,
  BedDouble,
  Camera,
  Check,
  FileCheck2,
  Handshake,
  Home,
  KeyRound,
  Mail,
  MapPin,
  Menu,
  Phone,
  Ruler,
  Search,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import agentPortrait from './assets/agent-portrait.jpg';
import heroHouse from './assets/hero-house.jpg';
import listingModernHouse from './assets/listing-modern-house.jpg';
import listingTerrace from './assets/listing-terrace.jpg';
import listingWhiteHouse from './assets/listing-white-house.jpg';

type Service = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Listing = {
  image: string;
  title: string;
  rooms: string;
  size: string;
  location: string;
  price: string;
};

type Step = {
  title: string;
  body: string;
};

const services: Service[] = [
  {
    icon: Tag,
    title: "Chcem predať",
    body:
      "Pomôžeme vám nastaviť správnu trhovú cenu, pripraviť profi prezentáciu a nájsť vážneho kupujúceho bez zbytočných zdržaní.",
  },
  {
    icon: Search,
    title: "Chcem kúpiť",
    body:
      "Vyhľadáme vhodnú nehnuteľnosť presne podľa vašich požiadaviek a dôkladne preveríme všetky právne aj technické riziká.",
  },
  {
    icon: KeyRound,
    title: "Chcem prenajať",
    body:
      "Nájdeme spoľahlivého nájomcu, preveríme jeho bonitu a pripravíme prenájom bez zbytočnej administratívy.",
  },
];

const listings: Listing[] = [
  {
    image: listingTerrace,
    title: "Rodinný dom pod lesom",
    rooms: "6 izieb",
    size: "230 m2",
    location: "Bratislava VI",
    price: "900 000 EUR",
  },
  {
    image: listingWhiteHouse,
    title: "Vila s tichou záhradou",
    rooms: "6 izieb",
    size: "230 m2",
    location: "Bratislava VI",
    price: "900 000 EUR",
  },
  {
    image: listingModernHouse,
    title: "Moderné bývanie pri meste",
    rooms: "6 izieb",
    size: "230 m2",
    location: "Bratislava VI",
    price: "2 000 000 EUR",
  },
];

const process: Step[] = [
  {
    title: "Úvodná konzultácia",
    body:
      "Osobne sa stretneme, zistíme typ nehnuteľnosti, lokalitu, stav a vaše presné očakávania. Bez tlaku na podpis zmluvy.",
  },
  {
    title: "Ocenenie nehnuteľnosti",
    body:
      "Na základe reálnych dát z trhu pripravíme presnú analýzu a nastavíme strategickú cenu, nie len prvý odhad.",
  },
  {
    title: "Príprava na predaj",
    body:
      "Poradíme, čo upratať, prípadne pomôžeme s homestagingom a drobnými úpravami, ktoré výrazne zvýšia hodnotu.",
  },
  {
    title: "Profesionálna prezentácia",
    body:
      "Zabezpečíme špičkové fotografie, video, 3D pôdorys, pútavý text a cielenú reklamu na sieťach aj portáloch.",
  },
  {
    title: "Obhliadky a vyjednávanie",
    body:
      "Záujemcov pred obhliadkou filtrujeme a chránime váš čas. Vyjednávame za vás pre dosiahnutie najlepších podmienok.",
  },
  {
    title: "Zmluvy a kataster",
    body:
      "V úzkej spolupráci s advokátom a notárom zastrešíme kúpne zmluvy, bezpečnú úschovu peňazí aj návrh na vklad.",
  },
];

const highlights = [
  "Reálnych dát z trhu, nie pocitovej ceny.",
  "Špičkového marketingu pre foto, video aj obhliadky.",
  "Otvorenej komunikácie, vždy viete, čo sa deje.",
];

function Button({
  children,
  href,
  variant = "primary",
  icon: Icon = ArrowRight,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "text";
  icon?: LucideIcon;
}) {
  return (
    <a className={`button button-${variant}`} href={href}>
      <span>{children}</span>
      <Icon size={17} strokeWidth={2.5} aria-hidden="true" />
    </a>
  );
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="ZETA Real Estate domov">
      <span className="logo-symbol">Z</span>
      <span>
        <strong>ZETA</strong>
        <small>REAL ESTATE</small>
      </span>
    </a>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);

      if (!id) {
        return;
      }

      const alignTarget = () => {
        const target = document.getElementById(id);

        if (!target) {
          return;
        }

        const headerHeight =
          document.querySelector('.site-header')?.getBoundingClientRect().height ?? 84;
        const desiredTop = Math.max(56, headerHeight - 24);
        const y = target.getBoundingClientRect().top + window.scrollY - desiredTop;
        window.scrollTo({top: Math.max(0, y), behavior: 'auto'});

        window.requestAnimationFrame(() => {
          const delta = target.getBoundingClientRect().top - desiredTop;

          if (Math.abs(delta) > 1) {
            window.scrollBy({top: delta, behavior: 'auto'});
          }
        });
      };

      window.requestAnimationFrame(alignTarget);
      window.setTimeout(alignTarget, 250);
      window.setTimeout(alignTarget, 700);
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);

    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <main id="top">
      <header className="site-header">
        <Logo />
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Hlavná navigácia">
          <a href="#predaj" onClick={() => setMenuOpen(false)}>
            Chcem predať
          </a>
          <a href="#ponuka" onClick={() => setMenuOpen(false)}>
            Chcem kúpiť
          </a>
          <a className="nav-pill" href="#kontakt" onClick={() => setMenuOpen(false)}>
            Kontakt
          </a>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Zavrieť menu" : "Otvoriť menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">Predajte svoju nehnuteľnosť bezpečne, výhodne a bez stresu.</h1>
          <div className="hero-actions">
            <Button href="#kontakt" icon={BadgeEuro}>
              Bezplatná konzultácia
            </Button>
            <Button href="#proces" variant="text">
              Pozrieť, ako pracujeme
            </Button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Moderný rodinný dom">
          <img
            src={heroHouse}
            alt="Moderný rodinný dom so záhradou a bránou"
          />
        </div>
      </section>

      <section className="services-section" id="predaj">
        <div className="section-inner">
          <h2>Naše služby</h2>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="icon-box">
                  <service.icon size={25} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="listings-section" id="ponuka">
        <div className="section-inner">
          <h2>Ponuka</h2>
          <div className="listing-grid">
            {listings.map((listing) => (
              <article className="listing-card" key={listing.title}>
                <img src={listing.image} alt={listing.title} loading="lazy" />
                <div className="listing-body">
                  <h3>{listing.title}</h3>
                  <dl>
                    <div>
                      <BedDouble size={17} aria-hidden="true" />
                      <dt>Izby</dt>
                      <dd>{listing.rooms}</dd>
                    </div>
                    <div>
                      <Ruler size={17} aria-hidden="true" />
                      <dt>Plocha</dt>
                      <dd>{listing.size}</dd>
                    </div>
                    <div>
                      <MapPin size={17} aria-hidden="true" />
                      <dt>Lokalita</dt>
                      <dd>{listing.location}</dd>
                    </div>
                    <div>
                      <BadgeEuro size={17} aria-hidden="true" />
                      <dt>Cena</dt>
                      <dd>{listing.price}</dd>
                    </div>
                  </dl>
                  <a className="detail-button" href="#kontakt">
                    detaily
                  </a>
                </div>
              </article>
            ))}
          </div>
          <a className="show-more" href="#kontakt">
            ukázať viac (34)
          </a>
        </div>
      </section>

      <section className="process-section" id="proces">
        <div className="section-inner">
          <p className="eyebrow">Náš proces</p>
          <h2>Predaj pod kontrolou od prvého stretnutia po kataster</h2>
          <p className="section-lede">
            Žiadne prekvapenia, žiadny skrytý postup. Prinášame transparentnosť do
            každého kroku, ktorým spoločne prejdeme.
          </p>
          <div className="process-list">
            {process.map((step, index) => (
              <article className="process-row" key={step.title}>
                <h3>
                  <span>{index + 1}.</span>
                  {step.title}
                </h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="why-inner">
          <div className="why-copy">
            <p className="eyebrow">Prečo sme tu</p>
            <h2>Menšia kancelária. Oveľa väčšia pozornosť.</h2>
            <p>
              Byť menšou kanceláriou je naša najväčšia výhoda. Práve vďaka tomu si
              môžeme dovoliť dať záležať na každom, aj tom najmenšom detaile.
              Nepracujeme na objem, ale na výsledok.
            </p>
            <p>
              Každá nehnuteľnosť je pre nás kľúčová referencia, preto jej venujeme
              maximálnu možnú pozornosť. Neukrývame prístup veľkých sietí, kde je
              klient len číslom v systéme. U nás máte istotu, že sa o váš predaj
              bude starať priamo zakladateľ od prvého podania ruky až po zápis do
              katastra.
            </p>
            <ul>
              {highlights.map((highlight) => (
                <li key={highlight}>
                  <Check size={17} strokeWidth={2.6} aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          <div className="agent-card">
            <img
              src={agentPortrait}
              alt="Realitná maklérka v kancelárii"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="estimate-section" id="kontakt">
        <div className="estimate-inner">
          <div className="estimate-copy">
            <p className="eyebrow">Odhad ceny</p>
            <h2>
              Premýšľate nad predajom?
              <br />
              Zistite aká je <mark>aktuálna hodnota vašej nehnuteľnosti</mark>
            </h2>
            <p className="estimate-note">
              Krátky formulár nám stačí na prvý orientačný odhad. Potom si spolu
              prejdeme lokalitu, stav a reálne porovnateľné predaje.
            </p>
          </div>
          <form className="estimate-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Typ nehnuteľnosti</span>
              <select defaultValue="byt">
                <option value="byt">Byt</option>
                <option value="dom">Rodinný dom</option>
                <option value="pozemok">Pozemok</option>
              </select>
            </label>
            <label>
              <span>Lokalita</span>
              <input type="text" placeholder="napr. Bratislava VI" />
            </label>
            <label>
              <span>Kontakt</span>
              <input type="email" placeholder="vas@email.sk" />
            </label>
            <button type="submit">
              <span>Získať odhad</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="contact-strip" aria-label="Kontakt">
            <a href="tel:+421900123456">
              <Phone size={17} aria-hidden="true" />
              +421 900 123 456
            </a>
            <a href="mailto:kontakt@zetareal.sk">
              <Mail size={17} aria-hidden="true" />
              kontakt@zetareal.sk
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <Logo />
        <div className="footer-points">
          <span>
            <ShieldCheck size={17} aria-hidden="true" />
            Bezpečný predaj
          </span>
          <span>
            <Camera size={17} aria-hidden="true" />
            Profi prezentácia
          </span>
          <span>
            <FileCheck2 size={17} aria-hidden="true" />
            Právny servis
          </span>
          <span>
            <Handshake size={17} aria-hidden="true" />
            Osobný prístup
          </span>
        </div>
        <a className="footer-top" href="#top" aria-label="Späť hore">
          <Home size={18} aria-hidden="true" />
        </a>
      </footer>
    </main>
  );
}

export default App;
