const GUIDE_STEPS = [
  {
    title: "Antes de começar",
    text: "Crie a conta apenas na página oficial. Este guia não pede nem recebe seus dados.",
    items: [
      "Use um e-mail ou telefone ao qual só você tenha acesso.",
      "Crie uma senha única, que não seja usada em outro serviço.",
      "Nunca envie senha, código de confirmação, 2FA ou documento para alguém pelo chat.",
    ],
    note: "O link abaixo é de indicação. Ele pode se aplicar somente a contas novas e elegíveis; confirme condições e benefícios diretamente na página de cadastro.",
    external: { label: "Abrir cadastro oficial", href: "https://www.binance.com/register?ref=BOSS2026" },
    next: "Já abri a página",
  },
  {
    title: "Crie e confirme o acesso",
    text: "Informe seu e-mail ou telefone e confirme o código enviado pela própria plataforma.",
    items: [
      "Confira o endereço do site antes de digitar qualquer dado.",
      "O código de confirmação serve apenas dentro do cadastro oficial.",
      "Se alguém pedir esse código, pare: ele não deve ser compartilhado.",
    ],
    next: "Continuar",
  },
  {
    title: "Complete a verificação quando solicitada",
    text: "A plataforma pode solicitar verificação de identidade conforme seu país e os recursos que você pretende usar.",
    items: [
      "Faça esse processo somente dentro da página ou aplicativo oficial.",
      "Leia as instruções exibidas pela plataforma antes de avançar.",
      "Não envie foto de documento ou selfie para perfis, grupos ou atendentes não oficiais.",
    ],
    next: "Continuar",
  },
  {
    title: "Proteja a conta antes de usar",
    text: "A segurança vem antes de qualquer depósito ou operação.",
    items: [
      "Ative uma passkey, se essa opção estiver disponível na sua conta e dispositivo.",
      "Se não houver passkey, use um aplicativo autenticador como segundo fator — ele é mais seguro que SMS.",
      "Guarde a chave de recuperação em local seguro e offline. Nunca compartilhe códigos ou chaves.",
    ],
    note: "A disponibilidade de métodos de segurança pode variar. Confira as opções atuais em Segurança dentro da sua conta.",
    next: "Finalizar guia",
  },
  {
    title: "Conta criada. Próximo passo: estudar risco.",
    text: "Criar uma conta não obriga você a depositar ou operar. Antes de considerar futuros, use o simulador para estudar cenários de risco.",
    items: [
      "Não tome decisões por pressão, promessa de lucro ou mensagem privada.",
      "Use apenas canais oficiais para suporte e segurança.",
    ],
    external: { label: "Abrir simulador de risco", href: "https://sobrevive-ou-quebra.dlt.academy/" },
    next: "Recomeçar",
  },
];

const guideRoot = document.getElementById("guide-root");
let currentStep = 0;

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderGuide() {
  const step = GUIDE_STEPS[currentStep];
  const progress = document.createElement("ol");
  progress.className = "guide-progress";
  progress.setAttribute("aria-label", "Progresso do guia");

  GUIDE_STEPS.forEach((_, index) => {
    const item = document.createElement("li");
    if (index <= currentStep) item.classList.add("active");
    progress.appendChild(item);
  });

  const card = document.createElement("section");
  card.className = "guide-card";
  const label = document.createElement("p");
  label.className = "guide-step-label";
  label.textContent = `Passo ${currentStep + 1} de ${GUIDE_STEPS.length}`;
  const title = document.createElement("h2");
  title.textContent = step.title;
  const text = document.createElement("p");
  text.textContent = step.text;
  const list = document.createElement("ul");
  list.className = "guide-list";
  step.items.forEach((itemText) => {
    const item = document.createElement("li");
    item.textContent = itemText;
    list.appendChild(item);
  });

  card.append(label, title, text, list);

  if (step.note) {
    const note = document.createElement("p");
    note.className = "guide-note";
    note.textContent = step.note;
    card.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "guide-actions";
  if (step.external) {
    const link = document.createElement("a");
    link.className = "btn btn-secondary";
    link.href = step.external.href;
    link.target = "_blank";
    link.rel = "sponsored nofollow noopener noreferrer";
    link.referrerPolicy = "no-referrer";
    link.textContent = step.external.label;
    actions.appendChild(link);
  }
  actions.appendChild(createButton(step.next, "btn btn-primary", () => {
    currentStep = currentStep === GUIDE_STEPS.length - 1 ? 0 : currentStep + 1;
    renderGuide();
  }));
  card.appendChild(actions);

  guideRoot.replaceChildren(progress, card);
}

renderGuide();
