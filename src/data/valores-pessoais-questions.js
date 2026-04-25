export const personalValuesDimensions = [
  { id: 'identidade', name: 'Identidade', description: 'Clareza sobre quem a pessoa é, o que valoriza e como deseja agir no mundo.' },
  { id: 'familia_relacionamentos', name: 'Família e Relacionamentos', description: 'Valor atribuído aos vínculos, à presença, à responsabilidade afetiva e à construção relacional.' },
  { id: 'crescimento', name: 'Crescimento', description: 'Busca por aprendizado, evolução pessoal, expansão de consciência e desenvolvimento contínuo.' },
  { id: 'contribuicao', name: 'Contribuição', description: 'Desejo de servir, gerar impacto positivo e usar talentos para beneficiar outras pessoas.' },
  { id: 'prosperidade', name: 'Prosperidade', description: 'Relação com segurança, recursos, expansão material e capacidade de sustentar projetos de vida.' },
  { id: 'espiritualidade_proposito', name: 'Espiritualidade e Propósito', description: 'Conexão com sentido, princípios orientadores, fé, legado e direção existencial.' },
];

export const personalValuesSubareas = {
  coerencia_pessoal: { name: 'Coerência pessoal', dimension: 'identidade' },
  autenticidade: { name: 'Autenticidade', dimension: 'identidade' },
  vinculo: { name: 'Vínculo', dimension: 'familia_relacionamentos' },
  responsabilidade_afetiva: { name: 'Responsabilidade afetiva', dimension: 'familia_relacionamentos' },
  aprendizado: { name: 'Aprendizado', dimension: 'crescimento' },
  desenvolvimento_continuo: { name: 'Desenvolvimento contínuo', dimension: 'crescimento' },
  servico: { name: 'Serviço', dimension: 'contribuicao' },
  impacto_positivo: { name: 'Impacto positivo', dimension: 'contribuicao' },
  seguranca: { name: 'Segurança', dimension: 'prosperidade' },
  expansao: { name: 'Expansão', dimension: 'prosperidade' },
  sentido: { name: 'Sentido', dimension: 'espiritualidade_proposito' },
  principios_orientadores: { name: 'Princípios orientadores', dimension: 'espiritualidade_proposito' },
};

