import type { Category, Detection, FieldSnapshot, Tier, WarnCategory } from "./types.js";

export const HIGH_CONFIDENCE_MIN = 0.7;
export const CONTEXT_CONFIDENCE_MIN = 0.74;

const WEIGHT = {
  autocomplete: 0.97,
  type: 0.96,
  name: 0.86,
  id: 0.84,
  aria: 0.8,
  label: 0.8,
  placeholder: 0.74,
  nearby: 0.45,
} as const;

type Source = keyof typeof WEIGHT;

const HIGH = new Set<WarnCategory>([
  "ssn",
  "card",
  "cvv",
  "bank",
  "routing",
  "government-id",
  "passport",
  "drivers-license",
  "license-plate",
  "maiden-name",
  "security-answer",
  "password",
]);

/**
 * Asked for on nearly every sign-in and sign-up page. They get a reminder only where the page gives a
 * reason (plain HTTP, a form that submits over HTTP, or a lookalike address); see needsSiteConcern.
 */
const QUIET_ON_SECURE_PAGES = new Set<WarnCategory>(["email", "password", "phone"]);

/** A drop-down cannot hold a typed number, answer, password, email, or phone number, so these never warn on one. */
const NOT_ON_SELECT = new Set<WarnCategory>([...HIGH, "phone", "email"]);

const PRIORITY: WarnCategory[] = [
  "password",
  "ssn",
  "card",
  "cvv",
  "bank",
  "routing",
  "passport",
  "drivers-license",
  "license-plate",
  "government-id",
  "maiden-name",
  "security-answer",
  "health",
  "dob",
  "address",
  "phone",
  "email",
];

const AUTO: Record<string, WarnCategory> = {
  "current-password": "password",
  "new-password": "password",
  "cc-number": "card",
  "cc-csc": "cvv",
  email: "email",
  tel: "phone",
  "street-address": "address",
  "address-line1": "address",
  "address-line2": "address",
  "address-line3": "address",
  "postal-code": "address",
  bday: "dob",
  "bday-day": "dob",
  "bday-month": "dob",
  "bday-year": "dob",
};

interface Candidate {
  category: WarnCategory;
  confidence: number;
  source: Source;
}

const NONE: Detection = { tier: "none", category: "none", confidence: 0, warn: false };

/**
 * Lowercase words separated by single spaces. Accents and other marks are dropped (número → numero,
 * số → so), wide forms become plain letters, and letters of every script are kept, so labels in other
 * languages can be matched too.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[đð]/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Scripts written without spaces between words, where a phrase can sit inside a longer run of text. */
const UNSPACED = /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/**
 * Builds one matcher from label phrases written naturally, in any language. Phrases are normalized
 * the same way labels are, then matched as whole words (or as a run of characters for Chinese and Korean).
 */
function phraseRule(phrases: string[]): RegExp {
  const spaced: string[] = [];
  const unspaced: string[] = [];
  for (const phrase of phrases) {
    const normalized = normalizeText(phrase);
    if (!normalized) continue;
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    (UNSPACED.test(normalized) ? unspaced : spaced).push(escaped);
  }
  const parts: string[] = [];
  if (spaced.length) parts.push(`(?:^| )(?:${spaced.join("|")})(?= |$)`);
  if (unspaced.length) parts.push(`(?:${unspaced.join("|")})`);
  return new RegExp(parts.join("|") || "(?!)", "u");
}

/**
 * Labels in Spanish, Chinese (Simplified and Traditional), Vietnamese, Tagalog, Korean, Arabic, French,
 * Russian, Portuguese, and Haitian Creole. English rules are in the functions below. Drafted with the
 * translations; see TRANSLATIONS.md. Only the kinds of request the English rules know are listed.
 */
