import type { UiStrings } from "./strings.js";

// Draft translation, not yet reviewed by a native speaker. See TRANSLATIONS.md.
export const es = (): UiStrings => ({
  sentenceJoiner: " ",
  field: {
    ssn: "Información confidencial: Este sitio web parece estar pidiendo su número de Seguro Social. Comparta esta información solo con organizaciones de confianza.",
    card: "Información confidencial: Este sitio web parece estar pidiendo el número de su tarjeta. Asegúrese de reconocer este sitio web y de confiar en él.",
    cvv: "Información confidencial: Este sitio web parece estar pidiendo el código de seguridad de su tarjeta. Asegúrese de reconocer este sitio web y de confiar en él.",
    bank: "Información confidencial: Este sitio web parece estar pidiendo su número de cuenta bancaria. Comparta esta información solo con organizaciones de confianza.",
    routing: "Información confidencial: Este sitio web parece estar pidiendo el número de ruta de su banco. Comparta esta información solo con organizaciones de confianza.",
    password: "Información confidencial: Este sitio web parece estar pidiendo su contraseña. Asegúrese de estar en el sitio web correcto antes de escribirla.",
    "drivers-license":
      "Información confidencial: Este sitio web parece estar pidiendo su número de licencia de conducir. Comparta esta información solo con organizaciones de confianza.",
    passport: "Información confidencial: Este sitio web parece estar pidiendo su número de pasaporte. Comparta esta información solo con organizaciones de confianza.",
    "license-plate":
      "Información confidencial: Este sitio web parece estar pidiendo el número de placa de su vehículo. Comparta esta información solo con organizaciones de confianza.",
    "maiden-name":
      "Información confidencial: Este sitio web parece estar pidiendo un apellido de soltera. Comparta esta información solo con organizaciones de confianza.",
    "security-answer":
      "Información confidencial: Este sitio web parece estar pidiendo la respuesta a una pregunta de seguridad. Asegúrese de reconocer este sitio web y de confiar en él.",
    "government-id":
      "Información confidencial: Este sitio web parece estar pidiendo un número de identificación oficial. Comparta esta información solo con organizaciones de confianza.",
    health:
      "Información confidencial: Este sitio web parece estar pidiendo información médica o de salud. Comparta esta información solo con organizaciones de confianza.",
    email: "Recordatorio: Este campo pide su correo electrónico. Compártalo solo si está de acuerdo en recibir mensajes de este sitio web.",
    phone: "Recordatorio: Este campo pide su número de teléfono. Compártalo solo si quiere que este sitio web lo contacte.",
    address: "Recordatorio: Este campo pide su dirección. Compártala solo con sitios web de confianza.",
    dob: "Recordatorio: Este campo pide su fecha de nacimiento. Ese dato puede servir para identificarlo, así que compártalo con cuidado.",
  },
  sawSigns: {
    ssn: "Shouldn't Wouldn't vio señales de que este campo pide un número de Seguro Social.",
    card: "Shouldn't Wouldn't vio señales de que este campo pide un número de tarjeta.",
    cvv: "Shouldn't Wouldn't vio señales de que este campo pide el código de seguridad de una tarjeta.",
    bank: "Shouldn't Wouldn't vio señales de que este campo pide un número de cuenta bancaria.",
    routing: "Shouldn't Wouldn't vio señales de que este campo pide un número de ruta bancaria.",
    password: "Shouldn't Wouldn't vio señales de que este campo pide una contraseña.",
    "drivers-license": "Shouldn't Wouldn't vio señales de que este campo pide un número de licencia de conducir.",
    passport: "Shouldn't Wouldn't vio señales de que este campo pide un número de pasaporte.",
    "license-plate": "Shouldn't Wouldn't vio señales de que este campo pide un número de placa de vehículo.",
    "maiden-name": "Shouldn't Wouldn't vio señales de que este campo pide un apellido de soltera.",
    "security-answer": "Shouldn't Wouldn't vio señales de que este campo pide la respuesta a una pregunta de seguridad.",
    "government-id": "Shouldn't Wouldn't vio señales de que este campo pide un número de identificación oficial.",
    health: "Shouldn't Wouldn't vio señales de que este campo pide información médica o de salud.",
    email: "Shouldn't Wouldn't vio señales de que este campo pide un correo electrónico.",
    phone: "Shouldn't Wouldn't vio señales de que este campo pide un número de teléfono.",
    address: "Shouldn't Wouldn't vio señales de que este campo pide una dirección.",
    dob: "Shouldn't Wouldn't vio señales de que este campo pide una fecha de nacimiento.",
  },
  because: {
    ssn: "Ese número se puede usar para robar su identidad, así que vale la pena compartirlo solo con una organización de confianza.",
    card: "Con un número de tarjeta se puede gastar dinero, así que asegúrese de reconocer este sitio web y de confiar en él.",
    cvv: "El código de seguridad permite hacer cargos a una tarjeta, así que asegúrese de reconocer este sitio web y de confiar en él.",
    bank: "Con los datos de una cuenta bancaria se puede mover dinero, así que compártalos solo con una organización de confianza.",
    routing: "El número de ruta identifica a un banco, así que compártalo solo con una organización de confianza.",
    password: "Una contraseña puede dar acceso a una cuenta, así que primero verifique que está en el sitio web correcto.",
    "drivers-license": "Con un número de licencia alguien puede hacerse pasar por usted, así que compártalo solo con una organización de confianza.",
    passport: "El número de pasaporte es un documento de identidad muy importante, así que compártalo solo con una organización de confianza.",
    "license-plate": "La placa lo vincula con su vehículo, así que compártala solo con una organización de confianza.",
    "maiden-name":
      "Los bancos y otras cuentas suelen usar el apellido de soltera para confirmar su identidad o cambiar una contraseña, así que compártalo solo con una organización de confianza.",
    "security-answer":
      "Con las respuestas de seguridad alguien puede cambiar sus contraseñas y entrar en sus cuentas, así que primero verifique que está en el sitio web correcto.",
    "government-id": "Con un número de identificación oficial alguien puede hacerse pasar por usted, así que compártalo solo con una organización de confianza.",
    health: "Los datos de salud son privados, así que compártalos solo con una organización de confianza.",
    email: "El correo electrónico es una forma de que este sitio web lo contacte o lo identifique.",
    phone: "El número de teléfono es una forma de que este sitio web lo contacte.",
    address: "Una dirección puede mostrar dónde vive o recibe correo una persona.",
    dob: "La fecha de nacimiento se usa a menudo para identificar a una persona.",
  },
  weDoNotRead: "No leemos lo que usted escribe.",
  noOtherSigns:
    "No hay nada más aquí que indique un problema con la conexión o una dirección web parecida a otra. Eso no significa que hayamos revisado la reputación del sitio web.",
  trustOrLeave:
    "Si confía en esta organización, puede cerrar esta nota y seguir escribiendo. Si no confía, salga de la página sin escribir la información.",

  httpHeadline: "Posible riesgo de seguridad: Este sitio web usa una conexión no segura. La información que envíe podría quedar expuesta.",
  httpDetail: "Este sitio web no usa HTTPS. La información enviada por una conexión no segura podría quedar expuesta.",
  formLine: "Este formulario parece enviar la información por una conexión no segura.",
  lookalikeLine: "La dirección de este sitio web se parece a la de otro sitio. Revise bien la dirección antes de escribir información personal.",
  maskLine:
    "Para que no se vea en su pantalla, lo que escribe aquí aparece como puntos. Elija Mostrar para verlo. Esto solo cambia su pantalla. El sitio web recibe igualmente lo que usted escribe.",
  moreAbout: "Este aviso adicional es sobre el sitio web, no sobre lo que usted escribió. Shouldn't Wouldn't no lee lo que usted escribe.",
  cannotPromise: "No puede garantizar que un sitio web sea legítimo. Que use HTTPS no significa por sí solo que el sitio sea de confianza.",
  goBackExplained: "Regresar deja esta página como está y no borra lo que ya escribió. Continuar de todos modos sigue adelante con el formulario.",

  show: "Mostrar",
  hide: "Ocultar",
  showName: "Mostrar lo que escribió en este campo",
  hideName: "Ocultar lo que escribió en este campo",
  why: "¿Por qué veo esto?",
  dismiss: "Cerrar",
  dismissName: "Cerrar este recordatorio",
  noteName: "Recordatorio de Shouldn't Wouldn't",
  goBack: "Regresar",
  continueAnyway: "Continuar de todos modos",
  moreInformation: "Más información",
  panelName: "Recordatorio de Shouldn't Wouldn't sobre el sitio",

  hiddenReminderLine: "Esta página quitó o tapó un recordatorio de Shouldn't Wouldn't. Tenga mucho cuidado antes de compartir algo aquí.",
  toolbarHiddenTitle: "Shouldn't Wouldn't: esta página quitó o tapó un recordatorio",

  tagline: "Piénselo dos veces antes de compartir.",
  protection: "Protección",
  on: "Activada",
  off: "Desactivada",
  offExplained:
    "Si desactiva la protección, la revisión se detiene hasta que la vuelva a activar. Esa elección se guarda en este perfil del navegador. Sigue desactivada al cambiar de página, actualizar o cerrar Chrome. No se nos envía.",
  notAVerdict: "Esto no es una garantía de que el sitio web sea legítimo.",
  site: "Sitio",
  connection: "Conexión",
  sensitiveFields: "Campos confidenciales",
  securityConcerns: "Riesgos de seguridad",
  offNotScanned: "La protección está desactivada, así que esta página no se revisó.",
  status: {
    no_obvious_risks: "Sin riesgos evidentes",
    caution: "Se recomienda precaución",
    strong_concern: "Riesgo muy probable",
    unable: "No se puede determinar",
  },
  privacyTitle: "Su privacidad importa",
  privacyBody: [
    "Shouldn't Wouldn't se creó para ayudarle a usted y a sus seres queridos a navegar con más confianza.",
    "No leemos lo que escribe en los formularios.",
    "No recopilamos, guardamos, compartimos ni vendemos su información personal.",
    "Nuestra extensión solo detecta cuando se pide información confidencial y posibles riesgos de seguridad, y le da un recordatorio amable para que lo piense dos veces antes de compartir.",
    "El análisis de los formularios se hace en su navegador, sin rastrear su actividad.",
    "Porque su privacidad siempre debe ser lo primero.",
  ],
  privacyLimit:
    "Shouldn't Wouldn't no puede garantizar que todos los sitios web sean seguros. Un sitio web puede ocultar, tapar o quitar un recordatorio, y esta extensión no puede impedírselo. Los sitios web a los que usted decide enviar información pueden recopilarla según sus propias políticas de privacidad.",
  language: "Idioma",
  languageAuto: "Idioma del navegador",

  welcomeChoose: "Elija su idioma",
  welcomeDone: "Los recordatorios aparecerán en español. Puede cambiar el idioma en cualquier momento desde el botón de Shouldn't Wouldn't en la barra de herramientas.",
  welcomeIntro:
    "Cuando un sitio web pida algo confidencial, como un número de Seguro Social o de tarjeta, aparecerá una nota breve junto a ese campo. Shouldn't Wouldn't no lee lo que usted escribe.",
  welcomeClose: "Ya puede cerrar esta pestaña.",
});
