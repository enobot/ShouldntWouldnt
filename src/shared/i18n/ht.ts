import type { UiStrings } from "./strings.js";

// Draft translation, not yet reviewed by a native speaker. See TRANSLATIONS.md.
export const ht = (): UiStrings => ({
  sentenceJoiner: " ",
  field: {
    ssn: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo Sekirite Sosyal ou. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    card: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo kat ou. Asire w ou konnen sit sa a epi ou fè l konfyans.",
    cvv: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande kòd sekirite kat ou. Asire w ou konnen sit sa a epi ou fè l konfyans.",
    bank: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo kont labank ou. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    routing: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo idantifikasyon bank ou (routing number). Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    password: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande modpas ou. Asire w ou sou bon sit la anvan ou tape l.",
    "drivers-license":
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo lisans chofè ou. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    passport: "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo paspò ou. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    "license-plate":
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo plak machin ou. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    "maiden-name":
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande yon non jèn fi (pa egzanp non manman w anvan l marye). Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    "security-answer":
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande repons yon kesyon sekirite. Asire w ou konnen sit sa a epi ou fè l konfyans.",
    "government-id":
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande nimewo yon pyès idantite leta bay. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    health:
      "Enfòmasyon sansib: Sanble sit entènèt sa a ap mande enfòmasyon sou sante ou oswa enfòmasyon medikal. Pa bay enfòmasyon sa a eksepte bay òganizasyon ou fè konfyans.",
    email: "Rapèl: Espas sa a ap mande adrès imèl ou. Bay li sèlman si sa pa deranje w pou sit sa a voye mesaj ba ou.",
    phone: "Rapèl: Espas sa a ap mande nimewo telefòn ou. Bay li sèlman si ou vle sit sa a kontakte w.",
    address: "Rapèl: Espas sa a ap mande adrès ou. Bay li sèlman a sit ou fè konfyans.",
    dob: "Rapèl: Espas sa a ap mande dat nesans ou. Enfòmasyon sa a ka sèvi pou idantifye w, kidonk reflechi anvan ou bay li.",
  },
  sawSigns: {
    ssn: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo Sekirite Sosyal.",
    card: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo kat.",
    cvv: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande kòd sekirite yon kat.",
    bank: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo kont labank.",
    routing: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande nimewo idantifikasyon yon bank.",
    password: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon modpas.",
    "drivers-license": "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo lisans chofè.",
    passport: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo paspò.",
    "license-plate": "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo plak machin.",
    "maiden-name": "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon non jèn fi.",
    "security-answer": "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande repons yon kesyon sekirite.",
    "government-id": "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande nimewo yon pyès idantite leta bay.",
    health: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande enfòmasyon sou sante.",
    email: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon adrès imèl.",
    phone: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon nimewo telefòn.",
    address: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon adrès.",
    dob: "Shouldn't Wouldn't wè siy ki montre espas sa a ap mande yon dat nesans.",
  },
  because: {
    ssn: "Moun ka sèvi ak nimewo sa a pou vòlè idantite w, kidonk pi bon pou bay li sèlman a yon òganizasyon ou fè konfyans.",
    card: "Moun ka depanse lajan ak yon nimewo kat, kidonk asire w ou konnen sit sa a epi ou fè l konfyans.",
    cvv: "Kòd sekirite a ede moun fè peman ak yon kat, kidonk asire w ou konnen sit sa a epi ou fè l konfyans.",
    bank: "Moun ka deplase lajan ak enfòmasyon kont labank, kidonk bay yo sèlman a yon òganizasyon ou fè konfyans.",
    routing: "Nimewo sa a idantifye yon bank, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    password: "Yon modpas ka pèmèt yon moun antre nan yon kont, kidonk verifye anvan si ou sou bon sit la.",
    "drivers-license": "Moun ka sèvi ak nimewo lisans ou pou pase pou ou, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    passport: "Nimewo paspò se yon enfòmasyon idantite ki enpòtan anpil, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    "license-plate": "Plak machin nan konekte w ak machin ou, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    "maiden-name":
      "Bank ak lòt kont souvan sèvi ak non jèn fi pou konfime se ou menm oswa pou chanje yon modpas, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    "security-answer":
      "Moun ka sèvi ak repons kesyon sekirite yo pou chanje modpas ou epi antre nan kont ou, kidonk verifye anvan si ou sou bon sit la.",
    "government-id": "Moun ka sèvi ak nimewo pyès idantite ou pou pase pou ou, kidonk bay li sèlman a yon òganizasyon ou fè konfyans.",
    health: "Enfòmasyon sou sante se bagay prive, kidonk bay yo sèlman a yon òganizasyon ou fè konfyans.",
    email: "Adrès imèl se yon fason pou sit sa a kontakte w oswa idantifye w.",
    phone: "Nimewo telefòn se yon fason pou sit sa a jwenn ou.",
    address: "Yon adrès ka montre ki kote yon moun rete oswa resevwa lèt.",
    dob: "Dat nesans souvan sèvi pou idantifye yon moun.",
  },
  weDoNotRead: "Nou pa li sa ou tape.",
  noOtherSigns: "Pa gen lòt siy isit la ki montre yon pwoblèm koneksyon oswa yon adrès entènèt ki imite yon lòt sit. Sa pa vle di nou verifye repitasyon sit la.",
  trustOrLeave: "Si ou fè òganizasyon sa a konfyans, ou ka fèmen nòt sa a epi kontinye tape. Si ou pa fè l konfyans, kite paj la san ou pa mete enfòmasyon an.",

  httpHeadline: "Risk sekirite posib: Sit entènèt sa a sèvi ak yon koneksyon ki pa an sekirite. Enfòmasyon ou voye yo ka parèt devan lòt moun.",
  httpDetail: "Sit entènèt sa a pa sèvi ak HTTPS. Enfòmasyon ki voye sou yon koneksyon ki pa an sekirite ka parèt devan lòt moun.",
  formLine: "Sanble fòm sa a ap voye enfòmasyon yo sou yon koneksyon ki pa an sekirite.",
  lookalikeLine: "Adrès sit entènèt sa a sanble ak adrès yon lòt sit. Verifye adrès la byen anvan ou mete enfòmasyon pèsonèl.",
  maskLine:
    "Pou sa pa parèt sou ekran ou, sa ou tape isit la parèt tankou ti pwen. Chwazi Montre pou wè l. Se ekran ou sèlman ki chanje. Sit la toujou resevwa sa ou tape.",
  moreAbout: "Rapèl anplis sa a se sou sit la, se pa sou sa ou tape. Shouldn't Wouldn't pa li sa ou tape.",
  cannotPromise: "Li pa ka garanti yon sit entènèt se yon sit serye. HTTPS pou kont li pa vle di ou ka fè sit la konfyans.",
  goBackExplained: "Retounen kite paj la jan l ye a epi li pa efase sa ou te deja tape. Kontinye kanmenm fè fòm nan ale pi devan.",

  show: "Montre",
  hide: "Kache",
  showName: "Montre sa ou tape nan espas sa a",
  hideName: "Kache sa ou tape nan espas sa a",
  why: "Poukisa m ap wè sa a?",
  dismiss: "Fèmen",
  dismissName: "Fèmen rapèl sa a",
  noteName: "Rapèl Shouldn't Wouldn't",
  goBack: "Retounen",
  continueAnyway: "Kontinye kanmenm",
  moreInformation: "Plis enfòmasyon",
  panelName: "Rapèl Shouldn't Wouldn't sou sit la",

  hiddenReminderLine: "Paj sa a retire oswa kouvri yon rapèl Shouldn't Wouldn't. Fè anpil atansyon anvan ou bay nenpòt enfòmasyon isit la.",
  toolbarHiddenTitle: "Shouldn't Wouldn't: paj sa a retire oswa kouvri yon rapèl",

  tagline: "Reflechi de fwa anvan ou pataje.",
  protection: "Pwoteksyon",
  on: "Limen",
  off: "Etenn",
  offExplained:
    "Si ou etenn pwoteksyon an, verifikasyon an kanpe jiskaske ou limen l ankò. Chwa sa a anrejistre nan pwofil navigatè sa a. Li rete etenn lè ou chanje paj, rafrechi, oswa fèmen Chrome. Yo pa voye l ba nou.",
  notAVerdict: "Sa pa vle di sit entènèt la se yon sit serye.",
  site: "Sit",
  connection: "Koneksyon",
  sensitiveFields: "Espas sansib",
  securityConcerns: "Enkyetid sekirite",
  offNotScanned: "Pwoteksyon an etenn kounye a, kidonk yo pa t verifye paj sa a.",
  status: {
    no_obvious_risks: "Pa gen risk ki parèt klè",
    caution: "Fè atansyon",
    strong_concern: "Gen siy klè ki montre risk",
    unable: "Pa ka di",
  },
  privacyTitle: "Vi prive ou enpòtan",
  privacyBody: [
    "Shouldn't Wouldn't te fèt pou ede w ak moun ou renmen yo navige sou entènèt ak plis konfyans.",
    "Nou pa li sa ou tape nan fòm yo.",
    "Nou pa ranmase, anrejistre, pataje, ni vann enfòmasyon pèsonèl ou.",
    "Ekstansyon nou an sèlman remake lè yo mande enfòmasyon sansib ak lè gen enkyetid sekirite, epi li fè w yon ti rapèl dous pou reflechi de fwa anvan ou pataje.",
    "Analiz fòm yo fèt anndan navigatè ou, san yo pa swiv sa w ap fè.",
    "Paske vi prive ou dwe toujou vini an premye.",
  ],
  privacyLimit:
    "Shouldn't Wouldn't pa ka garanti tout sit entènèt an sekirite. Yon sit ka toujou kache, kouvri oswa retire yon rapèl, epi ekstansyon sa a pa ka anpeche yon sit ki ap eseye fè sa. Sit ou chwazi voye enfòmasyon ba yo ka ranmase enfòmasyon sa yo dapre pwòp règ vi prive pa yo.",
  language: "Lang",
  languageAuto: "Lang navigatè a",

  welcomeChoose: "Chwazi lang ou",
  welcomeDone: "Rapèl yo ap parèt an kreyòl ayisyen. Ou ka chanje lang nenpòt ki lè ak bouton Shouldn't Wouldn't ki nan ba zouti a.",
  welcomeIntro:
    "Lè yon sit entènèt mande yon bagay sansib, tankou nimewo Sekirite Sosyal oswa nimewo kat, yon ti nòt ap parèt bò kote espas sa a. Shouldn't Wouldn't pa li sa ou tape.",
  welcomeClose: "Ou ka fèmen onglè sa a kounye a.",
});
