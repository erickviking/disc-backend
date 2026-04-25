export const goalsExecutionSteps = [
  { id: 'vision', name: 'Visão', description: 'Define a meta em linguagem clara e desejável.' },
  { id: 'why', name: 'Motivo', description: 'Conecta a meta ao valor ou propósito por trás dela.' },
  { id: 'diagnosis', name: 'Diagnóstico', description: 'Mapeia ponto de partida, recursos e obstáculos.' },
  { id: 'precision', name: 'Precisão', description: 'Transforma desejo em meta específica, mensurável e temporal.' },
  { id: 'execution', name: 'Execução', description: 'Quebra a meta em plano de 30 dias com ações e métricas.' },
];

export const goalsExecutionQuestions = [
  { id: 'me01', type: 'text', phase: 'vision', required: true, text: 'Qual meta você quer construir agora?', helpText: 'Escreva em linguagem simples. Exemplo: melhorar meu casamento, organizar minha vida financeira, emagrecer, crescer profissionalmente, estudar mais, abrir um projeto.' },
  { id: 'me02', type: 'single_choice', phase: 'vision', required: true, text: 'Em qual área essa meta se encaixa melhor?', helpText: 'Escolha a área principal. Se a meta tocar várias áreas, selecione a que mais precisa de avanço agora.', options: [
    { id: 'A', label: 'Família e relacionamentos', value: 'familia_relacionamentos' }, { id: 'B', label: 'Saúde e energia', value: 'saude' }, { id: 'C', label: 'Prosperidade e finanças', value: 'prosperidade' }, { id: 'D', label: 'Carreira ou trabalho', value: 'carreira' }, { id: 'E', label: 'Espiritualidade e propósito', value: 'proposito' }, { id: 'F', label: 'Desenvolvimento pessoal', value: 'desenvolvimento' },
  ]},
  { id: 'me03', type: 'text', phase: 'why', required: true, text: 'Por que essa meta é importante para você?', helpText: 'Não responda apenas “porque eu quero”. Explique o impacto real dessa meta na sua vida, família, futuro ou identidade.' },
  { id: 'me04', type: 'text', phase: 'why', required: false, text: 'O que pode acontecer se você continuar adiando essa meta?', helpText: 'Essa pergunta identifica custo de não agir. Não precisa dramatizar; seja honesto(a).' },
  { id: 'me05', type: 'scale', phase: 'diagnosis', required: true, min: 0, max: 10, text: 'De 0 a 10, em que ponto você está hoje em relação a essa meta?', helpText: '0 significa totalmente distante. 10 significa meta já alcançada.' },
  { id: 'me06', type: 'scale', phase: 'diagnosis', required: true, min: 0, max: 10, text: 'De 0 a 10, quanta energia real você tem para executar essa meta agora?', helpText: 'Considere rotina, saúde, tempo, foco, apoio e disposição emocional.' },
  { id: 'me07', type: 'multi_choice', phase: 'diagnosis', required: true, text: 'Quais são os principais obstáculos hoje?', helpText: 'Escolha todos os obstáculos relevantes.', options: [
    { id: 'A', label: 'Falta de clareza', value: 'clareza' }, { id: 'B', label: 'Falta de tempo', value: 'tempo' }, { id: 'C', label: 'Falta de energia', value: 'energia' }, { id: 'D', label: 'Medo ou insegurança', value: 'medo' }, { id: 'E', label: 'Falta de apoio', value: 'apoio' }, { id: 'F', label: 'Desorganização', value: 'organizacao' }, { id: 'G', label: 'Falta de dinheiro ou estrutura', value: 'recursos' }, { id: 'H', label: 'Inconstância', value: 'constancia' },
  ]},
  { id: 'me08', type: 'text', phase: 'diagnosis', required: false, text: 'Quais recursos você já tem para começar?', helpText: 'Exemplos: tempo livre, conhecimento, apoio de alguém, dinheiro reservado, experiência, mentor, rotina, fé, disciplina, contatos.' },
  { id: 'me09', type: 'text', phase: 'precision', required: true, text: 'Como você saberá que alcançou essa meta?', helpText: 'Descreva o resultado observável. Exemplo: perder 6 kg, economizar R$10 mil, conversar 3 vezes por semana com meu filho, estudar 30 minutos por dia.' },
  { id: 'me10', type: 'single_choice', phase: 'precision', required: true, text: 'Qual prazo faz sentido para essa meta?', helpText: 'Escolha um prazo realista para o primeiro ciclo.', options: [
    { id: 'A', label: '30 dias', value: '30_dias' }, { id: 'B', label: '60 dias', value: '60_dias' }, { id: 'C', label: '90 dias', value: '90_dias' }, { id: 'D', label: '6 meses', value: '6_meses' }, { id: 'E', label: '12 meses', value: '12_meses' },
  ]},
  { id: 'me11', type: 'single_choice', phase: 'execution', required: true, text: 'Qual estilo de execução combina mais com você agora?', helpText: 'Isso ajuda a IA a criar um plano que você realmente consiga seguir.', options: [
    { id: 'A', label: 'Pequenos passos diários', value: 'diario' }, { id: 'B', label: 'Blocos concentrados algumas vezes por semana', value: 'blocos' }, { id: 'C', label: 'Plano com cobrança externa', value: 'cobranca' }, { id: 'D', label: 'Rotina simples com checklist', value: 'checklist' },
  ]},
  { id: 'me12', type: 'text', phase: 'execution', required: false, text: 'Qual é a primeira ação concreta que você pode fazer nas próximas 24 horas?', helpText: 'Algo pequeno e executável. Não escreva uma intenção; escreva uma ação.' },
];
