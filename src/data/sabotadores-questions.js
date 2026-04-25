export const sabotagerTypes = [
  { id: 'perfeccionista', name: 'Perfeccionista', description: 'Adia ou trava porque precisa fazer tudo impecável antes de agir.' },
  { id: 'controlador', name: 'Controlador', description: 'Tenta controlar pessoas, cenários e resultados para reduzir insegurança.' },
  { id: 'evitador', name: 'Evitador', description: 'Foge de conversas, decisões ou tarefas desconfortáveis.' },
  { id: 'agradador', name: 'Agradador', description: 'Diz sim demais e perde direção para evitar desaprovação.' },
  { id: 'critico', name: 'Crítico Interno', description: 'Interpreta falhas como prova de incapacidade e endurece a autoimagem.' },
  { id: 'procrastinador', name: 'Procrastinador', description: 'Troca ações importantes por alívio imediato, distrações ou urgências menores.' },
  { id: 'hiperresponsavel', name: 'Hiper-responsável', description: 'Assume peso demais e confunde valor pessoal com dar conta de tudo.' },
  { id: 'comparador', name: 'Comparador', description: 'Mede a própria vida pela régua de outras pessoas e perde presença.' },
];

export const sabotagerPhases = [
  { id: 'scenarios', name: 'Cenários', description: 'Identifica como você reage em situações reais.' },
  { id: 'triggers', name: 'Gatilhos', description: 'Mapeia o que costuma ativar seus sabotadores.' },
  { id: 'pattern', name: 'Padrão automático', description: 'Mostra a resposta interna que aparece antes da ação.' },
  { id: 'antidote', name: 'Antídoto', description: 'Constrói uma resposta prática para neutralizar o padrão.' },
];