const FOREIGN: Partial<Record<WarnCategory, RegExp>> = {
  ssn: phraseRule([
    "número de seguro social", "número del seguro social", "numéro de sécurité sociale", "社会安全号码", "社会安全号", "社會安全號碼",
    "社會安全號", "số an sinh xã hội", "사회보장번호", "사회 보장 번호", "رقم الضمان الاجتماعي", "номер социального страхования", "снилс",
    "número do seguro social", "número da segurança social", "nimewo sekirite sosyal",
  ]),
  card: phraseRule([
    "número de tarjeta", "tarjeta de crédito", "tarjeta de débito", "numéro de carte", "carte bancaire", "carte de crédit", "卡号",
    "银行卡号", "信用卡号", "卡號", "信用卡號", "金融卡號", "số thẻ", "카드 번호", "카드번호", "رقم البطاقة", "رقم بطاقة الائتمان",
    "номер карты", "номер банковской карты", "número do cartão", "número de cartão", "cartão de crédito", "nimewo kat", "numero ng card",
  ]),
  cvv: phraseRule([
    "código de seguridad", "cryptogramme", "code de sécurité", "安全码", "安全碼", "卡片安全碼", "mã bảo mật", "보안 코드", "보안코드",
    "رمز الأمان", "код безопасности", "código de segurança", "kòd sekirite",
  ]),
  bank: phraseRule([
    "número de cuenta", "cuenta bancaria", "numéro de compte", "compte bancaire", "rib", "银行账号", "銀行帳號", "銀行帳戶", "số tài khoản",
    "계좌번호", "계좌 번호", "رقم الحساب", "رقم الحساب المصرفي", "номер счета", "расчетный счет", "número da conta", "conta bancária",
    "nimewo kont", "numero ng account",
  ]),
  routing: phraseRule([
    "número de ruta", "número de enrutamiento", "numéro d'acheminement", "汇款路线号码", "路由号码", "路由號碼", "số định tuyến",
    "라우팅 번호", "رقم التوجيه", "бик", "маршрутный номер", "número de roteamento", "nimewo routaj",
  ]),
  passport: phraseRule(["pasaporte", "passeport", "护照", "護照", "hộ chiếu", "여권", "جواز السفر", "паспорт", "passaporte", "paspò"]),
  "drivers-license": phraseRule([
    "licencia de conducir", "licencia de manejo", "permiso de conducir", "permis de conduire", "驾照", "驾驶证", "駕照", "駕駛執照",
    "bằng lái", "giấy phép lái xe", "운전면허", "운전 면허", "رخصة القيادة", "رخصة السياقة", "водительское удостоверение",
    "водительские права", "carteira de motorista", "carta de condução", "cnh", "lisans chofè", "lisensya sa pagmamaneho",
  ]),
  "license-plate": phraseRule([
    "número de placa", "placa del vehículo", "placa del carro", "placa del auto", "matrícula del vehículo", "plaque d'immatriculation",
    "numéro d'immatriculation", "车牌", "車牌", "biển số xe", "biển số", "차량 번호", "차량번호", "번호판", "رقم اللوحة", "لوحة السيارة",
    "номерной знак", "госномер", "гос номер", "placa do veículo", "placa do carro", "matrícula do veículo", "plak machin", "numero ng plaka",
  ]),
  "government-id": phraseRule([
    "número de identificación", "documento de identidad", "dni", "cédula", "curp", "nif", "nie", "pièce d'identité", "carte d'identité",
    "numéro d'identité", "身份证号", "身份证", "身分證", "身分證字號", "căn cước", "cccd", "cmnd", "주민등록번호", "신분증 번호",
    "رقم الهوية", "الهوية الوطنية", "инн", "удостоверение личности", "cpf", "rg", "número de identidade", "bilhete de identidade",
    "kat idantite", "nimewo idantite",
  ]),
  "maiden-name": phraseRule([
    "apellido de soltera", "nombre de soltera", "nom de jeune fille", "娘家姓", "婚前姓", "họ thời con gái", "tên thời con gái",
    "결혼 전 성", "결혼전 성", "اسم العائلة قبل الزواج", "اسم الأم قبل الزواج", "девичья фамилия", "девичью фамилию", "nome de solteira",
    "non jèn fi", "apelyido noong dalaga", "apelyido sa pagkadalaga",
  ]),
  "security-answer": phraseRule([
    "respuesta de seguridad", "respuesta secreta", "respuesta a la pregunta de seguridad", "réponse secrète", "réponse de sécurité",
    "réponse à la question de sécurité", "安全问题答案", "密保答案", "安全問題答案", "câu trả lời bảo mật", "câu trả lời bí mật",
    "보안 질문 답변", "보안질문 답변", "비밀 질문 답변", "إجابة سؤال الأمان", "الإجابة السرية", "إجابة السؤال السري",
    "ответ на секретный вопрос", "секретный ответ", "контрольный ответ", "resposta de segurança", "resposta secreta", "repons sekirite",
  ]),
  password: phraseRule(["contraseña", "mot de passe", "密码", "密碼", "mật khẩu", "비밀번호", "암호", "كلمة المرور", "كلمة السر", "пароль", "senha", "modpas"]),
  email: phraseRule([
    "correo electrónico", "correo", "courriel", "电子邮件", "邮箱", "電子郵件", "電郵", "郵箱", "이메일", "전자우편", "البريد الإلكتروني",
    "электронная почта", "электронной почты", "imèl",
  ]),
  phone: phraseRule([
    "teléfono", "celular", "móvil", "téléphone", "portable", "电话", "手机", "電話", "手機", "điện thoại", "전화번호", "휴대폰",
    "휴대전화", "رقم الهاتف", "الهاتف", "الجوال", "телефон", "номер телефона", "telefone", "telefòn", "telepono",
  ]),
  address: phraseRule([
    "dirección", "domicilio", "código postal", "adresse", "code postal", "地址", "住址", "邮编", "邮政编码", "郵遞區號", "địa chỉ",
    "mã bưu chính", "주소", "우편번호", "العنوان", "الرمز البريدي", "адрес", "почтовый индекс", "endereço", "cep", "adrès", "kòd postal",
    "tirahan",
  ]),
  dob: phraseRule([
    "fecha de nacimiento", "date de naissance", "出生日期", "生日", "ngày sinh", "생년월일", "생일", "تاريخ الميلاد", "дата рождения",
    "data de nascimento", "dat nesans", "petsa ng kapanganakan", "kaarawan",
  ]),
  health: phraseRule([
    "diagnóstico", "medicamentos", "historial médico", "seguro médico", "diagnostic", "médicaments", "dossier médical", "诊断", "病史",
    "药物", "診斷", "病歷", "藥物", "chẩn đoán", "tiền sử bệnh", "진단", "병력", "التشخيص", "الأدوية", "التاريخ الطبي", "диагноз",
    "лекарства", "история болезни", "histórico médico", "dyagnostik", "medikaman",
  ]),
};