const questionGroups = [
  ['identidade', 'coerencia_pessoal', [
    ['Minhas escolhas costumam estar alinhadas com aquilo que eu digo ser importante para mim.', 'Pense se existe coerência entre o que você fala que valoriza e as decisões que toma na rotina, como trabalho, família, dinheiro, tempo e relacionamentos.'],
    ['Percebo quando estou agindo contra meus próprios valores.', 'Considere situações em que você aceita algo, se cala, promete, compra, trabalha ou se relaciona de um jeito que depois parece desalinhado com quem você quer ser.'],
    ['Consigo tomar decisões difíceis sem abandonar completamente aquilo em que acredito.', 'Pense em momentos de pressão. A pergunta avalia se você mantém seus princípios mesmo quando seria mais fácil agradar, evitar conflito ou escolher o caminho mais conveniente.'],
    ['Tenho clareza sobre quais valores não quero negociar.', 'Exemplos: honestidade, família, fé, saúde, liberdade, responsabilidade, excelência, presença, justiça ou respeito.'],
  ]],
  ['identidade', 'autenticidade', [
    ['Consigo expressar quem eu sou sem depender excessivamente da aprovação dos outros.', 'Pense se você consegue mostrar opiniões, preferências, limites e escolhas sem se moldar o tempo todo para ser aceito(a).'],
    ['Sinto que minha vida reflete minha identidade, não apenas expectativas externas.', 'Avalie se sua rotina parece construída por você ou se parece apenas uma resposta ao que família, sociedade, trabalho ou outras pessoas esperam.'],
    ['Tenho coragem de assumir escolhas que fazem sentido para mim, mesmo quando são diferentes das escolhas da maioria.', 'Considere decisões sobre carreira, maternidade, casamento, dinheiro, espiritualidade, estilo de vida ou prioridades pessoais.'],
    ['Percebo quando estou tentando parecer alguém que não sou.', 'Pense em situações em que você exagera, esconde, performa, concorda sem concordar ou tenta sustentar uma imagem que não corresponde ao seu interior.'],
  ]],
  ['familia_relacionamentos', 'vinculo', [
    ['Dou atenção real às pessoas que considero importantes.', 'Pense não apenas em estar fisicamente presente, mas em escutar, olhar, conversar, demonstrar interesse e participar da vida dessas pessoas.'],
    ['Consigo priorizar vínculos importantes mesmo em fases de muita demanda.', 'Avalie se família, casamento, filhos, amizades ou pessoas significativas continuam tendo espaço quando sua rotina fica cheia.'],
    ['Sinto que invisto de forma intencional nos meus relacionamentos.', 'Considere atitudes práticas: conversar, pedir perdão, agradecer, planejar tempo junto, cuidar de datas importantes e demonstrar presença.'],
    ['Percebo quando estou negligenciando pessoas importantes para mim.', 'Pense se você nota sinais como distanciamento, frieza, falta de conversa, impaciência constante ou sensação de que só sobra tempo para os outros depois de tudo.'],
  ]],
  ['familia_relacionamentos', 'responsabilidade_afetiva', [
    ['Assumo responsabilidade pelo impacto que minhas atitudes causam nas pessoas próximas.', 'A pergunta não é sobre se culpar por tudo, mas sobre reconhecer quando sua fala, ausência, irritação, cobrança ou silêncio afeta o outro.'],
    ['Consigo reparar uma relação quando percebo que falhei.', 'Pense se você consegue pedir desculpas, conversar, retomar o vínculo, explicar melhor ou mudar uma atitude depois de perceber que machucou alguém.'],
    ['Tento comunicar meus limites sem ferir desnecessariamente o outro.', 'Considere se você consegue dizer não, pedir espaço ou explicar uma necessidade sem atacar, humilhar, sumir ou manipular.'],
    ['Busco equilíbrio entre cuidar dos outros e não me abandonar.', 'Pense se você consegue amar, servir e estar presente sem viver em autoanulação, sobrecarga ou ressentimento.'],
  ]],
  ['crescimento', 'aprendizado', [
    ['Tenho disposição para aprender mesmo quando isso confronta minhas certezas.', 'Avalie se você consegue ouvir ideias novas, feedbacks, críticas e perspectivas diferentes sem rejeitar automaticamente.'],
    ['Busco conhecimento que me ajude a viver melhor, não apenas a performar melhor.', 'Pense em aprendizados sobre emoções, relacionamentos, espiritualidade, comunicação, saúde, finanças, propósito e comportamento.'],
    ['Transformo experiências difíceis em aprendizado.', 'Considere se você consegue extrair lições de erros, frustrações, conflitos, perdas ou fases desafiadoras.'],
    ['Tenho curiosidade para entender melhor meus próprios padrões.', 'Pense se você procura compreender por que reage, escolhe, evita, insiste ou sofre de determinadas formas.'],
  ]],
  ['crescimento', 'desenvolvimento_continuo', [
    ['Mantenho práticas consistentes de desenvolvimento pessoal.', 'Exemplos: leitura, oração, terapia, mentoria, estudo, reflexão, exercícios, escrita, conversas profundas ou revisão de metas.'],
    ['Consigo sustentar processos de evolução que não dão resultado imediato.', 'Pense se você continua investindo em crescimento mesmo quando não há recompensa rápida, elogio ou mudança visível no curto prazo.'],
    ['Tenho abertura para mudar comportamentos que já não combinam com quem desejo me tornar.', 'Considere hábitos, reações emocionais, formas de comunicação, rotinas e decisões que talvez funcionaram no passado, mas hoje limitam você.'],
    ['Vejo minha vida como um processo contínuo de amadurecimento.', 'A pergunta avalia se você entende crescimento como jornada constante, e não como algo que acontece apenas em cursos, crises ou datas especiais.'],
  ]],
  ['contribuicao', 'servico', [
    ['Sinto valor em usar minhas capacidades para servir outras pessoas.', 'Pense se seus talentos, conhecimento, experiência, tempo ou presença são usados para ajudar alguém além de você mesmo(a).'],
    ['Tenho disposição para ajudar sem precisar de reconhecimento imediato.', 'Considere se você consegue contribuir mesmo quando não recebe elogio, aplauso, status ou retorno rápido.'],
    ['Percebo oportunidades simples de servir no cotidiano.', 'Exemplos: escutar alguém, orientar, facilitar um processo, cuidar, ensinar, apoiar, encorajar ou assumir uma responsabilidade necessária.'],
    ['Consigo servir sem me colocar sempre em último lugar.', 'A pergunta avalia se sua contribuição vem de maturidade, e não de culpa, necessidade de aprovação ou autoabandono.'],
  ]],
  ['contribuicao', 'impacto_positivo', [
    ['Penso no impacto que minhas escolhas geram nas pessoas ao meu redor.', 'Considere como suas decisões afetam família, filhos, equipe, pacientes, clientes, amigos, comunidade ou futuras gerações.'],
    ['Desejo construir algo que deixe uma contribuição além dos meus interesses pessoais.', 'Pense em legado, educação dos filhos, trabalho com propósito, transformação de pessoas, projetos sociais, fé, família ou comunidade.'],
    ['Procuro alinhar minhas ambições a algum tipo de impacto positivo.', 'Avalie se crescer, ganhar mais, liderar ou conquistar coisas também está conectado a beneficiar pessoas ou construir algo útil.'],
    ['Tenho clareza sobre quem é beneficiado quando eu cresço.', 'Pense se o seu desenvolvimento melhora apenas sua vida ou também sua família, filhos, equipe, clientes, pacientes ou pessoas que dependem da sua liderança.'],
  ]],
  ['prosperidade', 'seguranca', [
    ['Valorizo construir uma base segura para sustentar minhas decisões.', 'Pense em reserva financeira, organização, previsibilidade, saúde, estrutura familiar, rotina e planejamento antes de assumir grandes passos.'],
    ['Consigo buscar segurança sem ficar paralisado(a) pelo medo.', 'A pergunta avalia se sua necessidade de segurança ajuda você a se organizar ou se impede decisões importantes.'],
    ['Tenho responsabilidade com os recursos que passam pelas minhas mãos.', 'Considere dinheiro, tempo, energia, oportunidades, conhecimento, contatos e estrutura familiar ou profissional.'],
    ['Cuido da minha estabilidade sem transformar controle em prisão.', 'Pense se sua busca por estabilidade permite viver melhor ou se faz você evitar todo risco, novidade ou expansão.'],
  ]],
  ['prosperidade', 'expansao', [
    ['Permito-me desejar crescimento material sem culpa.', 'Avalie se você consegue desejar prosperidade, conforto, liberdade, patrimônio ou melhores condições sem sentir que isso diminui seus valores.'],
    ['Vejo prosperidade como meio para ampliar possibilidades, não apenas como acúmulo.', 'Pense se dinheiro e recursos são vistos como instrumentos para servir, proteger, educar, criar, cuidar, construir e realizar propósito.'],
    ['Consigo assumir riscos calculados quando eles estão alinhados aos meus valores.', 'Considere decisões como investir, mudar rota, iniciar projeto, contratar ajuda, estudar, empreender ou se posicionar melhor.'],
    ['Tenho abertura para expandir minha vida sem abandonar minha essência.', 'A pergunta avalia se você consegue crescer em renda, influência, estrutura ou responsabilidade sem perder identidade, família, fé ou propósito.'],
  ]],
  ['espiritualidade_proposito', 'sentido', [
    ['Sinto que minhas escolhas precisam estar conectadas a um sentido maior.', 'Pense se você busca mais do que funcionar, produzir ou sobreviver. Considere propósito, fé, legado, chamado, missão ou direção de vida.'],
    ['Tenho momentos de reflexão sobre o propósito da minha vida.', 'Considere oração, silêncio, escrita, leitura, conversa profunda, meditação, estudo bíblico, terapia ou revisão de prioridades.'],
    ['Procuro tomar decisões olhando para o legado que desejo construir.', 'Pense em como suas escolhas atuais impactam quem você está se tornando, seus filhos, sua família, sua comunidade ou sua história no longo prazo.'],
    ['Quando estou desalinhado(a), sinto necessidade de voltar ao que dá sentido à minha vida.', 'A pergunta avalia se você percebe quando está vivendo no automático e busca reencontrar direção interior.'],
  ]],
  ['espiritualidade_proposito', 'principios_orientadores', [
    ['Tenho princípios que orientam minhas decisões mesmo quando ninguém está vendo.', 'Pense em honestidade, fé, responsabilidade, verdade, justiça, amor, excelência, fidelidade, humildade ou serviço.'],
    ['Busco agir de acordo com meus princípios em situações pequenas, não apenas nas grandes.', 'Considere atitudes simples: cumprir palavra, ser honesto(a), tratar bem, respeitar limites, cuidar do que prometeu e fazer o certo sem plateia.'],
    ['Consigo diferenciar convicção de rigidez.', 'A pergunta avalia se você mantém princípios firmes sem se tornar inflexível, arrogante ou incapaz de escutar.'],
    ['Minhas decisões importantes passam por algum filtro espiritual, moral ou de propósito.', 'Pense se você avalia decisões relevantes perguntando: isso combina com minha fé, meus princípios, meu chamado, minha família e o legado que desejo deixar?'],
  ]],
];

let counter = 1;
export const personalValuesQuestions = questionGroups.flatMap(([dimension, subarea, items]) =>
  items.map(([text, helpText]) => ({
    id: 'vp' + String(counter++).padStart(2, '0'),
    dimension,
    subarea,
    text,
    helpText,
  }))
);