export const sabotagerQuestions = [
  { id: 'si01', type: 'scenario', phase: 'scenarios', text: 'Você precisa entregar algo importante, mas ainda não está perfeito. O que tende a acontecer?', helpText: 'Escolha a resposta que mais parece com seu comportamento real.', options: [
    { id: 'A', label: 'Reviso demais e demoro para entregar.', value: 'perfeccionista' },
    { id: 'B', label: 'Tento controlar todos os detalhes antes de avançar.', value: 'controlador' },
    { id: 'C', label: 'Deixo para depois e faço outra coisa mais simples.', value: 'procrastinador' },
    { id: 'D', label: 'Penso que não sou bom o suficiente para fazer direito.', value: 'critico' },
  ]},
  { id: 'si02', type: 'scenario', phase: 'scenarios', text: 'Alguém importante se frustra com você. Qual reação aparece primeiro?', helpText: 'Não responda pelo ideal. Responda pelo padrão mais frequente.', options: [
    { id: 'A', label: 'Tento agradar e compensar rapidamente.', value: 'agradador' },
    { id: 'B', label: 'Assumo toda a responsabilidade, mesmo quando não é só minha.', value: 'hiperresponsavel' },
    { id: 'C', label: 'Evito a conversa para não lidar com tensão.', value: 'evitador' },
    { id: 'D', label: 'Fico me criticando por ter falhado.', value: 'critico' },
  ]},
  { id: 'si03', type: 'scenario', phase: 'scenarios', text: 'Você vê alguém avançando mais rápido que você. O que tende a acontecer internamente?', helpText: 'Observe a resposta emocional automática.', options: [
    { id: 'A', label: 'Comparo minha vida e sinto que estou ficando para trás.', value: 'comparador' },
    { id: 'B', label: 'Me cobro mais e tento acelerar tudo.', value: 'hiperresponsavel' },
    { id: 'C', label: 'Penso que preciso melhorar muito antes de aparecer.', value: 'perfeccionista' },
    { id: 'D', label: 'Evito olhar para isso porque me incomoda.', value: 'evitador' },
  ]},
  { id: 'si04', type: 'scenario', phase: 'scenarios', text: 'Quando uma decisão importante depende de você, qual padrão aparece?', helpText: 'A decisão pode ser familiar, profissional, financeira ou pessoal.', options: [
    { id: 'A', label: 'Quero garantir todos os cenários antes de decidir.', value: 'controlador' },
    { id: 'B', label: 'Adio até a pressão ficar maior.', value: 'procrastinador' },
    { id: 'C', label: 'Penso demais no que os outros vão achar.', value: 'agradador' },
    { id: 'D', label: 'Assumo que preciso resolver tudo sozinho(a).', value: 'hiperresponsavel' },
  ]},
  { id: 'si05', type: 'multi_choice', phase: 'triggers', text: 'Quais gatilhos mais ativam seus padrões de sabotagem?', helpText: 'Escolha todos os que fazem sentido.', options: [
    { id: 'A', label: 'Crítica ou possibilidade de julgamento', value: 'julgamento' },
    { id: 'B', label: 'Conflito ou desaprovação', value: 'conflito' },
    { id: 'C', label: 'Falta de controle', value: 'controle' },
    { id: 'D', label: 'Comparação com outras pessoas', value: 'comparacao' },
    { id: 'E', label: 'Excesso de demandas', value: 'sobrecarga' },
    { id: 'F', label: 'Tarefa grande sem começo claro', value: 'ambiguidade' },
  ]},
  { id: 'si06', type: 'scale', phase: 'triggers', min: 0, max: 10, text: 'De 0 a 10, quanto esses padrões atrapalham sua execução hoje?', helpText: '0 significa quase nada. 10 significa que atrapalha muito sua vida prática.' },
  { id: 'si07', type: 'single_choice', phase: 'pattern', text: 'Qual frase interna mais aparece quando você trava?', helpText: 'Escolha a frase que mais parece familiar.', options: [
    { id: 'A', label: 'Ainda não está bom o suficiente.', value: 'perfeccionista' },
    { id: 'B', label: 'Se eu não cuidar de tudo, vai dar errado.', value: 'controlador' },
    { id: 'C', label: 'Depois eu resolvo isso.', value: 'procrastinador' },
    { id: 'D', label: 'Eu não posso decepcionar ninguém.', value: 'agradador' },
    { id: 'E', label: 'Eu deveria dar conta de tudo.', value: 'hiperresponsavel' },
    { id: 'F', label: 'Os outros estão melhores que eu.', value: 'comparador' },
  ]},
  { id: 'si08', type: 'single_choice', phase: 'pattern', text: 'Qual comportamento mais aparece depois dessa frase interna?', helpText: 'Esse é o comportamento automático que o plano vai precisar interromper.', options: [
    { id: 'A', label: 'Revisar demais', value: 'revisao_excessiva' },
    { id: 'B', label: 'Evitar conversa ou decisão', value: 'evitacao' },
    { id: 'C', label: 'Assumir tarefas demais', value: 'sobrecarga' },
    { id: 'D', label: 'Buscar aprovação antes de agir', value: 'aprovacao' },
    { id: 'E', label: 'Trocar o importante por distrações', value: 'distracao' },
    { id: 'F', label: 'Controlar detalhes ou pessoas', value: 'controle' },
  ]},
  { id: 'si09', type: 'text', phase: 'pattern', required: false, text: 'Descreva uma situação recente em que esse padrão apareceu.', helpText: 'Pode ser uma situação curta. Exemplo: “precisei ter uma conversa difícil e adiei por três dias”.' },
  { id: 'si10', type: 'single_choice', phase: 'antidote', text: 'Qual antídoto parece mais necessário para sua próxima fase?', helpText: 'Escolha a resposta prática que você mais precisa fortalecer.', options: [
    { id: 'A', label: 'Agir com versão simples, mesmo sem perfeição.', value: 'acao_imperfeita' },
    { id: 'B', label: 'Ter conversas difíceis com clareza e respeito.', value: 'conversa_clara' },
    { id: 'C', label: 'Delegar, pedir ajuda ou dividir peso.', value: 'dividir_peso' },
    { id: 'D', label: 'Criar limite para demandas externas.', value: 'limites' },
    { id: 'E', label: 'Começar pequeno antes de sentir vontade.', value: 'microacao' },
    { id: 'F', label: 'Medir progresso pela minha jornada, não pela dos outros.', value: 'autorreferencia' },
  ]},
  { id: 'si11', type: 'text', phase: 'antidote', required: false, text: 'Qual ação pequena você pode fazer nas próximas 24 horas para quebrar esse padrão?', helpText: 'Escreva uma ação específica, pequena e verificável.' },
];
