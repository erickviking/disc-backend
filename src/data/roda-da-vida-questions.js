// Roda da Vida — 12 áreas com 3 perguntas reflexivas cada
// O usuário responde cada pergunta com nota de 1 a 10
// Score por área = média das 3 perguntas

export const rodaDaVidaAreas = [
  {
    id: 'saude',
    name: 'Saúde e Disposição',
    icon: 'Heart',
    color: '#E63946',
    questions: [
      { id: 'saude_1', text: 'Como você avalia sua saúde física atual (energia, sono, alimentação)?' },
      { id: 'saude_2', text: 'Com que frequência você pratica atividades físicas?' },
      { id: 'saude_3', text: 'Quão satisfeito você está com seus hábitos de autocuidado?' },
    ],
  },
  {
    id: 'intelectual',
    name: 'Desenvolvimento Intelectual',
    icon: 'BookOpen',
    color: '#4c6ef5',
    questions: [
      { id: 'intelectual_1', text: 'Quanto você tem investido em aprendizado e desenvolvimento pessoal?' },
      { id: 'intelectual_2', text: 'Quão estimulado intelectualmente você se sente no dia a dia?' },
      { id: 'intelectual_3', text: 'Como você avalia sua capacidade de aprender coisas novas atualmente?' },
    ],
  },
  {
    id: 'emocional',
    name: 'Equilíbrio Emocional',
    icon: 'Shield',
    color: '#7c3aed',
    questions: [
      { id: 'emocional_1', text: 'Quão bem você lida com suas emoções no dia a dia?' },
      { id: 'emocional_2', text: 'Com que frequência você se sente em paz consigo mesmo?' },
      { id: 'emocional_3', text: 'Como você avalia sua capacidade de lidar com situações de estresse?' },
    ],
  },
  {
    id: 'proposito',
    name: 'Realização e Propósito',
    icon: 'Compass',
    color: '#F4A261',
    questions: [
      { id: 'proposito_1', text: 'Quão conectado você se sente com seu propósito de vida?' },
      { id: 'proposito_2', text: 'Como você avalia seu senso de realização pessoal?' },
      { id: 'proposito_3', text: 'Quanto suas atividades diárias estão alinhadas com o que realmente importa para você?' },
    ],
  },
  {
    id: 'financas',
    name: 'Recursos Financeiros',
    icon: 'Target',
    color: '#059669',
    questions: [
      { id: 'financas_1', text: 'Quão satisfeito você está com sua situação financeira atual?' },
      { id: 'financas_2', text: 'Como você avalia seu controle sobre gastos e investimentos?' },
      { id: 'financas_3', text: 'Quão seguro financeiramente você se sente para o futuro?' },
    ],
  },
  {
    id: 'contribuicao',
    name: 'Contribuição Social',
    icon: 'Users',
    color: '#2A9D8F',
    questions: [
      { id: 'contribuicao_1', text: 'Quanto você sente que contribui positivamente para a vida de outras pessoas?' },
      { id: 'contribuicao_2', text: 'Quão envolvido você está em ações que geram impacto além de você?' },
      { id: 'contribuicao_3', text: 'Como você avalia o legado que está construindo?' },
    ],
  },
  {
    id: 'familia',
    name: 'Família',
    icon: 'Heart',
    color: '#E63946',
    questions: [
      { id: 'familia_1', text: 'Quão satisfeito você está com a qualidade do tempo que passa com sua família?' },
      { id: 'familia_2', text: 'Como você avalia a harmonia nos seus relacionamentos familiares?' },
      { id: 'familia_3', text: 'Quanto você sente que está presente e conectado com as pessoas que ama?' },
    ],
  },
  {
    id: 'relacionamento',
    name: 'Relacionamento Amoroso',
    icon: 'Heart',
    color: '#ec4899',
    questions: [
      { id: 'relacionamento_1', text: 'Quão satisfeito você está com sua vida afetiva/amorosa?' },
      { id: 'relacionamento_2', text: 'Como você avalia a qualidade da comunicação no seu relacionamento (ou consigo mesmo, se solteiro)?' },
      { id: 'relacionamento_3', text: 'Quanto você se sente valorizado e acolhido nas suas relações íntimas?' },
    ],
  },
  {
    id: 'social',
    name: 'Vida Social',
    icon: 'Users',
    color: '#f59e0b',
    questions: [
      { id: 'social_1', text: 'Quão satisfeito você está com suas amizades e vida social?' },
      { id: 'social_2', text: 'Com que frequência você se conecta com pessoas que te fazem bem?' },
      { id: 'social_3', text: 'Como você avalia a qualidade das suas conexões sociais?' },
    ],
  },
  {
    id: 'diversao',
    name: 'Criatividade e Diversão',
    icon: 'Rocket',
    color: '#8b5cf6',
    questions: [
      { id: 'diversao_1', text: 'Quanto tempo você dedica a atividades que te dão prazer e diversão?' },
      { id: 'diversao_2', text: 'Quão presente está a criatividade no seu dia a dia?' },
      { id: 'diversao_3', text: 'Como você avalia seu equilíbrio entre responsabilidades e lazer?' },
    ],
  },
  {
    id: 'plenitude',
    name: 'Plenitude e Felicidade',
    icon: 'Star',
    color: '#d4a853',
    questions: [
      { id: 'plenitude_1', text: 'De modo geral, quão feliz você se sente com sua vida?' },
      { id: 'plenitude_2', text: 'Com que frequência você experimenta momentos de gratidão genuína?' },
      { id: 'plenitude_3', text: 'Quanto você sente que está vivendo a vida que deseja?' },
    ],
  },
  {
    id: 'espiritualidade',
    name: 'Espiritualidade',
    icon: 'Compass',
    color: '#6366f1',
    questions: [
      { id: 'espiritualidade_1', text: 'Quão conectado você se sente com algo maior que você (fé, universo, natureza)?' },
      { id: 'espiritualidade_2', text: 'Com que frequência você pratica momentos de reflexão, meditação ou oração?' },
      { id: 'espiritualidade_3', text: 'Como você avalia sua paz interior e senso de transcendência?' },
    ],
  },
];

export const rodaDaVidaQuestionCount = rodaDaVidaAreas.reduce((sum, a) => sum + a.questions.length, 0);
