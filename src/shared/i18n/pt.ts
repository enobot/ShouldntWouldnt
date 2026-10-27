import type { UiStrings } from "./strings.js";

// Draft translation, not yet reviewed by a native speaker. See TRANSLATIONS.md.
export const pt = (): UiStrings => ({
  sentenceJoiner: " ",
  field: {
    ssn: "Informação confidencial: Este site parece estar pedindo o seu número do Seguro Social (SSN). Compartilhe esta informação apenas com organizações de confiança.",
    card: "Informação confidencial: Este site parece estar pedindo o número do seu cartão. Verifique se você conhece este site e confia nele.",
    cvv: "Informação confidencial: Este site parece estar pedindo o código de segurança do seu cartão. Verifique se você conhece este site e confia nele.",
    bank: "Informação confidencial: Este site parece estar pedindo o número da sua conta bancária. Compartilhe esta informação apenas com organizações de confiança.",
    routing: "Informação confidencial: Este site parece estar pedindo o número de identificação do seu banco (routing number). Compartilhe esta informação apenas com organizações de confiança.",
    password: "Informação confidencial: Este site parece estar pedindo a sua senha. Verifique se você está no site certo antes de digitá-la.",
    "drivers-license":
      "Informação confidencial: Este site parece estar pedindo o número da sua carteira de motorista. Compartilhe esta informação apenas com organizações de confiança.",
    passport: "Informação confidencial: Este site parece estar pedindo o número do seu passaporte. Compartilhe esta informação apenas com organizações de confiança.",
    "license-plate":
      "Informação confidencial: Este site parece estar pedindo a placa do seu veículo. Compartilhe esta informação apenas com organizações de confiança.",
    "maiden-name":
      "Informação confidencial: Este site parece estar pedindo um nome de solteira (por exemplo, o da sua mãe). Compartilhe esta informação apenas com organizações de confiança.",
    "security-answer":
      "Informação confidencial: Este site parece estar pedindo a resposta de uma pergunta de segurança. Verifique se você conhece este site e confia nele.",
    "government-id":
      "Informação confidencial: Este site parece estar pedindo o número de um documento de identidade oficial. Compartilhe esta informação apenas com organizações de confiança.",
    health:
      "Informação confidencial: Este site parece estar pedindo informações médicas ou de saúde. Compartilhe esta informação apenas com organizações de confiança.",
    email: "Lembrete: Este campo pede o seu e-mail. Informe-o apenas se você aceitar receber mensagens deste site.",
    phone: "Lembrete: Este campo pede o seu número de telefone. Informe-o apenas se você quiser que este site entre em contato.",
    address: "Lembrete: Este campo pede o seu endereço. Informe-o apenas a sites de confiança.",
    dob: "Lembrete: Este campo pede a sua data de nascimento. Esse dado pode ser usado para identificar você, então informe-o com cuidado.",
  },
  sawSigns: {
    ssn: "O Shouldn't Wouldn't viu sinais de que este campo pede um número do Seguro Social.",
    card: "O Shouldn't Wouldn't viu sinais de que este campo pede um número de cartão.",
    cvv: "O Shouldn't Wouldn't viu sinais de que este campo pede o código de segurança de um cartão.",
    bank: "O Shouldn't Wouldn't viu sinais de que este campo pede um número de conta bancária.",
    routing: "O Shouldn't Wouldn't viu sinais de que este campo pede o número de identificação de um banco.",
    password: "O Shouldn't Wouldn't viu sinais de que este campo pede uma senha.",
    "drivers-license": "O Shouldn't Wouldn't viu sinais de que este campo pede um número de carteira de motorista.",
    passport: "O Shouldn't Wouldn't viu sinais de que este campo pede um número de passaporte.",
    "license-plate": "O Shouldn't Wouldn't viu sinais de que este campo pede a placa de um veículo.",
    "maiden-name": "O Shouldn't Wouldn't viu sinais de que este campo pede um nome de solteira.",
    "security-answer": "O Shouldn't Wouldn't viu sinais de que este campo pede a resposta de uma pergunta de segurança.",
    "government-id": "O Shouldn't Wouldn't viu sinais de que este campo pede o número de um documento de identidade oficial.",
    health: "O Shouldn't Wouldn't viu sinais de que este campo pede informações médicas ou de saúde.",
    email: "O Shouldn't Wouldn't viu sinais de que este campo pede um e-mail.",
    phone: "O Shouldn't Wouldn't viu sinais de que este campo pede um número de telefone.",
    address: "O Shouldn't Wouldn't viu sinais de que este campo pede um endereço.",
    dob: "O Shouldn't Wouldn't viu sinais de que este campo pede uma data de nascimento.",
  },
  because: {
    ssn: "Esse número pode ser usado para roubo de identidade, por isso vale a pena compartilhá-lo apenas com uma organização de confiança.",
    card: "Com o número do cartão é possível gastar dinheiro, então verifique se você conhece este site e confia nele.",
    cvv: "O código de segurança permite fazer cobranças no cartão, então verifique se você conhece este site e confia nele.",
    bank: "Com os dados da conta bancária é possível movimentar dinheiro, então compartilhe-os apenas com uma organização de confiança.",
    routing: "Esse número identifica um banco, então compartilhe-o apenas com uma organização de confiança.",
    password: "Uma senha pode dar acesso a uma conta, então primeiro verifique se você está no site certo.",
    "drivers-license": "Com o número da carteira de motorista alguém pode se passar por você, então compartilhe-o apenas com uma organização de confiança.",
    passport: "O número do passaporte é um dado de identidade muito importante, então compartilhe-o apenas com uma organização de confiança.",
    "license-plate": "A placa liga você ao seu veículo, então compartilhe-a apenas com uma organização de confiança.",
    "maiden-name":
      "Bancos e outras contas costumam usar o nome de solteira para confirmar a sua identidade ou redefinir uma senha, então compartilhe-o apenas com uma organização de confiança.",
    "security-answer":
      "Com as respostas de segurança alguém pode redefinir as suas senhas e entrar nas suas contas, então primeiro verifique se você está no site certo.",
    "government-id": "Com o número de um documento de identidade alguém pode se passar por você, então compartilhe-o apenas com uma organização de confiança.",
    health: "Informações de saúde são particulares, então compartilhe-as apenas com uma organização de confiança.",
    email: "O e-mail é uma forma de este site entrar em contato com você ou identificar você.",
    phone: "O número de telefone é uma forma de este site falar com você.",
    address: "Um endereço pode mostrar onde uma pessoa mora ou recebe correspondência.",
    dob: "A data de nascimento costuma ser usada para identificar uma pessoa.",
  },
  weDoNotRead: "Nós não lemos o que você digita.",
  noOtherSigns:
    "Nada mais aqui indica um problema de conexão ou um endereço que imita outro site. Isso não significa que verificamos a reputação do site.",
  trustOrLeave:
    "Se você confia nesta organização, pode fechar este aviso e continuar digitando. Se não confia, saia da página sem digitar a informação.",

  httpHeadline: "Possível risco de segurança: Este site usa uma conexão não segura. As informações que você enviar podem ficar expostas.",
  httpDetail: "Este site não usa HTTPS. Informações enviadas por uma conexão não segura podem ficar expostas.",
  formLine: "Este formulário parece enviar as informações por uma conexão não segura.",
  lookalikeLine: "O endereço deste site se parece com o de outro site. Confira bem o endereço antes de digitar informações pessoais.",
  maskLine:
    "Para não aparecer na sua tela, o que você digita aqui aparece como pontos. Escolha Mostrar para ver. Isso só muda a sua tela. O site continua recebendo o que você digita.",
  moreAbout: "Este lembrete extra é sobre o site, não sobre o que você digitou. O Shouldn't Wouldn't não lê o que você digita.",
  cannotPromise: "Ele não pode garantir que um site é legítimo. Só usar HTTPS não significa que o site é confiável.",
  goBackExplained: "Voltar deixa esta página como está e não apaga o que você já digitou. Continuar mesmo assim segue com o formulário.",

  show: "Mostrar",
  hide: "Ocultar",
  showName: "Mostrar o que você digitou neste campo",
  hideName: "Ocultar o que você digitou neste campo",
  why: "Por que estou vendo isto?",
  dismiss: "Fechar",
  dismissName: "Fechar este lembrete",
  noteName: "Lembrete do Shouldn't Wouldn't",
  goBack: "Voltar",
  continueAnyway: "Continuar mesmo assim",
  moreInformation: "Mais informações",
  panelName: "Lembrete do Shouldn't Wouldn't sobre o site",

  hiddenReminderLine: "Esta página removeu ou cobriu um lembrete do Shouldn't Wouldn't. Tenha muito cuidado antes de compartilhar qualquer coisa aqui.",
  toolbarHiddenTitle: "Shouldn't Wouldn't: esta página removeu ou cobriu um lembrete",

  tagline: "Pense duas vezes antes de compartilhar.",
  protection: "Proteção",
  on: "Ligada",
  off: "Desligada",
  offExplained:
    "Se você desligar a proteção, a verificação para até você ligá-la de novo. Essa escolha fica salva neste perfil do navegador. Ela continua desligada quando você muda de página, atualiza ou fecha o Chrome. Ela não é enviada para nós.",
  notAVerdict: "Isto não é uma garantia de que o site é legítimo.",
  site: "Site",
  connection: "Conexão",
  sensitiveFields: "Campos confidenciais",
  securityConcerns: "Riscos de segurança",
  offNotScanned: "A proteção está desligada agora, então esta página não foi verificada.",
  status: {
    no_obvious_risks: "Nenhum risco evidente",
    caution: "Recomenda-se cautela",
    strong_concern: "Risco fortemente indicado",
    unable: "Não foi possível determinar",
  },
  privacyTitle: "Sua privacidade importa",
  privacyBody: [
    "O Shouldn't Wouldn't foi criado para ajudar você e as pessoas que você ama a navegar com mais confiança.",
    "Nós não lemos o que você digita nos formulários.",
    "Nós não coletamos, guardamos, compartilhamos nem vendemos suas informações pessoais.",
    "Nossa extensão apenas identifica pedidos de informações confidenciais e possíveis riscos de segurança, e lembra você com gentileza de pensar duas vezes antes de compartilhar.",
    "A análise dos formulários acontece no seu navegador, sem rastrear a sua atividade.",
    "Porque a sua privacidade deve vir sempre em primeiro lugar.",
  ],
  privacyLimit:
    "O Shouldn't Wouldn't não pode garantir que todos os sites são seguros. Um site ainda pode esconder, cobrir ou remover um lembrete, e esta extensão não consegue impedir um site que tente fazer isso. Os sites para os quais você escolhe enviar informações podem coletá-las de acordo com as próprias políticas de privacidade.",
  language: "Idioma",
  languageAuto: "Idioma do navegador",

  welcomeChoose: "Escolha o seu idioma",
  welcomeDone: "Os lembretes vão aparecer em português. Você pode mudar o idioma a qualquer momento pelo botão do Shouldn't Wouldn't na barra de ferramentas.",
  welcomeIntro:
    "Quando um site pedir algo confidencial, como o número do Seguro Social ou do cartão, um aviso curto vai aparecer ao lado do campo. O Shouldn't Wouldn't não lê o que você digita.",
  welcomeClose: "Você já pode fechar esta aba.",
});