/** Sign-in and verification codes in other languages. They are not card security codes. */
const FOREIGN_ONE_TIME_CODE = phraseRule([
  "código de verificación", "código enviado", "code de vérification", "code envoyé", "验证码", "驗證碼", "mã xác minh", "mã xác thực",
  "인증번호", "인증 번호", "인증 코드", "رمز التحقق", "код подтверждения", "код из смс", "código de verificação", "kòd verifikasyon",
]);

export function autocompleteTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && token !== "on" && token !== "off" && !token.startsWith("section-"));
}

function tierOf(category: WarnCategory): Tier {
  return HIGH.has(category) ? "high" : "context";
}

function isSsn(text: string): boolean {
  if (/\bssn\b|\bsoc sec\b/.test(text)) return true;
  if (!/\bsocial security\b/.test(text)) return false;
  return !/\b(benefit|benefits|office|administration|income|disability|retirement|payment|payments|check|checks)\b/.test(text);
}

const NOT_PAYMENT_CARD =
  /\b(library|loyalty|membership|member|rewards?|student|identity|id|medicare|medicaid|insurance|health|sim|business|greeting|playing|discount|club|access|report|key)\s+card\b/;

function isCard(text: string): boolean {
  if (NOT_PAYMENT_CARD.test(text)) return false;
  if (/\bcc number\b|\bcard number\b|\b(credit|debit) card number\b|\b(cc|card)(num|number|no)\b|\bprimary account number\b/.test(text)) {
    return true;
  }
  if (text === "pan" || /\bpan (number|no)\b/.test(text)) return true;
  const words = text.split(" ").filter(Boolean);
  if (words.length > 4) return false;
  if (/\b(name|holder|type|brand|expir|month|year|message|note)\b/.test(text)) return false;
  return /\b(credit|debit) card\b/.test(text);
}

