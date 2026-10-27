import type { UiStrings } from "./strings.js";

// Draft translation, not yet reviewed by a native speaker. See TRANSLATIONS.md.
export const tl = (): UiStrings => ({
  sentenceJoiner: " ",
  field: {
    ssn: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang iyong Social Security number. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    card: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng iyong card. Siguraduhing kilala at pinagkakatiwalaan mo ang website na ito.",
    cvv: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang security code ng iyong card. Siguraduhing kilala at pinagkakatiwalaan mo ang website na ito.",
    bank: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng iyong bank account. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    routing: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang routing number ng iyong bangko. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    password: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang iyong password. Siguraduhing nasa tamang website ka bago ito ilagay.",
    "drivers-license":
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng iyong lisensya sa pagmamaneho. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    passport: "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng iyong pasaporte. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    "license-plate":
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng plaka ng iyong sasakyan. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    "maiden-name":
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang isang apelyido noong dalaga (halimbawa, ng iyong ina). Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    "security-answer":
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang sagot sa isang security question. Siguraduhing kilala at pinagkakatiwalaan mo ang website na ito.",
    "government-id":
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang numero ng isang ID mula sa gobyerno. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    health:
      "Sensitibong Impormasyon: Mukhang hinihingi ng website na ito ang impormasyon tungkol sa iyong kalusugan. Ibahagi lang ito sa mga organisasyong pinagkakatiwalaan mo.",
    email: "Paalala: Hinihingi ng field na ito ang iyong email address. Ibahagi lang ito kung ayos lang sa iyo na makatanggap ng mensahe mula sa website na ito.",
    phone: "Paalala: Hinihingi ng field na ito ang iyong numero ng telepono. Ibahagi lang ito kung gusto mong makipag-ugnayan sa iyo ang website na ito.",
    address: "Paalala: Hinihingi ng field na ito ang iyong address. Ibahagi lang ito sa mga website na pinagkakatiwalaan mo.",
    dob: "Paalala: Hinihingi ng field na ito ang iyong petsa ng kapanganakan. Magagamit ito para makilala ka, kaya pag-isipang mabuti bago ito ibahagi.",
  },
  sawSigns: {
    ssn: "May nakitang palatandaan ang Shouldn't Wouldn't na Social Security number ang hinihingi ng field na ito.",
    card: "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng card ang hinihingi ng field na ito.",
    cvv: "May nakitang palatandaan ang Shouldn't Wouldn't na security code ng card ang hinihingi ng field na ito.",
    bank: "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng bank account ang hinihingi ng field na ito.",
    routing: "May nakitang palatandaan ang Shouldn't Wouldn't na routing number ng bangko ang hinihingi ng field na ito.",
    password: "May nakitang palatandaan ang Shouldn't Wouldn't na password ang hinihingi ng field na ito.",
    "drivers-license": "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng lisensya sa pagmamaneho ang hinihingi ng field na ito.",
    passport: "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng pasaporte ang hinihingi ng field na ito.",
    "license-plate": "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng plaka ang hinihingi ng field na ito.",
    "maiden-name": "May nakitang palatandaan ang Shouldn't Wouldn't na apelyido noong dalaga ang hinihingi ng field na ito.",
    "security-answer": "May nakitang palatandaan ang Shouldn't Wouldn't na sagot sa security question ang hinihingi ng field na ito.",
    "government-id": "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng ID mula sa gobyerno ang hinihingi ng field na ito.",
    health: "May nakitang palatandaan ang Shouldn't Wouldn't na impormasyon tungkol sa kalusugan ang hinihingi ng field na ito.",
    email: "May nakitang palatandaan ang Shouldn't Wouldn't na email address ang hinihingi ng field na ito.",
    phone: "May nakitang palatandaan ang Shouldn't Wouldn't na numero ng telepono ang hinihingi ng field na ito.",
    address: "May nakitang palatandaan ang Shouldn't Wouldn't na address ang hinihingi ng field na ito.",
    dob: "May nakitang palatandaan ang Shouldn't Wouldn't na petsa ng kapanganakan ang hinihingi ng field na ito.",
  },
  because: {
    ssn: "Puwedeng gamitin ang numerong iyan sa pagnanakaw ng pagkakakilanlan, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    card: "Puwedeng gamitin ang numero ng card para gumastos, kaya siguraduhing kilala at pinagkakatiwalaan mo ang website na ito.",
    cvv: "Nakatutulong ang security code para masingil ang card, kaya siguraduhing kilala at pinagkakatiwalaan mo ang website na ito.",
    bank: "Puwedeng gamitin ang detalye ng bank account para maglipat ng pera, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    routing: "Tinutukoy ng routing number ang isang bangko, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    password: "Puwedeng makapasok ang iba sa isang account gamit ang password, kaya tiyakin muna na nasa tamang website ka.",
    "drivers-license": "Puwedeng gamitin ang numero ng lisensya para magpanggap na ikaw, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    passport: "Napakahalagang dokumento ng pagkakakilanlan ang pasaporte, kaya ibahagi lang ang numero nito sa organisasyong pinagkakatiwalaan mo.",
    "license-plate": "Iniuugnay ka ng plaka sa iyong sasakyan, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    "maiden-name":
      "Madalas gamitin ng mga bangko at iba pang account ang apelyido noong dalaga para kumpirmahin kung sino ka o para mag-reset ng password, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    "security-answer":
      "Puwedeng gamitin ng iba ang mga sagot sa security question para i-reset ang iyong mga password at makapasok sa iyong mga account, kaya tiyakin muna na nasa tamang website ka.",
    "government-id": "Puwedeng gamitin ang numero ng ID mula sa gobyerno para magpanggap na ikaw, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    health: "Pribado ang impormasyon tungkol sa kalusugan, kaya ibahagi lang ito sa organisasyong pinagkakatiwalaan mo.",
    email: "Paraan ang email address para makipag-ugnayan sa iyo o makilala ka ng website na ito.",
    phone: "Paraan ang numero ng telepono para maabot ka ng website na ito.",
    address: "Maipapakita ng address kung saan nakatira o tumatanggap ng sulat ang isang tao.",
    dob: "Madalas gamitin ang petsa ng kapanganakan para makilala ang isang tao.",
  },
  weDoNotRead: "Hindi namin binabasa ang tina-type mo.",
  noOtherSigns:
    "Wala nang ibang palatandaan dito ng problema sa koneksyon o ng web address na kahawig ng iba. Hindi ibig sabihin nito na sinuri namin ang reputasyon ng website.",
  trustOrLeave:
    "Kung pinagkakatiwalaan mo ang organisasyong ito, puwede mong isara ang paalalang ito at magpatuloy sa pag-type. Kung hindi, umalis sa pahina nang hindi inilalagay ang impormasyon.",

  httpHeadline: "Posibleng Panganib sa Seguridad: Hindi secure ang koneksyon ng website na ito. Puwedeng malantad ang impormasyong ipapadala mo.",
  httpDetail: "Hindi gumagamit ng HTTPS ang website na ito. Puwedeng malantad ang impormasyong ipinapadala sa hindi secure na koneksyon.",
  formLine: "Mukhang ipinapadala ng form na ito ang impormasyon sa hindi secure na koneksyon.",
  lookalikeLine: "Kahawig ng address ng website na ito ang address ng ibang website. Suriing mabuti ang address bago maglagay ng personal na impormasyon.",
  maskLine:
    "Para hindi ito makita sa iyong screen, lalabas na tuldok ang tina-type mo rito. Piliin ang Ipakita para makita ito. Screen mo lang ang nagbabago. Natatanggap pa rin ng website ang inilalagay mo.",
  moreAbout: "Tungkol sa website ang dagdag na paalalang ito, hindi sa tina-type mo. Hindi binabasa ng Shouldn't Wouldn't ang tina-type mo.",
  cannotPromise: "Hindi nito maipapangako na lehitimo ang isang website. Ang HTTPS lang ay hindi nangangahulugang mapagkakatiwalaan ang website.",
  goBackExplained: "Hinahayaan ng Bumalik ang pahina gaya ng dati at hindi nito binubura ang na-type mo na. Itinutuloy ng Ituloy Pa Rin ang form.",

  show: "Ipakita",
  hide: "Itago",
  showName: "Ipakita ang tina-type mo sa field na ito",
  hideName: "Itago ang tina-type mo sa field na ito",
  why: "Bakit ko ito nakikita?",
  dismiss: "Isara",
  dismissName: "Isara ang paalalang ito",
  noteName: "Paalala ng Shouldn't Wouldn't",
  goBack: "Bumalik",
  continueAnyway: "Ituloy Pa Rin",
  moreInformation: "Higit Pang Impormasyon",
  panelName: "Paalala ng Shouldn't Wouldn't tungkol sa website",

  hiddenReminderLine: "Inalis o tinakpan ng pahinang ito ang isang paalala ng Shouldn't Wouldn't. Mag-ingat bago magbahagi ng anuman dito.",
  toolbarHiddenTitle: "Shouldn't Wouldn't: inalis o tinakpan ng pahinang ito ang isang paalala",

  tagline: "Mag-isip Muna Bago Magbahagi.",
  protection: "Proteksyon",
  on: "Naka-on",
  off: "Naka-off",
  offExplained:
    "Kapag in-off mo ang proteksyon, titigil ang pagsusuri hanggang i-on mo ulit. Naka-save ang pasyang iyon sa profile ng browser na ito. Mananatili itong naka-off kahit lumipat ka ng pahina, mag-refresh, o isara ang Chrome. Hindi ito ipinapadala sa amin.",
  notAVerdict: "Hindi ito hatol na lehitimo ang website.",
  site: "Site",
  connection: "Koneksyon",
  sensitiveFields: "Mga sensitibong field",
  securityConcerns: "Mga alalahanin sa seguridad",
  offNotScanned: "Naka-off ang proteksyon ngayon, kaya hindi nasuri ang pahinang ito.",
  status: {
    no_obvious_risks: "Walang halatang panganib",
    caution: "Mag-ingat",
    strong_concern: "Malakas ang palatandaan ng panganib",
    unable: "Hindi matukoy",
  },
  privacyTitle: "Mahalaga ang Iyong Privacy",
  privacyBody: [
    "Ginawa ang Shouldn't Wouldn't para matulungan ka at ang iyong mga mahal sa buhay na mag-browse nang mas panatag.",
    "Hindi namin binabasa ang tina-type mo sa mga form.",
    "Hindi namin kinokolekta, sine-save, ibinabahagi, o ibinebenta ang iyong personal na impormasyon.",
    "Tinutukoy lang ng aming extension ang mga paghingi ng sensitibong impormasyon at posibleng alalahanin sa seguridad, saka ka magiliw na pinapaalalahanang mag-isip muna bago magbahagi.",
    "Sa loob mismo ng iyong browser ginagawa ang pagsusuri ng form, nang hindi sinusubaybayan ang iyong aktibidad.",
    "Dahil dapat laging inuuna ang iyong privacy.",
  ],
  privacyLimit:
    "Hindi maipapangako ng Shouldn't Wouldn't na ligtas ang bawat website. Puwede pa ring itago, takpan, o alisin ng isang website ang paalala, at hindi ito mapipigilan ng extension na ito. Ang mga website na pinadadalhan mo ng impormasyon ay puwedeng mangolekta nito ayon sa sarili nilang patakaran sa privacy.",
  language: "Wika",
  languageAuto: "Wika ng browser",

  welcomeChoose: "Piliin ang iyong wika",
  welcomeDone: "Lalabas sa Tagalog ang mga paalala. Puwede mong palitan ang wika anumang oras gamit ang button ng Shouldn't Wouldn't sa toolbar.",
  welcomeIntro:
    "Kapag may hinihinging sensitibo ang isang website, gaya ng Social Security number o numero ng card, may lalabas na maikling paalala sa tabi ng field. Hindi binabasa ng Shouldn't Wouldn't ang tina-type mo.",
  welcomeClose: "Puwede mo nang isara ang tab na ito.",
});
