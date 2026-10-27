import type { UiStrings } from "./strings.js";

// Draft translation, not yet reviewed by a native speaker. See TRANSLATIONS.md.
export const fr = (): UiStrings => ({
  sentenceJoiner: " ",
  field: {
    ssn: "Information sensible : Ce site semble vous demander votre numéro de sécurité sociale. Ne communiquez cette information qu'à des organismes de confiance.",
    card: "Information sensible : Ce site semble vous demander votre numéro de carte. Assurez-vous de connaître ce site et de lui faire confiance.",
    cvv: "Information sensible : Ce site semble vous demander le code de sécurité de votre carte. Assurez-vous de connaître ce site et de lui faire confiance.",
    bank: "Information sensible : Ce site semble vous demander votre numéro de compte bancaire. Ne communiquez cette information qu'à des organismes de confiance.",
    routing: "Information sensible : Ce site semble vous demander le code d'identification de votre banque (routing number). Ne communiquez cette information qu'à des organismes de confiance.",
    password: "Information sensible : Ce site semble vous demander votre mot de passe. Vérifiez que vous êtes sur le bon site avant de le saisir.",
    "drivers-license":
      "Information sensible : Ce site semble vous demander votre numéro de permis de conduire. Ne communiquez cette information qu'à des organismes de confiance.",
    passport: "Information sensible : Ce site semble vous demander votre numéro de passeport. Ne communiquez cette information qu'à des organismes de confiance.",
    "license-plate":
      "Information sensible : Ce site semble vous demander votre numéro de plaque d'immatriculation. Ne communiquez cette information qu'à des organismes de confiance.",
    "maiden-name":
      "Information sensible : Ce site semble vous demander un nom de jeune fille. Ne communiquez cette information qu'à des organismes de confiance.",
    "security-answer":
      "Information sensible : Ce site semble vous demander la réponse à une question de sécurité. Assurez-vous de connaître ce site et de lui faire confiance.",
    "government-id":
      "Information sensible : Ce site semble vous demander un numéro de pièce d'identité officielle. Ne communiquez cette information qu'à des organismes de confiance.",
    health:
      "Information sensible : Ce site semble vous demander des informations médicales ou de santé. Ne communiquez cette information qu'à des organismes de confiance.",
    email: "Rappel : Ce champ demande votre adresse e-mail. Ne la donnez que si vous acceptez d'avoir des nouvelles de ce site.",
    phone: "Rappel : Ce champ demande votre numéro de téléphone. Ne le donnez que si vous voulez que ce site vous contacte.",
    address: "Rappel : Ce champ demande votre adresse. Ne la donnez qu'à des sites de confiance.",
    dob: "Rappel : Ce champ demande votre date de naissance. Elle peut servir à vous identifier, alors donnez-la avec prudence.",
  },
  sawSigns: {
    ssn: "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de sécurité sociale.",
    card: "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de carte.",
    cvv: "Shouldn't Wouldn't a vu des signes que ce champ demande le code de sécurité d'une carte.",
    bank: "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de compte bancaire.",
    routing: "Shouldn't Wouldn't a vu des signes que ce champ demande le code d'identification d'une banque.",
    password: "Shouldn't Wouldn't a vu des signes que ce champ demande un mot de passe.",
    "drivers-license": "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de permis de conduire.",
    passport: "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de passeport.",
    "license-plate": "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de plaque d'immatriculation.",
    "maiden-name": "Shouldn't Wouldn't a vu des signes que ce champ demande un nom de jeune fille.",
    "security-answer": "Shouldn't Wouldn't a vu des signes que ce champ demande la réponse à une question de sécurité.",
    "government-id": "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de pièce d'identité officielle.",
    health: "Shouldn't Wouldn't a vu des signes que ce champ demande des informations médicales ou de santé.",
    email: "Shouldn't Wouldn't a vu des signes que ce champ demande une adresse e-mail.",
    phone: "Shouldn't Wouldn't a vu des signes que ce champ demande un numéro de téléphone.",
    address: "Shouldn't Wouldn't a vu des signes que ce champ demande une adresse.",
    dob: "Shouldn't Wouldn't a vu des signes que ce champ demande une date de naissance.",
  },
  because: {
    ssn: "Ce numéro peut servir à usurper votre identité, il vaut donc mieux ne le donner qu'à un organisme de confiance.",
    card: "Un numéro de carte permet de dépenser de l'argent, alors assurez-vous de connaître ce site et de lui faire confiance.",
    cvv: "Le code de sécurité permet de débiter une carte, alors assurez-vous de connaître ce site et de lui faire confiance.",
    bank: "Les coordonnées bancaires permettent de déplacer de l'argent, alors ne les donnez qu'à un organisme de confiance.",
    routing: "Ce code identifie une banque, alors ne le donnez qu'à un organisme de confiance.",
    password: "Un mot de passe peut permettre d'entrer dans un compte, alors vérifiez d'abord que vous êtes sur le bon site.",
    "drivers-license": "Un numéro de permis peut servir à se faire passer pour vous, alors ne le donnez qu'à un organisme de confiance.",
    passport: "Le numéro de passeport est une pièce d'identité très importante, alors ne le donnez qu'à un organisme de confiance.",
    "license-plate": "Une plaque d'immatriculation vous relie à votre véhicule, alors ne la donnez qu'à un organisme de confiance.",
    "maiden-name":
      "Les banques et d'autres comptes utilisent souvent un nom de jeune fille pour vérifier votre identité ou réinitialiser un mot de passe, alors ne le donnez qu'à un organisme de confiance.",
    "security-answer":
      "Les réponses aux questions de sécurité peuvent permettre de réinitialiser vos mots de passe et d'entrer dans vos comptes, alors vérifiez d'abord que vous êtes sur le bon site.",
    "government-id": "Un numéro de pièce d'identité peut servir à se faire passer pour vous, alors ne le donnez qu'à un organisme de confiance.",
    health: "Les informations de santé sont privées, alors ne les donnez qu'à un organisme de confiance.",
    email: "Une adresse e-mail permet à ce site de vous contacter ou de vous identifier.",
    phone: "Un numéro de téléphone permet à ce site de vous joindre.",
    address: "Une adresse peut indiquer où une personne habite ou reçoit son courrier.",
    dob: "La date de naissance sert souvent à identifier une personne.",
  },
  weDoNotRead: "Nous ne lisons pas ce que vous tapez.",
  noOtherSigns:
    "Rien d'autre ici n'indique un problème de connexion ou une adresse web qui imite un autre site. Cela ne veut pas dire que nous avons vérifié la réputation du site.",
  trustOrLeave:
    "Si vous faites confiance à cet organisme, vous pouvez fermer cette note et continuer à taper. Sinon, quittez la page sans saisir l'information.",

  httpHeadline: "Risque de sécurité possible : Ce site utilise une connexion non sécurisée. Les informations que vous envoyez pourraient être exposées.",
  httpDetail: "Ce site n'utilise pas HTTPS. Les informations envoyées par une connexion non sécurisée peuvent être exposées.",
  formLine: "Ce formulaire semble envoyer les informations par une connexion non sécurisée.",
  lookalikeLine: "L'adresse de ce site ressemble à celle d'un autre site. Vérifiez bien l'adresse avant de saisir des informations personnelles.",
  maskLine:
    "Pour que cela ne s'affiche pas à l'écran, ce que vous tapez ici apparaît sous forme de points. Choisissez Afficher pour le voir. Cela ne change que votre écran. Le site reçoit quand même ce que vous saisissez.",
  moreAbout: "Ce rappel supplémentaire concerne le site, pas ce que vous avez tapé. Shouldn't Wouldn't ne lit pas ce que vous tapez.",
  cannotPromise: "Il ne peut pas garantir qu'un site est légitime. HTTPS à lui seul ne veut pas dire qu'un site est digne de confiance.",
  goBackExplained: "Revenir laisse cette page telle quelle et n'efface pas ce que vous avez déjà tapé. Continuer quand même poursuit l'envoi du formulaire.",

  show: "Afficher",
  hide: "Masquer",
  showName: "Afficher ce que vous avez tapé dans ce champ",
  hideName: "Masquer ce que vous avez tapé dans ce champ",
  why: "Pourquoi est-ce que je vois ceci ?",
  dismiss: "Fermer",
  dismissName: "Fermer ce rappel",
  noteName: "Rappel de Shouldn't Wouldn't",
  goBack: "Revenir",
  continueAnyway: "Continuer quand même",
  moreInformation: "Plus d'informations",
  panelName: "Rappel de Shouldn't Wouldn't sur le site",

  hiddenReminderLine: "Cette page a supprimé ou caché un rappel de Shouldn't Wouldn't. Soyez très prudent avant de communiquer quoi que ce soit ici.",
  toolbarHiddenTitle: "Shouldn't Wouldn't : cette page a supprimé ou caché un rappel",

  tagline: "Réfléchissez avant de partager.",
  protection: "Protection",
  on: "Activée",
  off: "Désactivée",
  offExplained:
    "Si vous désactivez la protection, la vérification s'arrête jusqu'à ce que vous la réactiviez. Ce choix est enregistré dans ce profil de navigateur. Il reste désactivé quand vous changez de page, actualisez ou fermez Chrome. Il ne nous est pas envoyé.",
  notAVerdict: "Ce n'est pas une garantie que le site est légitime.",
  site: "Site",
  connection: "Connexion",
  sensitiveFields: "Champs sensibles",
  securityConcerns: "Risques de sécurité",
  offNotScanned: "La protection est désactivée, donc cette page n'a pas été vérifiée.",
  status: {
    no_obvious_risks: "Aucun risque évident",
    caution: "Prudence recommandée",
    strong_concern: "Risque fortement indiqué",
    unable: "Impossible à déterminer",
  },
  privacyTitle: "Votre vie privée compte",
  privacyBody: [
    "Shouldn't Wouldn't a été créé pour vous aider, vous et vos proches, à naviguer en toute confiance.",
    "Nous ne lisons pas ce que vous tapez dans les formulaires.",
    "Nous ne collectons, n'enregistrons, ne partageons ni ne vendons vos informations personnelles.",
    "Notre extension repère simplement les demandes d'informations sensibles et les risques de sécurité possibles, puis vous rappelle gentiment de réfléchir avant de partager.",
    "L'analyse des formulaires se fait dans votre navigateur, sans suivre votre activité.",
    "Parce que votre vie privée doit toujours passer en premier.",
  ],
  privacyLimit:
    "Shouldn't Wouldn't ne peut pas garantir que tous les sites sont sûrs. Un site peut encore cacher, couvrir ou supprimer un rappel, et cette extension ne peut pas empêcher un site qui essaie de le faire. Les sites auxquels vous choisissez d'envoyer des informations peuvent les collecter selon leurs propres règles de confidentialité.",
  language: "Langue",
  languageAuto: "Langue du navigateur",

  welcomeChoose: "Choisissez votre langue",
  welcomeDone: "Les rappels s'afficheront en français. Vous pouvez changer de langue à tout moment avec le bouton Shouldn't Wouldn't dans la barre d'outils.",
  welcomeIntro:
    "Quand un site demande quelque chose de sensible, comme un numéro de sécurité sociale ou de carte, une courte note apparaît à côté du champ. Shouldn't Wouldn't ne lit pas ce que vous tapez.",
  welcomeClose: "Vous pouvez fermer cet onglet.",
});