function isCvv(text: string): boolean {
  if (/\bcc csc\b|\bcvv2?\b|\bcvc2?\b|\bcsc\b|\bsecurity code\b|\bcard verification\b/.test(text)) return true;
  return text === "cid";
}

/** Sign-in and verification codes. They are not card security codes, and they are not phone numbers. */
function isOneTimeCode(text: string): boolean {
  if (FOREIGN_ONE_TIME_CODE.test(text)) return true;
  if (/\bone time (code|password|passcode|pin)\b|\botp\b|\b2fa\b|\btwo (factor|step)\b|\bauthenticator\b|\bverification code\b/.test(text)) {
    return true;
  }
  return /\b(security|confirmation|login|sign in|access) code\b/.test(text) && /\b(sent|text|texted|sms|emailed|app)\b/.test(text);
}

function isBank(text: string): boolean {
  if (/\biban\b/.test(text)) return true;
  if (/\b(bank|checking|savings)\b/.test(text) && /\b(account|acct)\b/.test(text)) return true;
  return /\baccount number\b/.test(text) || /\bacct number\b/.test(text);
}

function isRouting(text: string): boolean {
  if (/\brouting number\b/.test(text)) return true;
  if (/\baba routing\b/.test(text) || /\baba number\b/.test(text)) return true;
  return text === "rtn" || text === "aba";
}

function isGovernmentId(text: string): boolean {
  return (
    /\bgovernment id\b/.test(text) ||
    /\bnational id\b/.test(text) ||
    /\btax id\b/.test(text) ||
    /\b(taxpayer|tax) (identification|id)\b/.test(text) ||
    /\bitin\b/.test(text) ||
    text === "tin" ||
    /\bnational insurance\b/.test(text) ||
    /\bsocial insurance\b/.test(text) ||
    /\bstate (issued )?id (number|card)\b|\bstate identification\b|\bstate issued id\b/.test(text)
  );
}

function isPassport(text: string): boolean {
  if (!/\bpassport\b/.test(text)) return false;
  const words = text.split(" ").filter(Boolean).length;
  if (words <= 5) return true;
  return /\bpassport number\b/.test(text);
}

function isLicense(text: string): boolean {
  if (/\b(license key|product license|software license|license code)\b/.test(text)) return false;
  return (
    /\bdriver s license\b/.test(text) ||
    /\bdrivers license\b/.test(text) ||
    /\bdriver license\b/.test(text) ||
    /\bdriving licen[cs]e\b/.test(text)
  );
}

function isLicensePlate(text: string): boolean {
  return /\blicen[cs]e plate\b|\b(number|registration) plate\b|\bplate (number|no)\b|\bvehicle registration (number|no)\b/.test(text);
}

function isMaidenName(text: string): boolean {
  return /\bmaiden( name)?\b/.test(text);
}

/** Questions sites use for account recovery, written as the label of the answer box. */
const RECOVERY_QUESTION =
  /\b(first|childhood) (pet|car|school|teacher|best friend|job|concert)\b|\bcity (were you|you were) born\b|\bborn in what city\b|\bstreet (did you|you) gr[eo]w up\b|\bfavou?rite (teacher|childhood)\b/;

