/* Biblioteca do Protocolo do Teto Financeiro: os padrões, as variantes, as cenas, as
   famílias de crença, as escadas e os textos, numa fonte só. Só dados, sem DOM.
   O objeto é JSON estrito (aspas duplas, sem comentários, sem vírgula sobrando).
   Os ids publicados nunca mudam de nome; os textos podem mudar. Enquanto houver texto
   provisório, "rascunho" fica verdadeiro na raiz e nos objetos que o carregam.
   O navegador usa window.BIBLIOTECA_TETO; os testes usam require() no Node. */
(function (root) {
  "use strict";

  var BIBLIOTECA = {
    "versao": "2026.11-1",
    "rascunho": false,
    "regras": {
      "PESO_CUSTO": 1,
      "LIMIAR_TETO": 0.34,
      "MIN_MARCAS": 2,
      "LIMIAR_VAZAMENTO": 0.5,
      "DELTA_TRILHAS": 0.25,
      "LIMIAR_FAMILIA": 0.5,
      "LIMIAR_FAMILIA_GRADE": 2,
      "LIMIAR_FRACA": -0.5,
      "LIMIAR_FRACA_GRADE": 0.5,
      "CONFIANCA_MINIMA": 6,
      "HUMOR_AVISO": 3
    },
    "padroes": {
      "ganho-que-escorre": {
        "nome": "O ganho que escorre",
        "ordem": 1,
        "trilha": "retencao",
        "area": "guardar",
        "empurrao": "entra dinheiro a mais",
        "frase_tipica": [
          "dinheiro não para na minha mão",
          "eu mereço"
        ],
        "protege": "o patamar de casa e a culpa de ter mais",
        "familias_ligadas": [
          "evitar",
          "idolatrar",
          "status"
        ],
        "variantes": [],
        "sinais_gerais": [
          "o dinheiro voltou para o mesmo lugar depois de um ganho",
          "o extra sumiu em poucas semanas sem destino claro"
        ],
        "sinais_opcoes": [
          {
            "value": "euforia",
            "label": "Uma euforia de \"agora dá\""
          },
          {
            "value": "merecimento",
            "label": "Vontade de me dar um presente"
          },
          {
            "value": "app_compras",
            "label": "Abrir um app de compras sem pensar"
          },
          {
            "value": "culpa_depois",
            "label": "Culpa logo depois"
          }
        ],
        "escada": {
          "degrau0": "olhar o extrato do último dinheiro a mais e anotar para onde ele foi, sem julgar",
          "degrau1": [
            {
              "value": "destino_antes",
              "label": "escrever o destino do próximo dinheiro a mais antes de ele chegar, chamando-o de provisão (não de bônus)"
            }
          ],
          "degrau2": "espera de 72 horas para gasto não planejado acima de um valor que você define",
          "degrau3": "uma porcentagem de cada entrada (15 a 30%) vai no mesmo dia para uma conta separada, sem app no celular principal",
          "se_entao_exemplo": "quando entrar dinheiro a mais, antes de qualquer gasto, sigo o destino escrito",
          "metrica": "quanto do último extra chegou ao destino"
        },
        "trava": {
          "texto": "Hoje, antes de o próximo dinheiro a mais chegar: escreva para onde ele vai e tire do caminho o que facilita gastar sem pensar (por exemplo, o cartão salvo no app de compras).",
          "por_renda": {
            "fixa": "Hoje: programe uma transferência para uma conta separada no dia do salário, e escreva o destino do próximo dinheiro a mais.",
            "variavel": "Hoje: defina uma porcentagem de cada entrada que vai no mesmo dia para uma conta separada, e escreva o destino do próximo dinheiro a mais.",
            "mista": "Hoje: programe uma transferência no dia da parte fixa, defina uma porcentagem da parte variável e escreva o destino do próximo dinheiro a mais."
          }
        },
        "leitura": {
          "base": "Quando entra dinheiro a mais, ele costuma sair antes de ter um destino — ou o ritmo cai logo depois de um mês bom e a média volta ao mesmo número. O padrão protege o patamar em que você se sente em casa com o dinheiro, e a culpa de ter mais do que costuma ter."
        },
        "regra_trabalho_exemplo": "dinheiro vai para onde eu decido antes de ele chegar",
        "rascunho": false
      },
      "freio-na-cobranca": {
        "nome": "O freio na hora de cobrar",
        "ordem": 2,
        "trilha": "ganho",
        "area": "ganhar",
        "empurrao": "dizer preço, pedir aumento, cobrar, vender",
        "frase_tipica": [
          "vão achar caro",
          "quem sou eu"
        ],
        "protege": "a rejeição e a imagem de pessoa boa",
        "familias_ligadas": [
          "evitar",
          "status"
        ],
        "variantes": [],
        "sinais_gerais": [
          "adiou de novo cobrar, pedir ou mandar o preço",
          "deu desconto antes de a pessoa pedir"
        ],
        "sinais_opcoes": [
          {
            "value": "aperto_peito",
            "label": "Um aperto no peito ou na garganta"
          },
          {
            "value": "adiar",
            "label": "Vontade de deixar para depois"
          },
          {
            "value": "reescrever",
            "label": "Reescrever a mensagem várias vezes"
          },
          {
            "value": "medo_caro",
            "label": "O medo de acharem caro"
          }
        ],
        "escada": {
          "degrau0": "escrever o preço justo do seu trabalho num papel, só para você ler",
          "degrau1": [
            {
              "value": "preco_em_voz_alta",
              "label": "dizer o preço justo em voz alta, sem desconto, com o preço-alvo escrito antes"
            }
          ],
          "degrau2": "mandar uma proposta com o preço cheio, sem justificar demais (quando a margem e o momento permitem; se não, escrever quando vai ser a hora de pedir)",
          "degrau3": "reajuste com data fixa; pedidos por semana",
          "se_entao_exemplo": "quando sentir o aperto, mando o valor cheio antes de reler",
          "metrica": "pedidos feitos (não aceitos)"
        },
        "trava": {
          "texto": "Hoje: escreva o preço-alvo, ou a menor ação que leva a ele (por exemplo, a data em que você vai mandar o valor cheio). Não empurre uma negociação em um dia ruim."
        },
        "leitura": {
          "base": "Na hora de dizer o preço, algo freia: o desconto sai antes do pedido, a conversa é adiada. O padrão protege você da rejeição e da imagem de pessoa boa, e por isso faz sentido, mesmo custando caro."
        },
        "regra_trabalho_exemplo": "cobrar o justo é o que me deixa atender bem",
        "rascunho": false
      },
      "passo-que-nao-sai": {
        "nome": "O passo que não sai",
        "ordem": 3,
        "trilha": "ganho",
        "area": "decidir",
        "empurrao": "a hora de agir numa chance ou num plano",
        "frase_tipica": [
          "e se der errado?",
          "ainda não estou pronto"
        ],
        "protege": "o arrependimento de errar e a chance de ser testado",
        "familias_ligadas": [
          "vigilancia"
        ],
        "variantes": [
          "medo-de-errar",
          "nao-estou-pronto"
        ],
        "sinais_gerais": [
          "travou de novo diante de uma chance",
          "voltou a pesquisar em vez de agir"
        ],
        "sinais_opcoes": [
          {
            "value": "frio_barriga",
            "label": "Frio na barriga"
          },
          {
            "value": "pesquisar_mais",
            "label": "Vontade de pesquisar mais um pouco"
          },
          {
            "value": "cansaco_subito",
            "label": "Um cansaço de repente"
          },
          {
            "value": "e_se",
            "label": "O \"e se\" na cabeça"
          }
        ],
        "escada_por_variante": {
          "medo-de-errar": {
            "degrau0": "escrever em uma frase o pior caso real, só para ver o tamanho dele",
            "degrau1": [
              {
                "value": "pior_caso_plano_b",
                "label": "escrever o pior caso real e o plano B"
              }
            ],
            "degrau2": "um passo pequeno com perda máxima definida",
            "degrau3": "um passo por mês, sempre com limite",
            "se_entao_exemplo": "quando vier o \"e se\", escrevo o pior caso e o plano B antes de decidir",
            "metrica": "passos dados"
          },
          "nao-estou-pronto": {
            "degrau0": "escrever qual é a próxima ação, sem fazer ainda",
            "degrau1": [
              {
                "value": "menor_acao",
                "label": "a menor ação de 5 minutos"
              }
            ],
            "degrau2": "a ação com dia, hora e alguém sabendo",
            "degrau3": "uma ação por semana; conteúdo novo só depois da ação",
            "se_entao_exemplo": "antes de abrir mais uma pesquisa, faço a próxima ação",
            "metrica": "ações contra pesquisas"
          }
        },
        "trava": {
          "texto": "Hoje: escreva a menor ação que leva você ao próximo passo e o dia em que vai fazê-la. Se o medo for o que pesa, escreva também o pior caso real."
        },
        "leitura": {
          "base": "Quando a chance aparece, o passo não sai. O padrão protege você de errar, passar por uma prova ou carregar o peso de um patamar maior, e o preço é a chance que passa.",
          "por_variante": {
            "medo-de-errar": "No seu caso, o que mais pesa é o medo de errar: o \"e se\" fala mais alto que a chance.",
            "nao-estou-pronto": "No seu caso, o que mais pesa é a sensação de que ainda falta preparo: sempre há mais um pouco para preparar antes de começar."
          }
        },
        "regra_trabalho_exemplo": "eu me preparo fazendo pequeno",
        "rascunho": false
      },
      "decisao-no-calor": {
        "nome": "A decisão no calor",
        "ordem": 4,
        "trilha": "retencao",
        "area": "decidir",
        "empurrao": "emoção forte com dinheiro",
        "frase_tipica": [
          "se eu não fizer agora, perco",
          "só uma grande jogada muda minha vida"
        ],
        "protege": "o alívio imediato e a chance de provar valor rápido",
        "familias_ligadas": [
          "idolatrar"
        ],
        "variantes": [
          "emocao-do-momento",
          "virar-o-jogo"
        ],
        "sinais_gerais": [
          "decidiu com pressa e se arrependeu",
          "quis recuperar uma perda de uma vez"
        ],
        "sinais_opcoes": [
          {
            "value": "pressa",
            "label": "Pressa"
          },
          {
            "value": "coracao",
            "label": "Coração acelerado"
          },
          {
            "value": "so_dessa_vez",
            "label": "O \"só dessa vez\""
          },
          {
            "value": "medo_perder",
            "label": "O medo de perder a chance"
          }
        ],
        "escada_por_variante": {
          "emocao-do-momento": {
            "degrau0": "na próxima pressa com dinheiro, anotar só a hora e o que sentiu",
            "degrau1": [
              {
                "value": "atrito_antes",
                "label": "atrito antes da regra: tirar cartão salvo e apps da tela inicial, desligar compra com um clique"
              }
            ],
            "degrau2": "regra das 24 horas acima de um valor, por escrito",
            "degrau3": "lista de espera relida em 7 dias",
            "se_entao_exemplo": "quando sentir pressa com dinheiro, escrevo o pensamento e espero 24 horas",
            "metrica": "decisões que passaram pela espera"
          },
          "virar-o-jogo": {
            "degrau0": "listar pelo nome as contas que precisam estar pagas todo mês",
            "degrau1": [
              {
                "value": "escrever_o_chao",
                "label": "escrever o chão: reserva e contas que nunca entram em risco"
              }
            ],
            "degrau2": "um valor máximo por decisão que não muda a vida se for a zero",
            "degrau3": "toda decisão grande passa pelas três travas",
            "se_entao_exemplo": "quando eu pensar em virar o jogo, confiro se o chão está de fora",
            "metrica": "decisões dentro do limite"
          }
        },
        "trava": {
          "texto": "Hoje: tire da frente o que facilita decidir no calor (cartão salvo, app na tela inicial, compra com um clique) e escreva o valor acima do qual você espera 24 horas."
        },
        "leitura": {
          "base": "Quando a emoção sobe, a decisão sai antes da reflexão. O padrão protege você do desconforto de esperar, e a conta chega depois.",
          "por_variante": {
            "emocao-do-momento": "No seu caso, o que pesa é a emoção do momento: a pressa decide antes de você.",
            "virar-o-jogo": "No seu caso, o que pesa é a vontade de virar o jogo: uma decisão grande parece resolver tudo de uma vez."
          }
        },
        "regra_trabalho_exemplo": "decisão boa aguenta uma noite de espera",
        "rascunho": false
      },
      "progresso-sem-trilho": {
        "nome": "O progresso sem trilho",
        "ordem": 5,
        "trilha": "retencao",
        "area": "guardar",
        "empurrao": "semanas depois de começar",
        "frase_tipica": [
          "segunda eu recomeço"
        ],
        "protege": "a monotonia e o compromisso",
        "familias_ligadas": [
          "vigilancia"
        ],
        "variantes": [],
        "sinais_gerais": [
          "um plano parou há semanas e o \"segunda eu recomeço\" voltou",
          "a meta foi trocada por outra maior antes de cumprir a primeira"
        ],
        "sinais_opcoes": [
          {
            "value": "tedio",
            "label": "Tédio"
          },
          {
            "value": "segunda",
            "label": "O \"segunda eu recomeço\""
          },
          {
            "value": "esquecer",
            "label": "Simplesmente esqueci"
          },
          {
            "value": "inutil",
            "label": "A sensação de que não está adiantando"
          }
        ],
        "escada": {
          "degrau0": "fazer hoje a versão de 1 minuto da meta (abrir o app e olhar, ou anotar um gasto)",
          "degrau1": [
            {
              "value": "meta_minima",
              "label": "reduzir a meta ao mínimo que não falha"
            }
          ],
          "degrau2": "amarrar a meta a algo diário, ou automatizar",
          "degrau3": "regra de retomada: pulou uma vez, a próxima é obrigatória",
          "se_entao_exemplo": "quando pensar em recomeçar segunda, faço a versão mínima hoje",
          "metrica": "semanas mantidas"
        },
        "trava": {
          "texto": "Hoje: reduza a meta ao mínimo que não falha e amarre a algo que você já faz todo dia.",
          "por_renda": {
            "fixa": "Hoje: reduza a meta ao mínimo e programe uma transferência no dia do salário, para a meta andar sem depender de lembrar.",
            "variavel": "Hoje: reduza a meta ao mínimo e defina uma porcentagem de cada entrada que vai no mesmo dia para a meta.",
            "mista": "Hoje: reduza a meta ao mínimo, programe uma transferência no dia da parte fixa e defina uma porcentagem da parte variável."
          }
        },
        "leitura": {
          "base": "Você começa, e algumas semanas depois a rotina perde força. O padrão protege você da monotonia e de se comprometer por muito tempo."
        },
        "regra_trabalho_exemplo": "pular uma vez não cancela; a próxima vez é a que conta",
        "rascunho": false
      },
      "dinheiro-nao-combina": {
        "nome": "O dinheiro que \"não combina comigo\"",
        "ordem": 6,
        "trilha": "ganho",
        "area": "ganhar",
        "empurrao": "a chance de ganhar mais que o seu círculo",
        "frase_tipica": [
          "rico é desonesto",
          "gente como a gente..."
        ],
        "protege": "o pertencimento e a lealdade à origem",
        "familias_ligadas": [
          "evitar",
          "lealdade"
        ],
        "variantes": [],
        "sinais_gerais": [
          "recuou diante de uma chance de ganhar mais",
          "escondeu ou diminuiu o que ganha"
        ],
        "sinais_opcoes": [
          {
            "value": "desconforto_ganhar",
            "label": "Desconforto ao ganhar"
          },
          {
            "value": "vergonha_mostrar",
            "label": "Vergonha de mostrar"
          },
          {
            "value": "lembrar_familia",
            "label": "Pensar na minha família"
          },
          {
            "value": "diminuir",
            "label": "Vontade de me diminuir"
          }
        ],
        "escada": {
          "degrau0": "escrever uma frase sobre dinheiro que você ouvia em casa",
          "degrau1": [
            {
              "value": "tres_regras_ouvidas",
              "label": "escrever 3 regras sobre dinheiro ouvidas cedo, quem as dizia e o que protegiam"
            }
          ],
          "degrau2": "uma conversa honesta sobre dinheiro com alguém de confiança",
          "degrau3": "um uso do dinheiro como contribuição, vindo do próprio crescimento",
          "se_entao_exemplo": "quando notar a regra herdada, leio a minha regra de trabalho",
          "metrica": "vezes em que notou a regra"
        },
        "trava": {
          "texto": "Hoje: escreva o preço-alvo, ou a menor ação que leva a ganhar um pouco mais, e uma frase sobre dinheiro que você ouvia em casa."
        },
        "leitura": {
          "base": "Ganhar mais que o seu círculo traz desconforto, como se o dinheiro não combinasse com você. O padrão protege o pertencimento, a lealdade a onde você veio e o receio de ofuscar ou se afastar de quem está perto."
        },
        "regra_trabalho_exemplo": "posso crescer e continuar perto de quem importa para mim",
        "rascunho": false
      },
      "caixa-da-familia": {
        "nome": "O caixa da família",
        "ordem": 7,
        "trilha": "retencao",
        "area": "dar",
        "empurrao": "alguém próximo pede dinheiro",
        "frase_tipica": [
          "se eu tenho, tenho que ajudar"
        ],
        "protege": "ser necessário e ter lugar na família",
        "familias_ligadas": [
          "lealdade"
        ],
        "variantes": [],
        "sinais_gerais": [
          "um pedido de dinheiro de alguém próximo desequilibrou o mês",
          "o sim saiu antes de pensar"
        ],
        "sinais_opcoes": [
          {
            "value": "culpa_nao",
            "label": "Culpa de dizer não"
          },
          {
            "value": "sim_automatico",
            "label": "O sim saindo antes de pensar"
          },
          {
            "value": "pena",
            "label": "Pena da pessoa"
          },
          {
            "value": "medo_conflito",
            "label": "Medo de briga"
          }
        ],
        "escada": {
          "degrau0": "escrever o valor de ajuda que caberia no seu mês sem te apertar, só para você saber",
          "degrau1": [
            {
              "value": "inventario_e_valor",
              "label": "escrever 3 formas concretas como já apoiou a família e decidir um valor mensal de ajuda em reais"
            }
          ],
          "degrau2": "responder \"vejo e te falo amanhã\", com o roteiro curto; regra fixa: não emprestar nome, CPF ou cartão",
          "degrau3": "um não, ou um sim parcial, dito com calma",
          "se_entao_exemplo": "quando alguém me pedir dinheiro, respondo amanhã",
          "metrica": "pedidos respondidos no dia seguinte"
        },
        "trava": {
          "texto": "Hoje: decida um valor mensal de ajuda em reais e adote a regra de não emprestar o seu nome, CPF ou cartão."
        },
        "leitura": {
          "base": "Quando alguém próximo pede, o sim sai antes da conta. O padrão protege o seu lugar na família e o sentimento de ser necessária."
        },
        "regra_trabalho_exemplo": "posso ajudar dentro do que cabe, e pensar até amanhã",
        "rascunho": false
      }
    },
    "variantes": {
      "medo-de-errar": {
        "padrao": "passo-que-nao-sai",
        "nome": "O medo de errar"
      },
      "nao-estou-pronto": {
        "padrao": "passo-que-nao-sai",
        "nome": "A sensação de não estar pronto"
      },
      "emocao-do-momento": {
        "padrao": "decisao-no-calor",
        "nome": "A emoção do momento"
      },
      "virar-o-jogo": {
        "padrao": "decisao-no-calor",
        "nome": "A vontade de virar o jogo"
      }
    },
    "familias": {
      "evitar": {
        "nome": "Evitar",
        "itens": [
          "evitar_1",
          "evitar_2",
          "evitar_3"
        ],
        "leitura": "Para quem pesa Evitar, o dinheiro tende a ser um assunto que se afasta: olhar, pedir e ter ficam desconfortáveis.",
        "rascunho": false
      },
      "idolatrar": {
        "nome": "Idolatrar",
        "itens": [
          "idolatrar_1",
          "idolatrar_2",
          "idolatrar_3"
        ],
        "leitura": "Para quem pesa Idolatrar, o dinheiro tende a ser a resposta para quase tudo, e a espera por uma virada grande pode ocupar o lugar dos passos pequenos.",
        "rascunho": false
      },
      "status": {
        "nome": "Status",
        "itens": [
          "status_1",
          "status_2",
          "status_3"
        ],
        "leitura": "Para quem pesa Status, o dinheiro tende a medir valor e a ser visto pelos outros.",
        "rascunho": false
      },
      "vigilancia": {
        "nome": "Vigilância",
        "itens": [
          "vigilancia_1",
          "vigilancia_2",
          "vigilancia_3"
        ],
        "leitura": "Para quem pesa Vigilância, o dinheiro tende a ser algo para proteger e esconder, e nunca parece bastar.",
        "rascunho": false
      },
      "lealdade": {
        "nome": "Lealdade",
        "itens": [
          "lealdade_1",
          "lealdade_2",
          "lealdade_3"
        ],
        "leitura": "Para quem pesa Lealdade, o dinheiro tende a vir com a pergunta de quem se carrega junto e de onde se veio.",
        "rascunho": false
      }
    },
    "itens": {
      "evitar_1": {
        "familia": "evitar",
        "texto": "Querer muito dinheiro é meio feio."
      },
      "evitar_2": {
        "familia": "evitar",
        "texto": "Gente como eu não fica com dinheiro."
      },
      "evitar_3": {
        "familia": "evitar",
        "texto": "Prefiro nem olhar muito para quanto eu tenho ou devo."
      },
      "idolatrar_1": {
        "familia": "idolatrar",
        "texto": "Com mais dinheiro, quase todos os meus problemas sumiriam."
      },
      "idolatrar_2": {
        "familia": "idolatrar",
        "texto": "Só uma virada grande muda a minha vida de verdade."
      },
      "idolatrar_3": {
        "familia": "idolatrar",
        "texto": "Se eu ganhasse o suficiente, finalmente ficaria em paz."
      },
      "status_1": {
        "familia": "status",
        "texto": "O quanto eu ganho diz o quanto eu valho."
      },
      "status_2": {
        "familia": "status",
        "texto": "Preciso que os outros vejam que estou bem."
      },
      "status_3": {
        "familia": "status",
        "texto": "Fico mal quando alguém perto de mim está ganhando mais."
      },
      "vigilancia_1": {
        "familia": "vigilancia",
        "texto": "Se eu gastar, vai faltar."
      },
      "vigilancia_2": {
        "familia": "vigilancia",
        "texto": "Dinheiro é assunto que não se conta para ninguém."
      },
      "vigilancia_3": {
        "familia": "vigilancia",
        "texto": "Por mais que eu tenha, nunca parece seguro o bastante."
      },
      "lealdade_1": {
        "familia": "lealdade",
        "texto": "Se eu ficar bem, tenho que carregar os meus."
      },
      "lealdade_2": {
        "familia": "lealdade",
        "texto": "Ficar muito melhor que a minha família seria trair de onde eu vim."
      },
      "lealdade_3": {
        "familia": "lealdade",
        "texto": "Dizer não para alguém da família é egoísmo."
      }
    },
    "triades": [
      {
        "id": "triade_1",
        "itens": [
          "evitar_1",
          "idolatrar_1",
          "status_2"
        ]
      },
      {
        "id": "triade_2",
        "itens": [
          "idolatrar_2",
          "status_1",
          "vigilancia_1"
        ]
      },
      {
        "id": "triade_3",
        "itens": [
          "status_3",
          "vigilancia_3",
          "lealdade_1"
        ]
      },
      {
        "id": "triade_4",
        "itens": [
          "vigilancia_2",
          "lealdade_3",
          "evitar_3"
        ]
      },
      {
        "id": "triade_5",
        "itens": [
          "lealdade_2",
          "evitar_2",
          "idolatrar_3"
        ]
      }
    ],
    "cenas": [
      {
        "id": "cena_extra",
        "empurrao": "dinheiro a mais",
        "padrao_principal": "ganho-que-escorre",
        "prompt": "No último ano, quando entrou um dinheiro a mais (bônus, 13º, um trabalho extra, uma venda boa), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "extra_sumiu",
            "label": "Em poucas semanas ele tinha sumido, e eu não sei bem para onde",
            "padrao": "ganho-que-escorre",
            "tipo": "sinal"
          },
          {
            "value": "extra_mereco",
            "label": "Gastei com a sensação de \"agora eu mereço\"",
            "padrao": "ganho-que-escorre",
            "tipo": "sinal"
          },
          {
            "value": "extra_familia",
            "label": "Boa parte foi para alguém da família que precisava",
            "padrao": "caixa-da-familia",
            "tipo": "sinal"
          },
          {
            "value": "extra_jogada",
            "label": "Usei para tentar uma jogada maior, que podia mudar o jogo",
            "padrao": "decisao-no-calor",
            "tipo": "sinal",
            "variante": "virar-o-jogo"
          },
          {
            "value": "extra_destino",
            "label": "Ele foi para um destino que eu tinha decidido antes de chegar",
            "padrao": "ganho-que-escorre",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_cobrar",
        "empurrao": "cobrar, pedir, vender",
        "padrao_principal": "freio-na-cobranca",
        "prompt": "Quando você precisou dizer um preço, cobrar alguém, pedir aumento ou vender algo seu, o que costumava acontecer?",
        "opcoes": [
          {
            "value": "cobrar_adiei",
            "label": "Adiei a conversa ou a proposta mais do que devia",
            "padrao": "freio-na-cobranca",
            "tipo": "sinal"
          },
          {
            "value": "cobrar_desconto",
            "label": "Dei desconto antes mesmo de a pessoa pedir",
            "padrao": "freio-na-cobranca",
            "tipo": "sinal"
          },
          {
            "value": "cobrar_desculpa",
            "label": "Mandei o valor cheio de explicações, como quem pede desculpa",
            "padrao": "freio-na-cobranca",
            "tipo": "sinal"
          },
          {
            "value": "cobrar_menos",
            "label": "Aceitei ganhar menos para não parecer ambicioso",
            "padrao": "freio-na-cobranca",
            "tipo": "sinal"
          },
          {
            "value": "cobrar_nao_e_pra_mim",
            "label": "Senti que cobrar mais \"não era para gente como eu\"",
            "padrao": "dinheiro-nao-combina",
            "tipo": "sinal"
          },
          {
            "value": "cobrar_cheio",
            "label": "Disse o preço que eu queria e esperei a resposta",
            "padrao": "freio-na-cobranca",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_risco",
        "empurrao": "chance com risco",
        "padrao_principal": "passo-que-nao-sai",
        "prompt": "Quando apareceu uma chance com algum risco (um trabalho novo, um negócio, mudar de área, investir em algo), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "risco_e_se",
            "label": "O \"e se der errado?\" falou mais alto e eu deixei passar",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "medo-de-errar"
          },
          {
            "value": "risco_seguro",
            "label": "Fiquei no caminho mais seguro, mesmo pagando caro por isso",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "medo-de-errar"
          },
          {
            "value": "risco_preparar",
            "label": "Achei que ainda precisava me preparar mais antes",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "nao-estou-pronto"
          },
          {
            "value": "risco_tudo",
            "label": "Entrei rápido e com mais do que eu podia perder",
            "padrao": "decisao-no-calor",
            "tipo": "sinal",
            "variante": "virar-o-jogo"
          },
          {
            "value": "risco_limite",
            "label": "Entrei com um limite de perda definido antes",
            "padrao": "passo-que-nao-sai",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_emocao",
        "empurrao": "emoção forte com dinheiro",
        "padrao_principal": "decisao-no-calor",
        "prompt": "Quando bateu uma emoção forte envolvendo dinheiro (euforia, medo, raiva, pressa), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "emocao_agora",
            "label": "Decidi na hora, com a sensação de \"se eu não fizer agora, perco\"",
            "padrao": "decisao-no-calor",
            "tipo": "sinal",
            "variante": "emocao-do-momento"
          },
          {
            "value": "emocao_arrependi",
            "label": "Fiz uma compra ou um movimento de que me arrependi no dia seguinte",
            "padrao": "decisao-no-calor",
            "tipo": "sinal",
            "variante": "emocao-do-momento"
          },
          {
            "value": "emocao_recuperar",
            "label": "Depois de uma perda, quis recuperar tudo de uma vez",
            "padrao": "decisao-no-calor",
            "tipo": "sinal",
            "variante": "virar-o-jogo"
          },
          {
            "value": "emocao_travei",
            "label": "Travei e não fiz nada, mesmo quando precisava agir",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "medo-de-errar"
          },
          {
            "value": "emocao_esperei",
            "label": "Esperei a emoção passar antes de decidir qualquer coisa",
            "padrao": "decisao-no-calor",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_plano",
        "empurrao": "a hora de executar",
        "padrao_principal": "passo-que-nao-sai",
        "prompt": "Quando chegou a hora de pôr em prática um plano com dinheiro (começar a guardar, lançar algo, organizar as contas), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "plano_pesquisa",
            "label": "Fui atrás de mais um curso, vídeo ou informação antes de começar",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "nao-estou-pronto"
          },
          {
            "value": "plano_papel",
            "label": "O plano ficou no papel e eu fui deixando para depois",
            "padrao": "passo-que-nao-sai",
            "tipo": "sinal",
            "variante": "nao-estou-pronto"
          },
          {
            "value": "plano_larguei",
            "label": "Comecei com tudo e larguei pouco depois",
            "padrao": "progresso-sem-trilho",
            "tipo": "sinal"
          },
          {
            "value": "plano_fiz",
            "label": "Fiz a primeira parte mesmo sem me sentir pronto",
            "padrao": "passo-que-nao-sai",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_semanas",
        "empurrao": "semanas depois de começar",
        "padrao_principal": "progresso-sem-trilho",
        "prompt": "Algumas semanas depois de começar algo com dinheiro (um controle, uma meta, uma reserva), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "semanas_segunda",
            "label": "Pulei uma vez e pensei \"segunda eu recomeço\"",
            "padrao": "progresso-sem-trilho",
            "tipo": "sinal"
          },
          {
            "value": "semanas_largando",
            "label": "Ficou chato e eu fui largando aos poucos",
            "padrao": "progresso-sem-trilho",
            "tipo": "sinal"
          },
          {
            "value": "semanas_trocou",
            "label": "Troquei a meta por uma maior e mais animada, e não fiz nenhuma",
            "padrao": "progresso-sem-trilho",
            "tipo": "sinal"
          },
          {
            "value": "semanas_tirei",
            "label": "Tirei o que tinha guardado para outra coisa",
            "padrao": "ganho-que-escorre",
            "tipo": "sinal"
          },
          {
            "value": "semanas_mantive",
            "label": "Mantive, mesmo nas semanas sem vontade",
            "padrao": "progresso-sem-trilho",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_circulo",
        "empurrao": "ganhar mais que o seu círculo",
        "padrao_principal": "dinheiro-nao-combina",
        "prompt": "Quando você teve a chance de ganhar mais que as pessoas do seu círculo (família, amigos, de onde você veio), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "circulo_desconforto",
            "label": "Senti um desconforto, como se aquilo não fosse para mim",
            "padrao": "dinheiro-nao-combina",
            "tipo": "sinal"
          },
          {
            "value": "circulo_escondi",
            "label": "Escondi ou diminuí o que estava ganhando",
            "padrao": "dinheiro-nao-combina",
            "tipo": "sinal"
          },
          {
            "value": "circulo_menos",
            "label": "Fiz menos do que podia, sem saber bem por quê",
            "padrao": "dinheiro-nao-combina",
            "tipo": "sinal"
          },
          {
            "value": "circulo_mostrar",
            "label": "Gastei para mostrar que eu estava bem",
            "padrao": "ganho-que-escorre",
            "tipo": "sinal"
          },
          {
            "value": "circulo_perto",
            "label": "Cresci e continuei perto de quem importa para mim",
            "padrao": "dinheiro-nao-combina",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      },
      {
        "id": "cena_pedido",
        "empurrao": "alguém próximo pede dinheiro",
        "padrao_principal": "caixa-da-familia",
        "prompt": "Quando alguém próximo pediu dinheiro (empréstimo, ajuda com uma conta, o seu nome ou o seu cartão), o que costumava acontecer?",
        "opcoes": [
          {
            "value": "pedido_sim",
            "label": "Disse sim na hora, mesmo sem poder",
            "padrao": "caixa-da-familia",
            "tipo": "sinal"
          },
          {
            "value": "pedido_nome",
            "label": "Emprestei o meu nome, CPF ou cartão",
            "padrao": "caixa-da-familia",
            "tipo": "sinal"
          },
          {
            "value": "pedido_culpa",
            "label": "Senti culpa só de pensar em dizer não",
            "padrao": "caixa-da-familia",
            "tipo": "sinal"
          },
          {
            "value": "pedido_calado",
            "label": "Emprestei sabendo que não ia voltar, e não falei nada",
            "padrao": "caixa-da-familia",
            "tipo": "sinal"
          },
          {
            "value": "pedido_limite",
            "label": "Ajudei dentro de um valor que eu já tinha decidido",
            "padrao": "caixa-da-familia",
            "tipo": "contra"
          }
        ],
        "nao_acontece": {
          "value": "nao_acontece",
          "label": "Isso não acontece comigo"
        }
      }
    ],
    "fatos": [
      {
        "id": "olhou",
        "label": "Quantas vezes você olhou o saldo e as contas com calma?",
        "direcao": 1,
        "opcoes": [
          {
            "value": 0,
            "label": "Nenhuma"
          },
          {
            "value": 1,
            "label": "Uma"
          },
          {
            "value": 2,
            "label": "Duas ou três"
          },
          {
            "value": 3,
            "label": "Toda semana"
          },
          {
            "value": 4,
            "label": "Quase todo dia"
          }
        ],
        "na": {
          "value": "na",
          "label": "Não se aplica"
        }
      },
      {
        "id": "preco_cheio",
        "label": "Quantas propostas ou pedidos você fez no preço que queria, sem desconto?",
        "direcao": 1,
        "opcoes": [
          {
            "value": 0,
            "label": "Nenhum"
          },
          {
            "value": 1,
            "label": "Um"
          },
          {
            "value": 2,
            "label": "Dois ou três"
          },
          {
            "value": 3,
            "label": "Quatro a seis"
          },
          {
            "value": 4,
            "label": "Mais de seis"
          }
        ],
        "na": {
          "value": "na",
          "label": "Não se aplica"
        }
      },
      {
        "id": "extra",
        "label": "Do último dinheiro a mais que entrou, quanto ainda existe?",
        "direcao": 1,
        "opcoes": [
          {
            "value": 0,
            "label": "Nada"
          },
          {
            "value": 1,
            "label": "Um pouco"
          },
          {
            "value": 2,
            "label": "Metade"
          },
          {
            "value": 3,
            "label": "A maior parte"
          },
          {
            "value": 4,
            "label": "Tudo"
          }
        ],
        "na": {
          "value": "na",
          "label": "Não se aplica"
        }
      },
      {
        "id": "pedido_amanha",
        "label": "Dos pedidos de dinheiro que recebeu, quantos você respondeu só no dia seguinte?",
        "direcao": 1,
        "opcoes": [
          {
            "value": 0,
            "label": "Nenhum"
          },
          {
            "value": 1,
            "label": "Um"
          },
          {
            "value": 2,
            "label": "Dois ou três"
          },
          {
            "value": 3,
            "label": "Quase todos"
          },
          {
            "value": 4,
            "label": "Todos"
          }
        ],
        "na": {
          "value": "na",
          "label": "Não se aplica"
        }
      },
      {
        "id": "sobrou",
        "label": "Nos últimos 3 meses, em quantos sobrou algo depois das contas fixas?",
        "direcao": 1,
        "opcoes": [
          {
            "value": 0,
            "label": "Nenhum"
          },
          {
            "value": 1,
            "label": "Um"
          },
          {
            "value": 2,
            "label": "Dois"
          },
          {
            "value": 3,
            "label": "Os três"
          },
          {
            "value": 4,
            "label": "Os três, e guardei"
          }
        ],
        "na": {
          "value": "na",
          "label": "Não se aplica"
        }
      }
    ],
    "cuidado": {
      "chao": {
        "prompt": "Antes de começar, um olhar rápido para o chão.",
        "itens": [
          {
            "id": "contas",
            "label": "As contas do mês fecham?",
            "opcoes": [
              {
                "value": "fecham",
                "label": "Fecham"
              },
              {
                "value": "apertado",
                "label": "Fecham, mas no aperto"
              },
              {
                "value": "nao_fecham",
                "label": "Não fecham"
              }
            ]
          },
          {
            "id": "divida",
            "label": "Você tem dívida cara hoje (rotativo do cartão, cheque especial, contas atrasadas)?",
            "opcoes": [
              {
                "value": "nao",
                "label": "Não"
              },
              {
                "value": "sim",
                "label": "Sim"
              }
            ]
          },
          {
            "id": "risco",
            "label": "Você usa dinheiro das contas do mês para arriscar (apostas, operações, investimentos)?",
            "opcoes": [
              {
                "value": "nao",
                "label": "Não"
              },
              {
                "value": "as_vezes",
                "label": "Às vezes"
              },
              {
                "value": "sim",
                "label": "Sim"
              }
            ]
          }
        ],
        "alerta": {
          "contas": [
            "nao_fecham"
          ],
          "divida": [
            "sim"
          ],
          "risco": [
            "as_vezes",
            "sim"
          ]
        }
      },
      "humor": {
        "ativo": true,
        "prompt": "Nas últimas duas semanas, com que frequência...",
        "itens": [
          {
            "id": "interesse",
            "label": "...você teve pouco interesse ou pouco prazer nas coisas?"
          },
          {
            "id": "animo",
            "label": "...você se sentiu para baixo ou sem esperança?"
          }
        ],
        "opcoes": [
          {
            "value": 0,
            "label": "Nenhum dia"
          },
          {
            "value": 1,
            "label": "Alguns dias"
          },
          {
            "value": 2,
            "label": "Mais da metade dos dias"
          },
          {
            "value": 3,
            "label": "Quase todos os dias"
          }
        ]
      },
      "sinais_risco": {
        "prompt": "Algum destes acontece com você hoje?",
        "exclusiva": "nenhum",
        "ajuda": [
          "apostar_sem_parar",
          "recuperar_perda",
          "esconder",
          "comprar_sem_parar",
          "nada_vai_melhorar"
        ],
        "opcoes": [
          {
            "value": "apostar_sem_parar",
            "label": "Apostar (inclusive em bets) ou operar sem conseguir parar"
          },
          {
            "value": "recuperar_perda",
            "label": "Voltar para recuperar o que perdi"
          },
          {
            "value": "esconder",
            "label": "Esconder de alguém quanto aposto, opero ou gasto"
          },
          {
            "value": "comprar_sem_parar",
            "label": "Comprar sem conseguir parar, mesmo sem precisar"
          },
          {
            "value": "nada_vai_melhorar",
            "label": "Sentir que nada vai melhorar"
          },
          {
            "value": "nenhum",
            "label": "Nenhum destes"
          }
        ]
      },
      "textos": {
        "ajuda": {
          "titulo": "Neste momento, o mais importante é conversar com alguém",
          "paragrafos": [
            "Pelo que você marcou, uma reflexão sobre padrões não é o que ajuda agora. Este material não trata compulsão nem sofrimento, e não propõe um plano de romper nada.",
            "Se você está sofrendo ou sente que nada vai melhorar, procure uma pessoa de confiança e um serviço de saúde. No Brasil: CVV, telefone 188 (24 horas, gratuito); SAMU, 192, em caso de risco imediato; CAPS e a rede pública de saúde, pelo posto de saúde mais perto de você."
          ]
        },
        "chao_primeiro": {
          "titulo": "O chão primeiro",
          "paragrafos": [
            "Pelo que você marcou, o primeiro trabalho é firmar o chão: as contas do mês, a dívida cara e o dinheiro que não deve entrar em risco. Só depois faz sentido olhar para padrões."
          ]
        },
        "aviso_humor": "Você marcou que as últimas semanas foram pesadas. Pode seguir, em um ritmo menor, e vale conversar com alguém de confiança. O CVV atende pelo 188, a qualquer hora, e o CAPS pode ser procurado pelo posto de saúde mais perto de você.",
        "rascunho": false
      }
    },
    "telas": {
      "espelho": {
        "prompt": "Qual destes é o seu teto hoje?",
        "nenhum": {
          "value": "nenhum",
          "label": "Nenhum destes"
        },
        "nenhum_domina": "Nenhum padrão domina nas suas respostas. Dá para seguir assim ou voltar às cenas."
      },
      "custo": {
        "prompt": "Destas coisas que você marcou, qual te custou mais no último ano? Pode ser dinheiro, uma oportunidade ou a sua paz.",
        "nenhuma": {
          "value": "nenhuma",
          "label": "Nenhuma me custou de verdade"
        }
      },
      "variante": {
        "passo-que-nao-sai": {
          "prompt": "O que te para mais?",
          "opcoes": [
            {
              "value": "medo-de-errar",
              "label": "O medo de errar"
            },
            {
              "value": "nao-estou-pronto",
              "label": "A sensação de não estar pronto"
            }
          ]
        },
        "decisao-no-calor": {
          "prompt": "O que pesa mais na hora?",
          "opcoes": [
            {
              "value": "emocao-do-momento",
              "label": "A emoção do momento"
            },
            {
              "value": "virar-o-jogo",
              "label": "A vontade de virar o jogo"
            }
          ]
        }
      },
      "renda": {
        "prompt": "Como o dinheiro costuma entrar para você?",
        "opcoes": [
          {
            "value": "fixa",
            "label": "Num valor e numa data fixos (salário)"
          },
          {
            "value": "variavel",
            "label": "Em valores e datas que mudam (autônomo, vendas, comissão)"
          },
          {
            "value": "mista",
            "label": "Uma parte fixa e outra variável"
          }
        ]
      },
      "clima_casa": {
        "prompt": "Como era o clima do dinheiro na casa em que você cresceu?",
        "opcoes": [
          {
            "value": "faltava",
            "label": "Faltava, e era aperto"
          },
          {
            "value": "segredo",
            "label": "Era segredo, não se falava"
          },
          {
            "value": "briga",
            "label": "Era motivo de briga"
          },
          {
            "value": "valor",
            "label": "Mostrava quem valia mais"
          },
          {
            "value": "tranquilo",
            "label": "Era organizado e tranquilo"
          },
          {
            "value": "outro",
            "label": "Outro (escrever)"
          }
        ],
        "ajuda": "Só o clima em geral. Não precisa lembrar de nenhuma cena difícil, e o resto pode ficar em branco.",
        "complemento": {
          "prompt": "Se quiser, diga em uma frase como era (opcional).",
          "placeholder": "Ex.: dinheiro era assunto de adulto, ninguém explicava.",
          "max": 200
        }
      },
      "terreno": {
        "prompt": "Como o seu dia já vinha antes?",
        "exclusiva": "nada",
        "opcoes": [
          {
            "value": "cansaco",
            "label": "Cansaço"
          },
          {
            "value": "estresse",
            "label": "Estresse"
          },
          {
            "value": "briga",
            "label": "Uma briga ou discussão"
          },
          {
            "value": "comparacao",
            "label": "Comparação (redes, conhecidos)"
          },
          {
            "value": "mes_apertado",
            "label": "Mês apertado"
          },
          {
            "value": "nada",
            "label": "Nada disso"
          }
        ],
        "ajuda": "Pode marcar mais de um."
      },
      "sinais": {
        "prompt": "O que você notou primeiro, no corpo ou na cabeça?",
        "outro": {
          "value": "outro",
          "label": "Outro (escrever)"
        },
        "ajuda": "Marque o que veio primeiro. Se foi outra coisa, escreva abaixo.",
        "complemento": {
          "prompt": "Se marcou “Outro (escrever)”, diga qual foi, com as suas palavras.",
          "placeholder": "Ex.: calor no rosto.",
          "max": 200
        }
      },
      "alivio": {
        "prompt": "O que esse movimento tirou de você na hora?",
        "opcoes": [
          {
            "value": "ansiedade",
            "label": "Ansiedade"
          },
          {
            "value": "vergonha",
            "label": "Vergonha"
          },
          {
            "value": "culpa",
            "label": "Culpa"
          },
          {
            "value": "tedio",
            "label": "Tédio"
          },
          {
            "value": "medo_nao",
            "label": "O medo de ouvir um não"
          },
          {
            "value": "medo_perder",
            "label": "O medo de perder a chance"
          },
          {
            "value": "nada",
            "label": "Nada que eu perceba"
          }
        ],
        "ajuda": "Escolha o que mais se aproxima.",
        "complemento": {
          "prompt": "Quer dizer em poucas palavras? (opcional)",
          "placeholder": "Ex.: o aperto passou na hora.",
          "max": 200
        }
      },
      "para_que": {
        "prompt": "Se naquela vez tivesse dado certo até o fim, o que você teria que enfrentar?",
        "opcoes": [
          {
            "value": "responsabilidade",
            "label": "Mais responsabilidade"
          },
          {
            "value": "ser_testado",
            "label": "Ser cobrado ou testado"
          },
          {
            "value": "afastar",
            "label": "Me afastar de quem eu gosto"
          },
          {
            "value": "perder",
            "label": "Perder o que eu já tenho"
          },
          {
            "value": "ouvir_nao",
            "label": "Ouvir um não"
          },
          {
            "value": "nao_sei",
            "label": "Não sei"
          }
        ],
        "ajuda": "Escolha o que mais se aproxima.",
        "complemento": {
          "prompt": "Quer dizer com as suas palavras? (opcional)",
          "placeholder": "Ex.: ter que sustentar um preço mais alto.",
          "max": 200
        }
      },
      "desconforto": {
        "prompt": "O próximo passo vai trazer de volta o que esse movimento tirava de você. Topa levar isso junto por 7 dias?",
        "opcoes": [
          {
            "value": "sim",
            "label": "Topo"
          },
          {
            "value": "em_parte",
            "label": "Em parte"
          },
          {
            "value": "nao",
            "label": "Agora não (começa um degrau abaixo)"
          }
        ],
        "modelo_alivio": "O próximo passo vai trazer de volta o que esse movimento tirava de você: {alivio}. Topa levar isso junto por 7 dias?"
      },
      "desgrudar": {
        "prompt": "Como soa agora?",
        "opcoes": [
          {
            "value": "menos_forca",
            "label": "Perde um pouco da força"
          },
          {
            "value": "igual",
            "label": "Continua igual"
          },
          {
            "value": "mais_forte",
            "label": "Fica mais forte"
          }
        ],
        "modelo": "Estou tendo o pensamento de que “{frase}”.",
        "ajuda": "Dizer assim ajuda a ver o pensamento como um pensamento, e não como um fato."
      },
      "frases_grade": {
        "prompt": "Quanto esta frase soa verdadeira para você hoje?",
        "opcoes": [
          {
            "value": 0,
            "label": "Não soa"
          },
          {
            "value": 1,
            "label": "Um pouco"
          },
          {
            "value": 2,
            "label": "Bastante"
          },
          {
            "value": 3,
            "label": "Muito"
          }
        ]
      },
      "triade": {
        "prompt": "Das três frases, qual soa mais verdadeira para você e qual soa menos, mesmo que você saiba que não deveria?",
        "prompt_seguinte": "E nestas três: qual soa mais verdadeira e qual soa menos?",
        "mais": "Soa mais verdadeira",
        "menos": "Soa menos verdadeira"
      },
      "experimento": {
        "outro": {
          "value": "outro",
          "label": "Escrever o meu"
        },
        "prompt": "Qual será o seu primeiro experimento?",
        "ajuda": "Ele vai testar a previsão da regra antiga: “{previsao}”.",
        "ajuda_menor": "Pelo que você respondeu até aqui, o dia 3 começa com um passo menor, que não tem como falhar: {degrau0}. O experimento que você escolher agora fica para o dia 5.",
        "complemento": {
          "prompt": "O seu experimento, com as suas palavras (vale se você escolheu “Escrever o meu”).",
          "placeholder": "Ex.: dizer o preço em voz alta antes da proposta.",
          "max": 200
        }
      },
      "fatos": {
        "prompt": "Olhando só para os últimos 30 dias:"
      },
      "seguranca_escrita": "Se isto pesar, pare por aqui: o CVV atende pelo 188, a qualquer hora.",
      "cena": {
        "prompt": "Pense na última vez em que isso aconteceu. Quando foi, o que estava acontecendo e qual era o valor aproximado?",
        "ajuda": "Só os fatos, em até 400 caracteres: o que você sentiu vem nas próximas telas. Se der, diga também o que estava indo bem ou perto de melhorar.",
        "placeholder": "Ex.: em março, mandei o orçamento de R$ 8 mil para um cliente grande, no mesmo mês em que fechei um contrato bom.",
        "max": 400
      },
      "frase": {
        "prompt": "Que frase passou pela sua cabeça naquela hora?",
        "ajuda": "A frase como veio, sem corrigir.",
        "placeholder": "Ex.: vão achar caro.",
        "max": 200
      },
      "ponto_escolha": {
        "prompt": "Teve um instante em que dava para ir por outro caminho. O que você fez ali?",
        "ajuda": "O que você fez, sem julgar: é nesse instante que o seu plano vai mirar.",
        "placeholder": "Ex.: adiei e mandei com desconto.",
        "max": 300
      },
      "custo_depois": {
        "prompt": "E o que isso custou depois? Pode ser dinheiro, uma oportunidade ou como você se sentiu.",
        "ajuda": "Pode ser pouco ou muito. O que importa é o que foi de verdade.",
        "placeholder": "Ex.: perdi a margem do projeto e fiquei com raiva de mim.",
        "max": 300
      },
      "excecao": {
        "prompt": "Lembre de uma vez em que esse padrão apareceu e não venceu, nem que um pouco. O que foi diferente?",
        "ajuda": "Se não lembrar de nenhuma, pode deixar em branco.",
        "placeholder": "Ex.: cobrei o valor cheio de um cliente que me indicou.",
        "max": 300
      },
      "regra_antiga": {
        "prompt": "A frase daquela vez e esta, que você marcou como verdadeira, parecem a mesma regra? Escolha a que mais se parece com a sua regra antiga, ou escreva a sua.",
        "ajuda": "A regra antiga é o que você aprendeu a fazer para se proteger. Ela fez sentido em algum momento.",
        "outra": {
          "value": "outra",
          "label": "Escrever a minha"
        },
        "complemento": {
          "prompt": "A regra com as suas palavras (vale se você escolheu “Escrever a minha”).",
          "placeholder": "Ex.: se eu cobrar o preço cheio, ele some.",
          "max": 200
        }
      },
      "regra_origem": {
        "prompt": "Se quiser: onde você aprendeu essa regra, e em que época ela fez sentido?",
        "ajuda": "É opcional, e não precisa lembrar de nada difícil.",
        "placeholder": "Ex.: com os meus pais, quando o dinheiro era curto.",
        "max": 300
      },
      "previsao": {
        "prompt": "Se você fizer o contrário do que essa regra manda, o que ela diz que vai acontecer?",
        "ajuda": "Escreva a previsão da regra, mesmo que você já duvide dela.",
        "placeholder": "Ex.: o cliente some.",
        "max": 300,
        "complemento": {
          "prompt": "De 0 a 100%, quanto você acredita nessa previsão agora?",
          "ends": {
            "min": "Nada",
            "max": "Totalmente"
          }
        }
      },
      "dia_um_ano": {
        "prompt": "Imagine um dia comum daqui a um ano, em que esse teto já subiu. O que está diferente? Quem está com você?",
        "ajuda": "Um dia comum, com detalhes pequenos.",
        "placeholder": "Ex.: acordo sem a pressa do fim do mês e almoço com a minha filha.",
        "max": 400
      },
      "importancia": {
        "prompt": "De 0 a 10, quanto importa para você mudar isso agora?",
        "ends": {
          "min": "Nada",
          "max": "Muito"
        },
        "complemento": {
          "prompt": "Por que esse número, e não um menor? (opcional)",
          "placeholder": "Ex.: porque eu quero parar de adiar o que importa.",
          "max": 300
        }
      },
      "regra_trabalho": {
        "prompt": "Reescreva a regra antiga de um jeito que sirva a esse dia daqui a um ano.",
        "ajuda": "Precisa ser algo que você topa testar por 7 dias, não algo em que você já acredite.",
        "exemplo": "Se travar, um exemplo: “{exemplo}”.",
        "placeholder": "Ex.: cobrar o justo é o que me deixa atender bem.",
        "max": 160
      },
      "se_entao": {
        "prompt": "Escreva o seu “se, então”: quando você notar o sinal, o que vai fazer?",
        "ajuda": "Uma frase só, do jeito que soar natural, e uma meta só. O rascunho vem das suas respostas: reescreva como quiser.",
        "exemplo": "Exemplo do padrão: “{exemplo}”.",
        "max": 280
      },
      "confianca": {
        "prompt": "De 0 a 10, quanto você confia que vai fazer esse experimento?",
        "ends": {
          "min": "Nada",
          "max": "Totalmente"
        },
        "complemento": {
          "prompt": "O que faria essa confiança subir 1 ponto? (opcional)",
          "placeholder": "Ex.: combinar com alguém que vai perguntar como foi.",
          "max": 300
        }
      },
      "proximas_24h": {
        "prompt": "Quais são os seus primeiros passos nas próximas 24 horas, e quando?",
        "ajuda": "O primeiro passo e a hora em que ele acontece.",
        "placeholder": "Ex.: amanhã, às 9h, escrevo o preço e mando a mensagem.",
        "max": 300
      }
    },
    "retornos": {
      "comum": {
        "seguranca": "Se isto pesar, pare por aqui: o CVV atende pelo 188, a qualquer hora.",
        "deslize_intro": "Deslize não é recaída. São 90 segundos e um passo menor, sem nota e sem sequência.",
        "deslize_fecho": "O plano travou, e você usou os 90 segundos. O próximo passo ficou pela metade: {metade}.",
        "proximo": "O próximo retorno é o {retorno}, em {data}.",
        "proximo_volta": "No dia 90, em {data}, vem a volta curta, com o antes e o depois.",
        "sem_data": "Quando os sinais voltarem, a volta curta está aqui, a qualquer momento.",
        "registrado": "O que você registrou",
        "daqui": "Daqui para a frente",
        "rotulo_arquivo": "teto-financeiro",
        "rascunho": false
      },
      "dia3": {
        "titulo": "Retorno do dia 3",
        "perguntas": [
          {
            "id": "fez",
            "tipo": "choice",
            "prompt": "Você fez o experimento?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Fiz"
              },
              {
                "value": "em_parte",
                "label": "Fiz em parte"
              },
              {
                "value": "nao",
                "label": "Não fiz"
              }
            ]
          },
          {
            "id": "aconteceu",
            "tipo": "write",
            "prompt": "O que a regra antiga previa, e o que aconteceu?",
            "prompt_previsao": "A regra antiga previa: “{previsao}”. O que aconteceu?",
            "prompt_nao": "O que atrapalhou?",
            "placeholder": "Escreva com as suas palavras.",
            "max": 400
          },
          {
            "id": "crenca",
            "tipo": "scale",
            "prompt": "Quanto você acredita na previsão agora?",
            "min": 0,
            "max": 100,
            "step": 10,
            "ends": {
              "min": "Nada",
              "max": "Totalmente"
            }
          }
        ],
        "resultado": {
          "verdict": "Dia 3 anotado",
          "fez": {
            "sim": "Você fez o experimento. Isso conta, qualquer que tenha sido o resultado.",
            "em_parte": "Você fez uma parte. Uma parte também é evidência.",
            "nao": "Desta vez você não fez. Sem julgamento: o que atrapalhou também é informação, e o dia 5 é outra chance."
          },
          "previsao": "A previsão era: “{previsao}”.",
          "crenca_antes": "Você acreditava nela em {antes}% e agora acredita em {agora}%.",
          "crenca_agora": "Hoje você acredita nela em {agora}%.",
          "crenca": {
            "subiu": "A crença subiu.",
            "igual": "A crença ficou onde estava.",
            "caiu": "A crença caiu."
          }
        },
        "rascunho": false
      },
      "dia7": {
        "titulo": "Retorno do dia 7",
        "perguntas": [
          {
            "id": "travou",
            "tipo": "choice",
            "prompt": "O plano travou em algum ponto?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ]
          },
          {
            "id": "deslize_fato",
            "tipo": "write",
            "prompt": "O que aconteceu, sem adjetivo?",
            "placeholder": "Ex.: mandei a proposta com desconto na terça.",
            "max": 400,
            "so_se": "travou"
          },
          {
            "id": "deslize_gentileza",
            "tipo": "write",
            "prompt": "Uma frase de gentileza consigo, como você diria a um amigo.",
            "placeholder": "Ex.: Foi uma semana pesada, e você fez o que deu.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "deslize_bem",
            "tipo": "write",
            "prompt": "Uma coisa que você já fez bem nessas semanas.",
            "placeholder": "Ex.: percebi o aperto antes de responder.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "deslize_metade",
            "tipo": "write",
            "prompt": "O próximo passo, pela metade do tamanho.",
            "ajuda": "Se não souber por onde começar, o passo que não tem como falhar é: {degrau0}.",
            "placeholder": "Ex.: escrever o preço, sem mandar.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "acertou",
            "tipo": "choice",
            "prompt": "A regra antiga acertou?",
            "prompt_previsao": "A previsão era: “{previsao}”. Ela acertou?",
            "opcoes": [
              {
                "value": "acertou",
                "label": "Acertou"
              },
              {
                "value": "em_parte",
                "label": "Em parte"
              },
              {
                "value": "errou",
                "label": "Errou"
              }
            ]
          },
          {
            "id": "crenca",
            "tipo": "scale",
            "prompt": "Quanto você acredita nela agora?",
            "min": 0,
            "max": 100,
            "step": 10,
            "ends": {
              "min": "Nada",
              "max": "Totalmente"
            }
          },
          {
            "id": "passo",
            "tipo": "choice",
            "prompt": "O passo dos próximos 7 dias:",
            "opcoes": [
              {
                "value": "mantem",
                "label": "Mantenho"
              },
              {
                "value": "sobe",
                "label": "Subo um degrau"
              },
              {
                "value": "desce",
                "label": "Desço um degrau"
              }
            ]
          }
        ],
        "resultado": {
          "verdict": "Dia 7 anotado",
          "travou": {
            "sim": "O plano travou em algum ponto, e isso é parte do caminho.",
            "nao": "O plano andou sem travar."
          },
          "acertou": {
            "acertou": "A regra antiga acertou desta vez. Vale olhar o que ela estava protegendo.",
            "em_parte": "A regra antiga acertou em parte.",
            "errou": "A regra antiga errou desta vez: a previsão não se confirmou."
          },
          "passo": {
            "mantem": "Os próximos 7 dias seguem no mesmo degrau.",
            "sobe": "Os próximos 7 dias sobem um degrau.",
            "desce": "Os próximos 7 dias descem um degrau, para o passo caber na semana."
          },
          "crenca_antes": "Você acreditava nela em {antes}% e agora acredita em {agora}%.",
          "crenca_agora": "Hoje você acredita nela em {agora}%.",
          "crenca": {
            "subiu": "A crença subiu.",
            "igual": "A crença ficou onde estava.",
            "caiu": "A crença caiu."
          }
        },
        "rascunho": false
      },
      "dia30": {
        "titulo": "Retorno do dia 30",
        "perguntas": [
          {
            "id": "travou",
            "tipo": "choice",
            "prompt": "O plano travou em algum ponto?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ]
          },
          {
            "id": "deslize_fato",
            "tipo": "write",
            "prompt": "O que aconteceu, sem adjetivo?",
            "placeholder": "Ex.: mandei a proposta com desconto na terça.",
            "max": 400,
            "so_se": "travou"
          },
          {
            "id": "deslize_gentileza",
            "tipo": "write",
            "prompt": "Uma frase de gentileza consigo, como você diria a um amigo.",
            "placeholder": "Ex.: Foi uma semana pesada, e você fez o que deu.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "deslize_bem",
            "tipo": "write",
            "prompt": "Uma coisa que você já fez bem nessas semanas.",
            "placeholder": "Ex.: percebi o aperto antes de responder.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "deslize_metade",
            "tipo": "write",
            "prompt": "O próximo passo, pela metade do tamanho.",
            "ajuda": "Se não souber por onde começar, o passo que não tem como falhar é: {degrau0}.",
            "placeholder": "Ex.: escrever o preço, sem mandar.",
            "max": 300,
            "so_se": "travou"
          },
          {
            "id": "fatos",
            "tipo": "grade",
            "prompt": "Os fatos dos últimos 30 dias, de novo."
          },
          {
            "id": "vazamento",
            "tipo": "choice",
            "prompt": "O vazamento em observação apareceu?",
            "prompt_nome": "O vazamento em observação (“{nome}”) apareceu?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "um_pouco",
                "label": "Um pouco"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ],
            "so_se": "vazamento"
          }
        ],
        "resultado": {
          "verdict": "Dia 30 anotado",
          "travou": {
            "sim": "O plano travou em algum ponto, e você usou os 90 segundos.",
            "nao": "O plano andou sem travar."
          },
          "fatos_titulo": "Os fatos, contra o dia 0",
          "vazamento": {
            "sim": "O vazamento apareceu. É o alvo da próxima volta.",
            "um_pouco": "O vazamento apareceu um pouco. Vale seguir observando.",
            "nao": "O vazamento não apareceu nestes 30 dias."
          }
        },
        "rascunho": false
      },
      "dia90": {
        "titulo": "Volta dos 90 dias",
        "perguntas": [],
        "rascunho": false
      },
      "sinais": {
        "titulo": "Volta nos sinais",
        "perguntas": [],
        "rascunho": false
      },
      "semana": {
        "titulo": "Revisão da semana",
        "perguntas": [
          {
            "id": "sinal",
            "tipo": "choice",
            "prompt": "O sinal apareceu?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ]
          },
          {
            "id": "cedo",
            "tipo": "choice",
            "prompt": "Você percebeu mais cedo?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "igual",
                "label": "Igual"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ]
          },
          {
            "id": "se_entao",
            "tipo": "choice",
            "prompt": "Você fez o \"se, então\"?",
            "opcoes": [
              {
                "value": "sim",
                "label": "Sim"
              },
              {
                "value": "em_parte",
                "label": "Em parte"
              },
              {
                "value": "nao",
                "label": "Não"
              }
            ]
          },
          {
            "id": "previu",
            "tipo": "write",
            "prompt": "O que a regra antiga previu, e o que aconteceu?",
            "prompt_previsao": "A regra antiga previu: “{previsao}”. O que aconteceu?",
            "placeholder": "Pode deixar em branco.",
            "max": 400,
            "opcional": true
          }
        ],
        "resultado": {
          "verdict": "Revisão da semana feita",
          "sinal": {
            "sim": "O sinal apareceu. Perceber já é o primeiro passo.",
            "nao": "O sinal não apareceu nesta semana."
          },
          "cedo": {
            "sim": "Você percebeu mais cedo. Esse é o progresso.",
            "igual": "Você percebeu no mesmo ponto de sempre.",
            "nao": "Desta vez você percebeu mais tarde. Sem julgamento: anote em que ponto percebeu."
          },
          "se_entao": {
            "sim": "Você fez o \"se, então\".",
            "em_parte": "Você fez o \"se, então\" em parte.",
            "nao": "O \"se, então\" ficou para a próxima."
          },
          "nota": "Deslize não é recaída: progresso é perceber mais cedo e voltar mais rápido.",
          "privacidade": "Esta revisão só guarda a data. Nenhuma das respostas acima fica guardada.",
          "sinais_voltaram": "Se o padrão venceu de novo, ou apareceram dois sinais na mesma semana, vale fazer a volta curta."
        },
        "rascunho": false
      },
      "continuar": {
        "titulo": "Continuar de onde parou",
        "perguntas": [],
        "rascunho": false
      },
      "volta": {
        "motivo": {
          "prompt": "O que trouxe você de volta?",
          "ajuda": "A última volta foi em {data}.",
          "ajuda_sem_data": "Quando quiser olhar de novo, esta volta leva uns 12 minutos.",
          "opcoes": [
            {
              "value": "venceu",
              "label": "O padrão venceu de novo"
            },
            {
              "value": "dois_sinais",
              "label": "Dois sinais na mesma semana"
            },
            {
              "value": "olhar",
              "label": "Quero olhar de novo, por conta própria"
            }
          ]
        },
        "fatos": {
          "prompt": "Os fatos dos últimos 30 dias, de novo.",
          "ajuda": "As mesmas cinco contagens do dia 0, para comparar. Se uma não se aplica, marque “Não se aplica”."
        },
        "fatos_retro": {
          "prompt": "Olhando de hoje: como foram os 30 dias antes do dia 0?",
          "ajuda": "Responda de novo as cinco contagens, só que sobre o período antes do dia 0 e com o olhar de hoje. Assim dá para separar “eu mudei” de “mudou o meu jeito de medir”."
        },
        "mesmo_teto": {
          "prompt": "É o mesmo teto?",
          "ajuda": "Da última vez, o seu teto foi {nome}.",
          "ajuda_frases": " Você marcou: {frases}.",
          "opcoes": {
            "sim": "Sim, é o mesmo: {nome}",
            "outro": "Não, é outro. Quero rever as cenas",
            "nenhum": "Nenhum teto agora"
          }
        },
        "frases_agora": {
          "prompt": "Estas frases ainda soam assim?",
          "ajuda": "São as que mais soavam verdadeiras para você. Responda como soam hoje."
        },
        "refazer": {
          "prompt": "Quer refazer as cinco frases do começo?",
          "opcoes": {
            "nao": "Não, seguir com estas",
            "sim": "Sim, refazer as frases"
          }
        },
        "previsao_acertou": {
          "prompt": "Desde a última vez, a previsão acertou?",
          "prompt_previsao": "A previsão era: “{previsao}”. Desde a última vez, ela acertou?",
          "opcoes": {
            "acertou": "Acertou",
            "em_parte": "Acertou em parte",
            "errou": "Errou"
          },
          "crenca": {
            "prompt": "Quanto você acredita nela hoje?",
            "ends": {
              "min": "Nada",
              "max": "Totalmente"
            }
          }
        },
        "regra_decisao": {
          "prompt": "A regra de trabalho continua servindo?",
          "ajuda": "Hoje ela diz: “{regra}”.",
          "opcoes": {
            "manter": "Manter como está",
            "reescrever": "Reescrever"
          }
        },
        "grupos": {
          "seguranca": "Antes de começar",
          "fatos": "Os fatos",
          "teto": "O teto",
          "frases": "As frases",
          "ultima": "A nova última vez",
          "regra": "A regra",
          "plano": "O plano"
        },
        "resultado": {
          "eyebrow": "A sua volta",
          "verdict": "Volta {n} anotada",
          "verdict_nenhum": "Nenhum teto agora",
          "corpo_nenhum": "Você disse que, agora, nenhum teto pesa. Isso também é um resultado: o que mudou desde a última volta está abaixo. Se os sinais voltarem, a volta curta está aqui.",
          "antes_depois": "O antes e o depois",
          "voltas": "Esta é a sua volta número {n}.",
          "voltas_primeira": "Esta é a sua primeira volta.",
          "padrao_mesmo": "O mesmo teto: {nome}.",
          "padrao_outro": "Antes: {antes}. Agora: {agora}.",
          "padrao_nenhum": "Antes: {antes}. Agora: nenhum teto pesa.",
          "fatos_titulo": "Os fatos",
          "fato": "{rotulo} Antes: {antes}. Agora: {agora} ({leitura}).",
          "fato_retro": "{rotulo} No dia 0 você marcou “{antes}”. Olhando de hoje, você diria “{retro}”. Agora: “{agora}”. Mudou a régua: por isso aparecem os três.",
          "fato_sem_base": "{rotulo} Agora: {agora}. Não há base para comparar.",
          "leitura": {
            "melhor": "melhor",
            "pior": "pior",
            "igual": "igual"
          },
          "frases_titulo": "As frases",
          "frase_nivel": "“{texto}” Antes: {antes}. Agora: {agora} ({leitura}).",
          "frase_qualitativa": "“{texto}” Era das frases que mais soavam verdadeiras. Agora soa: {agora}.",
          "frase_sem_base": "“{texto}” Sem base para comparar.",
          "leitura_frase": {
            "menos": "soa menos",
            "igual": "soa igual",
            "mais": "soa mais"
          },
          "familia_titulo": "A crença que mais pesa",
          "familia": "Antes: {antes}. Agora: {agora}.",
          "familia_nenhuma": "nenhuma se destacou",
          "sinais_titulo": "Os seus sinais",
          "sinais": "Na última vez você marcou {antes} sinais. Agora, {agora}.",
          "crenca_titulo": "A crença na previsão",
          "crenca": "Ao longo das voltas: {serie}.",
          "previsao_acertou": {
            "acertou": "A previsão acertou desde a última vez.",
            "em_parte": "A previsão acertou em parte desde a última vez.",
            "errou": "A previsão não se confirmou desde a última vez."
          },
          "plano_ajustado": "O plano continua, com o passo ajustado pelo que aconteceu.",
          "cuidado_eyebrow": "A sua volta"
        },
        "rascunho": false
      }
    },
    "planos": {
      "arco7": [
        {
          "dia": 1,
          "rotulo": "Perceber",
          "texto": "Conte o sinal e anote o terreno do dia. Use \"lá vem {nome}\".",
          "extra": {
            "familias": [
              "evitar",
              "vigilancia"
            ],
            "texto": "Reserve 5 minutos para olhar saldo e fatura, sem decidir nada."
          }
        },
        {
          "dia": 2,
          "rotulo": "Preparar",
          "texto": "Deixe o \"se, então\" à vista, leia a regra de trabalho e faça o que sobe 1 ponto na sua confiança. Combine consigo o que fazer em um dia de terreno ruim."
        },
        {
          "dia": 3,
          "rotulo": "Experimento",
          "por_degrau": "dia3",
          "texto": "{dia3}. Antes, escreva o que a regra antiga prevê; depois, o que aconteceu."
        },
        {
          "dia": 4,
          "rotulo": "Repetir e abrir espaço",
          "texto": "Repita o passo do dia 3. Anote o desconforto de 0 a 10 antes e uma hora depois."
        },
        {
          "dia": 5,
          "rotulo": "Experimento",
          "por_degrau": "dia5",
          "texto": "{dia5}. Antes, a previsão; depois, o que aconteceu."
        },
        {
          "dia": 6,
          "rotulo": "Apoio",
          "texto": "Conte a regra de trabalho a alguém de confiança, ou faça o passo junto. Use a exceção de propósito."
        },
        {
          "dia": 7,
          "rotulo": "Revisar",
          "texto": "O plano travou em algum ponto? A regra antiga acertou? Quanto você acredita nela agora, de 0 a 100? Reescreva a regra de trabalho se a evidência pedir e escolha o foco dos 90 dias."
        }
      ],
      "rotulo_por_degrau": {
        "0": "Passo pequeno",
        "1": "Experimento 1",
        "2": "Experimento 2"
      },
      "noventa": {
        "foco": "Um foco só nos 90 dias: {noventa}.",
        "etapas": [
          {
            "rotulo": "Semanas 2 a 4",
            "de": 8,
            "ate": 30,
            "texto": "Repita o degrau 2 em situações novas e monte o degrau 3."
          },
          {
            "rotulo": "Semanas 5 a 13",
            "de": 31,
            "ate": 90,
            "texto": "O degrau 3 roda como sistema."
          }
        ],
        "ritual_semanal": "Ritual semanal de 10 minutos: o sinal apareceu? Percebi mais cedo? Fiz o \"se, então\"? O que a regra antiga previu e o que aconteceu?",
        "revisoes": [
          {
            "dia": 30,
            "pergunta": "O plano travou? Os fatos dos últimos 30 dias mudaram? O vazamento em observação apareceu?"
          },
          {
            "dia": 60,
            "pergunta": "O degrau 3 está rodando? O que precisa de ajuste?"
          },
          {
            "dia": 90,
            "pergunta": "Volta curta: os fatos, as frases e como você se via no dia 0, olhando de hoje."
          }
        ]
      },
      "deslize": {
        "titulo": "Se o plano travou",
        "pergunta": "O plano travou em algum ponto?",
        "noventa_segundos": [
          "O que aconteceu, sem adjetivo.",
          "Uma frase de gentileza consigo, como você diria a um amigo.",
          "Uma coisa que você já fez bem nessas semanas."
        ],
        "passo": "O próximo passo, pela metade do tamanho.",
        "nota": "Deslize não é recaída: progresso é perceber mais cedo e voltar mais rápido."
      },
      "gerais_nenhum": {
        "titulo": "Um plano curto de revisão",
        "passos": [
          "Anote, nas próximas duas semanas, se alguma das cenas do mapa aconteceu.",
          "Volte aqui quando um dos sinais gerais aparecer."
        ]
      },
      "chao_primeiro": {
        "titulo": "O chão primeiro",
        "arco7": [
          "Dia 1: liste as contas do mês, com valor e data.",
          "Dia 3: separe o que é essencial do que pode esperar.",
          "Dia 5: olhe a dívida cara e anote o que ela custa por mês.",
          "Dia 7: escolha uma conversa a ter com o credor ou com alguém de confiança."
        ],
        "noventa": "Nos 90 dias: organize o essencial, uma dívida de cada vez, e mantenha dinheiro de risco fora das contas do mês."
      },
      "rascunho": false
    },
    "textos": {
      "abertura": {
        "titulo": "O que segura o seu dinheiro?",
        "paragrafos": [
          "Ato 1 (8 min): escolhas rápidas para achar o seu padrão, um exercício de 60 segundos e uma trava imediata. Ato 2 (15 min, opcional): escrita curta para mapear a última vez e montar os planos de 7 e 90 dias. Você pode parar entre os dois e voltar.",
          "Material educacional sobre hábitos com dinheiro. Não é diagnóstico, avaliação psicológica nem recomendação de investimento."
        ]
      },
      "sessenta_segundos": {
        "titulo": "Os 60 segundos",
        "passos": [
          {
            "id": "nomear",
            "texto": "Nomeie: \"lá vem {nome}\"."
          },
          {
            "id": "respirar",
            "texto": "Note o sinal no corpo e respire três vezes, sem obedecer."
          },
          {
            "id": "regra",
            "texto": "Leia a sua regra de trabalho."
          },
          {
            "id": "passo",
            "texto": "Faça o \"se, então\" ou o menor passo."
          }
        ]
      },
      "trava_campo": {
        "id": "alvo",
        "label": "Escreva agora o preço-alvo ou a menor ação (opcional)",
        "opcional": true
      },
      "sinais_gerais": [
        "a frase antiga voltou a soar verdadeira",
        "a sensação de \"sempre acontece comigo\""
      ],
      "sinais_card": {
        "titulo": "Os seus sinais do teto",
        "na_hora": "Na hora, quando um sinal aparecer: os 60 segundos.",
        "quando_voltar": "Quando o padrão vencer de novo, ou dois sinais aparecerem na mesma semana: refaça o protocolo, em versão curta."
      },
      "fio": {
        "blocos": [
          {
            "id": "como",
            "titulo": "Como ele funciona em você",
            "segmentos": [
              "Na última vez, “{cena:sp}”.",
              "O dia já vinha marcado por {terreno}.",
              "Os primeiros sinais foram: {sinais}.",
              "A frase que passou pela cabeça foi “{frase:sp}”.",
              "No ponto de escolha, você fez isto: “{ponto:sp}”.",
              "Na hora, isso te tirou {alivio}.",
              "Nas suas palavras: “{alivio_texto:sp}”.",
              "Depois, custou: “{custo:sp}”."
            ],
            "fechos": []
          },
          {
            "id": "para_que",
            "titulo": "Para que ele serve, e de onde veio",
            "segmentos": [
              "Esse padrão te protegia disto: {para_que}.",
              "Nas suas palavras: “{para_que_texto:sp}”.",
              "Faz sentido: você cresceu num clima em que o dinheiro {clima}.",
              "Sobre o clima de casa, você escreveu: “{clima_texto:sp}”.",
              "A regra “{regra:sp}” soa verdadeira para você."
            ],
            "fechos": [
              {
                "exige": [
                  "regra"
                ],
                "texto": "Não é defeito: é uma solução antiga que hoje custa caro."
              }
            ]
          },
          {
            "id": "funciona",
            "titulo": "O que já funciona em você",
            "segmentos": [
              "Na vez em que ele não venceu, “{excecao:sp}”."
            ],
            "fechos": [
              {
                "exige": [
                  "excecao"
                ],
                "texto": "O seu plano começa daí."
              }
            ]
          },
          {
            "id": "aposta",
            "titulo": "A sua aposta para a semana",
            "segmentos": [
              "A regra antiga prevê: “{previsao:sp}”.",
              "Hoje, você acredita nisso em {crenca}%.",
              "A sua regra de trabalho diz: “{regra_trabalho:sp}”."
            ],
            "fechos": [
              {
                "exige": [
                  "previsao",
                  "regra_trabalho"
                ],
                "texto": "Os experimentos dos dias 3 e 5 vão mostrar qual das duas acerta."
              }
            ]
          },
          {
            "id": "motivos",
            "titulo": "Por que mudar, nas suas palavras",
            "segmentos": [
              "Você deu {importancia}/10 para a importância de mudar isso agora.",
              "Nas suas palavras, por quê: “{motivos:sp}”.",
              "Um dia daqui a um ano: “{dia_um_ano:sp}”."
            ],
            "fechos": []
          }
        ],
        "juncao": "e"
      },
      "nao_indica": {
        "titulo": "O que o seu resultado não indica",
        "por_contra": "Você marcou: \"{resposta}\". Por isso, {nome} não parece ser o seu teto hoje.",
        "por_nao_acontece": "Na cena de {cena}, você marcou que isso não acontece com você. Então {nome} não parece ser o seu teto hoje.",
        "por_familia": "A frase \"{resposta}\" soou menos verdadeira para você, então {nome} pesa pouco."
      },
      "nenhum": {
        "titulo": "Nenhum padrão domina",
        "paragrafos": [
          "Pelas suas respostas, nenhum padrão aparece com força. Este é um resultado honesto: não vamos inventar um teto que as suas respostas não mostram."
        ]
      },
      "disclaimer": "Reflexão sobre hábitos com dinheiro. Não é diagnóstico, avaliação psicológica nem recomendação de investimento.",
      "rascunho": false,
      "se_entao": {
        "segmentos": [
          "Quando eu notar {sinal:sp,min},",
          "no ponto em que antes eu {ponto:sp,min},",
          "vou lembrar da vez em que {excecao:sp,min} e fazer o mesmo."
        ],
        "exige": [
          "excecao"
        ]
      },
      "resultado": {
        "mapa": {
          "eyebrow": "Fim do Ato 1 · o seu mapa",
          "verdict": "Seu teto hoje: ",
          "trilha": {
            "ganho": "É um teto de ganho: o limite está em quanto você cobra, pede ou arrisca para ganhar.",
            "retencao": "É um teto de retenção: o dinheiro chega, mas não fica, ou sai antes de cumprir o que você planejou."
          },
          "perto": "Os dois lados, ganho e retenção, pontuaram perto um do outro. Vale observar o outro também.",
          "frases_marcadas": "As frases que você marcou:",
          "sem_familia": "Nenhuma crença se destacou das outras: as suas respostas ficaram equilibradas.",
          "familia": "A crença que mais pesa: ",
          "vazamento_titulo": "O vazamento em observação",
          "vazamento": "Você também marcou sinais de “{nome}”, do outro lado. Será que você destrava num lado e devolve no outro?",
          "vazamento_nota": "Não é a meta de agora: fica em observação e é o alvo da próxima volta.",
          "sessenta_regra": " Por enquanto, use esta: “{exemplo}”. Na parte 2 você escreve a sua.",
          "trava_titulo": "A sua trava de hoje",
          "trava_alvo": "O que você escreveu: ",
          "sinais_empurrao": "O que costuma empurrar você: {empurrao}.",
          "parte2": "Se quiser seguir agora, a parte 2 (cerca de 15 minutos) traz a escrita sobre a última vez, a sua regra de trabalho e o plano da semana. Dá para guardar e continuar depois.",
          "seguranca": "Isto é uma reflexão sobre hábitos com dinheiro, e não substitui conversar com alguém. Se o peso for grande, o CVV atende pelo 188, a qualquer hora.",
          "arquivo": "teto-financeiro-mapa"
        },
        "final": {
          "eyebrow": "O seu Teto, completo",
          "arquivo": "teto-financeiro",
          "arquivo_ics": "teto-financeiro-retornos",
          "titulo_teto": "Onde o seu teto pega",
          "titulo_leitura": "A leitura do padrão",
          "titulo_ajuste": "O ajuste do seu plano",
          "titulo_plano7": "Seu plano de 7 dias",
          "titulo_plano90": "O plano de 90 dias",
          "ajuste": "Pelo que você respondeu ({motivos}), o seu plano começa um degrau abaixo: o dia 3 é um passo menor, que não tem como falhar, e o experimento que você escolheu fica para o dia 5.",
          "ajuste_motivos": {
            "confianca": "a confiança ficou abaixo de {minimo}",
            "terreno": "o dia já vinha com estresse e mês apertado",
            "desconforto": "você disse que agora não ao desconforto",
            "humor": "as últimas semanas foram pesadas",
            "deslize": "o plano travou"
          },
          "ajuste_juncao": "e",
          "raiox_clima": "O clima do dinheiro na casa em que você cresceu: {clima}.",
          "raiox_clima_texto": "Você acrescentou: “{texto}”.",
          "sessenta_regra": " A sua é: “{regra}”.",
          "sessenta_se_entao": " O seu: “{se_entao}”.",
          "sinais_dela": "Os seus sinais: {sinais}.",
          "sinais_frase": "A frase que costuma vir: “{frase}”.",
          "sinais_terreno": "O terreno em que ele aparece: {terreno}.",
          "raiox_clima_so_texto": "O clima do dinheiro na casa em que você cresceu, nas suas palavras: “{texto}”."
        },
        "raiox": {
          "titulo": "O Raio-X da sua relação com o dinheiro",
          "areas": {
            "ganhar": "Ganhar",
            "guardar": "Guardar",
            "decidir": "Decidir",
            "dar": "Dar"
          },
          "faixas": [
            "não apareceu nas suas respostas",
            "apareceu de leve",
            "apareceu",
            "apareceu com força"
          ],
          "linha": "{area}: {faixa}"
        },
        "nenhum": {
          "eyebrow": "O seu resultado",
          "voltar": "Quando voltar aqui"
        },
        "cuidado": {
          "eyebrow": "Primeiro, o cuidado",
          "noventa": "O plano de 90 dias"
        },
        "registro": {
          "titulo": "O registro do seu teto",
          "teto": "O teto",
          "trilha": "O tipo de teto",
          "familia": "A crença que mais pesa",
          "regra": "A sua regra de trabalho",
          "data": "Feito em"
        },
        "app": {
          "semana": {
            "resumo": "Teto Financeiro: revisão semanal",
            "descricao": "Dez minutos para olhar a semana: o sinal apareceu? Abra o link."
          },
          "continuar": {
            "resumo": "Teto Financeiro: continuar de onde parou",
            "descricao": "Retome o seu Teto. Se não houver nada guardado neste navegador, carregue o seu arquivo (.md). Se você já terminou, ignore este lembrete."
          },
          "retorno": {
            "prefixo": "Teto Financeiro: ",
            "abrir": "Abra o link para responder em 2 a 3 minutos."
          },
          "rotulo": "Baixar os lembretes (.ics)",
          "hora": {
            "rotulo": "Hora dos lembretes",
            "manha": "Manhã (08:00)",
            "almoco": "Almoço (12:30)",
            "noite": "Noite (20:00)"
          }
        },
        "cartoes": {
          "sinais": {
            "arquivo": "teto-financeiro-sinais.png",
            "rotulo": "Baixar o cartão dos sinais (PNG)",
            "eyebrow": "Teto Financeiro",
            "gerais": "Os sinais do padrão",
            "dela": "Os seus sinais",
            "na_hora": "Na hora",
            "voltar": "Quando voltar",
            "rodape": [
              "Guarde no celular.",
              "dlt.academy/protocolos/teto-financeiro"
            ]
          },
          "compartilhar": {
            "arquivo": "teto-financeiro-cartao.png",
            "rotulo": "Baixar o cartão para compartilhar (PNG)",
            "eyebrow": "Teto Financeiro",
            "frase": "O meu teto hoje:",
            "pergunta": "O que segura o seu dinheiro?",
            "rodape": [
              "Descubra o seu, em uns 8 minutos.",
              "dlt.academy/protocolos/teto-financeiro"
            ]
          }
        }
      }
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = BIBLIOTECA;
  else root.BIBLIOTECA_TETO = BIBLIOTECA;
})(typeof self !== "undefined" ? self : this);