/** The answer to a security question. The drop-down that picks the question is not the answer. */
function isSecurityAnswer(text: string): boolean {
  if (/\b(security|secret|challenge|memorable) (question )?answer/.test(text)) return true;
  if (/\banswer (to|for) (your |the |a )?(security|secret|challenge) question\b/.test(text)) return true;
  if (/\bmemorable (word|information)\b/.test(text)) return true;
  return RECOVERY_QUESTION.test(text);
}

function isPassword(text: string): boolean {
  if (/\b(hint|reminder)\b/.test(text)) return false;
  return /\b(password|passwd|pwd|passcode|passphrase)\b/.test(text);
}

function isAddress(text: string): boolean {
  if (/\b(email|e mail|ip|mac|web|website|url|wallet|bitcoin|ethereum|crypto|server|network|hardware|memory)\b/.test(text)) {
    return false;
  }
  // "Dirección de correo electrónico", "电子邮件地址", "이메일 주소": an email address, not a street address.
  if (FOREIGN.email?.test(text)) return false;
  if (FOREIGN.address?.test(text)) return true;
  if (/\baddress level\d\b/.test(text)) return false;
  if (/\bpostal code\b|\bzip code\b|\bpostcode\b/.test(text)) return true;
  return /\baddress\b/.test(text) || text === "street";
}

function isPhone(text: string): boolean {
  if (/\b(model|type|brand|make|case|carrier|screen|charger|os)\b/.test(text)) return false;
  return /\b(phone|mobile|telephone|cell)( number)?\b/.test(text);
}

function isEmail(text: string): boolean {
  return /\bemail\b/.test(text) || /\be mail\b/.test(text);
}

function isDob(text: string): boolean {
  return /\bdate of birth\b|\bbirth ?date\b|\bbirthday\b|\bdob\b|\bbirth (year|month|day)\b|\b(year|month|day) of birth\b/.test(text);
}

function isHealth(text: string): boolean {
  if (/\bmedical (school|college|degree|center|centre|device|devices|supplies|supply|field|specialty|specialties|equipment|license)\b/.test(text)) {
    return false;
  }
  if (/\b(diagnosis|diagnoses|prescriptions?|medications?|medical|medicare|medicaid)\b/.test(text)) return true;
  if (/\bpatient (id|number|record)\b/.test(text)) return true;
  return /\bhealth (plan|record|information|insurance|history)\b/.test(text);
}

function matches(category: WarnCategory, text: string): boolean {
  if (category !== "address" && FOREIGN[category]?.test(text)) return true;
  switch (category) {
    case "ssn":
      return isSsn(text);
    case "card":
      return isCard(text);
    case "cvv":
      return isCvv(text);
    case "bank":
      return isBank(text);
    case "routing":
      return isRouting(text);
    case "government-id":
      return isGovernmentId(text);
    case "passport":
      return isPassport(text);
    case "drivers-license":
      return isLicense(text);
    case "license-plate":
      return isLicensePlate(text);
    case "maiden-name":
      return isMaidenName(text);
    case "security-answer":
      return isSecurityAnswer(text);
    case "password":
      return isPassword(text);
    case "address":
      return isAddress(text);
    case "phone":
      return isPhone(text);
    case "email":
      return isEmail(text);
    case "dob":
      return isDob(text);
    case "health":
      return isHealth(text);
    default:
      return false;
  }
}

function push(into: Map<WarnCategory, Candidate>, candidate: Candidate): void {
  const current = into.get(candidate.category);
  if (!current || candidate.confidence > current.confidence) into.set(candidate.category, candidate);
}

function scanText(source: Source, raw: string, into: Map<WarnCategory, Candidate>): void {
  // Normalize once per source; the category rules all read the same text.
  const text = normalizeText(raw);
  if (!text) return;
  for (const category of PRIORITY) {
    if (matches(category, text)) push(into, { category, confidence: WEIGHT[source], source });
  }
}

function scanAutocomplete(raw: string, into: Map<WarnCategory, Candidate>): void {
  for (const token of autocompleteTokens(raw)) {
    const mapped = AUTO[token] ?? (token.startsWith("tel-") ? "phone" : undefined);
    if (mapped) push(into, { category: mapped, confidence: WEIGHT.autocomplete, source: "autocomplete" });
  }
  scanText("autocomplete", raw, into);
}

function better(left: Candidate, right: Candidate): Candidate {
  if (left.confidence !== right.confidence) return left.confidence > right.confidence ? left : right;
  return PRIORITY.indexOf(left.category) <= PRIORITY.indexOf(right.category) ? left : right;
}

function isOneTimeCodeField(snapshot: FieldSnapshot): boolean {
  if (autocompleteTokens(snapshot.autocomplete).includes("one-time-code")) return true;
  return [snapshot.name, snapshot.id, snapshot.ariaLabel, snapshot.labelText, snapshot.placeholder].some((raw) =>
    isOneTimeCode(normalizeText(raw)),
  );
}

/**
 * A specific identity or payment label beats the field type. Sites hide an SSN in a password box,
 * and use type="tel" on card, account, and SSN fields to get a number keypad on phones.
 */
function specificOverType(found: Map<WarnCategory, Candidate>, typed: WarnCategory): Candidate | undefined {
  let best: Candidate | undefined;
  for (const candidate of found.values()) {
    if (candidate.category === typed || !HIGH.has(candidate.category)) continue;
    if (candidate.source === "placeholder" || candidate.source === "nearby") continue;
    best = best ? better(best, candidate) : candidate;
  }
  return best;
}

export function classifyField(snapshot: FieldSnapshot): Detection {
  // A search box is never the place a site asks for these details, whatever its hint text says.
  if (snapshot.type === "search") return NONE;
  if (isOneTimeCodeField(snapshot)) return NONE;

  const found = new Map<WarnCategory, Candidate>();
  if (snapshot.type === "password") {
    push(found, { category: "password", confidence: WEIGHT.type, source: "type" });
  } else if (snapshot.type === "email") {
    push(found, { category: "email", confidence: WEIGHT.type, source: "type" });
  } else if (snapshot.type === "tel") {
    push(found, { category: "phone", confidence: WEIGHT.type, source: "type" });
  }

  scanAutocomplete(snapshot.autocomplete, found);
  scanText("name", snapshot.name, found);
  scanText("id", snapshot.id, found);
  scanText("aria", snapshot.ariaLabel, found);
  scanText("label", snapshot.labelText, found);
  scanText("placeholder", snapshot.placeholder, found);
  scanText("nearby", snapshot.nearbyText, found);

  let best: Candidate | undefined;
  for (const candidate of found.values()) best = best ? better(best, candidate) : candidate;
  if (!best) return NONE;

  if (snapshot.type === "password") best = specificOverType(found, "password") ?? best;
  if (snapshot.type === "tel") best = specificOverType(found, "phone") ?? best;
  if (snapshot.type === "url" && best.source === "nearby") return NONE;
  if (snapshot.tag === "select" && NOT_ON_SELECT.has(best.category)) return NONE;

  const tier = tierOf(best.category);
  const minimum = tier === "high" ? HIGH_CONFIDENCE_MIN : CONTEXT_CONFIDENCE_MIN;
  const confidence = Math.round(best.confidence * 100) / 100;
  const warn = confidence >= minimum;
  return {
    tier: warn ? tier : "none",
    category: warn ? best.category : "none",
    confidence,
    warn,
  };
}

export function isHighCategory(category: Category): boolean {
  return category !== "none" && HIGH.has(category);
}

/** True for kinds that warn only when the page has a site concern (HTTP page, HTTP form, lookalike). */
export function needsSiteConcern(category: Category): boolean {
  return category !== "none" && QUIET_ON_SECURE_PAGES.has(category);
}
