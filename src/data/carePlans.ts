/**
 * Curated Care Plans for Neurological/Clinical Conditions
 */

import { CarePlanContent } from '../types';

export const CLINICAL_CARE_PLANS: Record<string, CarePlanContent> = {
  Enxaqueca: {
    id: 'Enxaqueca',
    title: 'Plano de Cuidado para Enxaqueca Crônica',
    subtitle: 'Controle de gatilhos e diário de dor crônica',
    description: 'Este plano é focado no acompanhamento diário detalhado de crises de enxaqueca crônica, identificação rápida de gatilhos ambientais, nutricionais, emocionais e do padrão de sono, além do controle rigoroso de uso de medicamentos de resgate analgésico.',
    guidelines: [
      'Mantenha rotinas de sono super regulares, inclusive aos finais de semana (evite deitar ou acordar muito tarde).',
      'Registre os alimentos consumidos 12 horas antes do início de qualquer crise (ex: queijos amarelos, embutidos, chocolate, adoçantes).',
      'Hidrate-se com constância: beba de 2.5L a 3L de água ao longo de todo o dia.',
      'Limite o uso de analgésicos comuns a no máximo 2 dias por semana para evitar o ciclo de cefaleia crônica por rebote medicamentoso.',
      'Pratique atividades aeróbicas leves de forma consistente (mínimo 3 vezes por semana, fora dos momentos de crise intensa).'
    ],
    videos: [
      {
        id: '1',
        title: 'Entendo a Fisiologia da Enxaqueca e suas Fases',
        duration: '12:45',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_1',
        description: 'Aprenda sobre o pródromo, aura, fase de dor e pósdromo, e como atuar em cada uma delas para mitigar os sintomas.',
        audience: 'patient'
      },
      {
        id: '2',
        title: 'Alongamentos Cervicais e Técnicas de Relaxamento',
        duration: '08:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_2',
        description: 'Exercícios específicos guiados para liberar a musculatura do trapézio e suboccipitais, que frequentemente agravam crises.',
        audience: 'patient'
      },
      {
        id: '3',
        title: 'Higiene do Sono para Enxaqueca Crônica',
        duration: '10:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_3',
        description: 'Passo a passo prático para criar um ritual de desaceleração noturna e melhorar a estabilidade do limiar da dor.',
        audience: 'patient'
      },
      {
        id: '4',
        title: 'Como Apoiar um Familiar com Crise de Enxaqueca',
        duration: '06:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_4',
        description: 'Aprenda a criar um ambiente de baixo estímulo (luz/som) e dar suporte terapêutico e emocional durante episódios agudos.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Sintomas de Enxaqueca',
      fields: [
        {
          id: 'painPeriod',
          label: 'Período da dor',
          type: 'select',
          options: ['Sem dor', 'Manhã', 'Tarde', 'Noite']
        },
        {
          id: 'painScale',
          label: 'Intensidade da dor (0 a 10)',
          type: 'scale',
          min: 0,
          max: 10
        },
        {
          id: 'painLocation',
          label: 'Localização da dor (marque todas que se aplicam)',
          type: 'multiselect',
          options: ['Unilateral (um lado só)', 'Frontal (testa)', 'Posterior (nuca)', 'Topo (topo da cabeça)', 'Cabeça toda']
        },
        {
          id: 'painCharacteristics',
          label: 'Características da dor',
          type: 'multiselect',
          options: ['Pulsátil/Latejante', 'Fincada', 'Aperto']
        },
        {
          id: 'painRelief',
          label: 'Alívio da dor: Melhora com repouso?',
          type: 'boolean'
        },
        {
          id: 'triggers',
          label: 'Possíveis gatilhos',
          type: 'multiselect',
          options: [
            'Falta de sono',
            'Excesso de telas',
            'Alimento específico',
            'Estresse/Ansiedade',
            'Mudança climática',
            'Esforço físico',
            'Cheiro forte',
            'Menstruação',
            'Luz forte',
            'Álcool'
          ]
        },
        {
          id: 'associatedSymptoms',
          label: 'Sintomas associados',
          type: 'multiselect',
          options: [
            'Sensibilidade à luz (Fotofobia)',
            'Sensibilidade ao barulho (Fonofobia)',
            'Sensibilidade a cheiros (Osmofobia)',
            'Náusea ou Vômito',
            'Tontura'
          ]
        },
        {
          id: 'medicationUsed',
          label: 'Uso de medicamento de resgate?',
          type: 'boolean'
        },
        {
          id: 'medicationDetails',
          label: 'Se sim, qual medicamento e dosagem?',
          type: 'text',
          placeholder: 'Ex: Triptano 80mg, Dipirona 1g...'
        }
      ]
    }
  },
  Parkinson: {
    id: 'Parkinson',
    title: 'Plano de Reabilitação para Doença de Parkinson',
    subtitle: 'Controle motor e exercícios diários',
    description: 'Plano voltado para a manutenção da mobilidade, reabilitação física, coordenação dos horários das medicações antiparkinsonianas e estimulação cognitiva continuada para preservação de autonomia.',
    guidelines: [
      'Respeite rigorosamente a tomada de prolopa ou agonistas dopaminérgicos nos horários exatos para evitar períodos OFF indesejados.',
      'Sente no mínimo 30 a 45 minutos após a refeição proteica para tomar sua medicação dopaminérgica (evita competição de absorção intestinal).',
      'Realize 15 minutos de alongamentos e exercícios de equilíbrio pela manhã, preferencialmente no seu melhor período ON.',
      'Utilize técnicas de pistas visuais (linhas paralelas no chão) ou sonoras (ritmo de metrônomo) para vencer episódios de congelamento de marcha (freezing).',
      'Mantenha atividades de estimulação mental desafiadoras, como leitura ativa, jogos lógicos ou interações sociais de qualidade.'
    ],
    videos: [
      {
        id: 'p1',
        title: 'Manejo de Períodos de Congelamento de Marcha (Freezing)',
        duration: '11:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_parkinson_1',
        description: 'Técnicas clínicas baseadas em pistas de metrônomo e redirecionamento de重心 para superar com segurança e sem desequilíbrios a hesitação de marcha.',
        audience: 'companion'
      },
      {
        id: 'p2',
        title: 'Exercícios de Mobilidade e Equilíbrio Preventivos',
        duration: '14:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_parkinson_2',
        description: 'Sequência dinâmica projetada por fisioterapeutas especialistas na área de neurofuncional para fortalecimento de quadríceps e estabilização de pelve.',
        audience: 'patient'
      },
      {
        id: 'p3',
        title: 'Guia de Transferências e Auxílio na Mobilidade para Familiares',
        duration: '09:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_parkinson_3',
        description: 'Como auxiliar o paciente a levantar-se da cama ou cadeira com segurança e ergonomia técnica para o cuidador.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  Demencia: {
    id: 'Demencia',
    title: 'Plano de Estímulo Cognitivo e Adaptação na Demência',
    subtitle: 'Segurança, ritmo diário estruturado e cognição',
    description: 'Este plano foca no enriquecimento do ambiente físico para torná-lo seguro contra quedas e desorientação, rotinas consistentes e atividades simples de engajamento para reduzir a ansiedade ou o declínio funcional rápido.',
    guidelines: [
      'Mantenha rotinas de alimentação, repouso e lazer sempre idênticas dia após dia para dar referencial temporal e acalmar o paciente.',
      'Facilite a iluminação indireta forte no final da tarde para evitar episódios de agitação crepuscular (síndrome do pôr do sol).',
      'Utilize agendas grandes de parede, relógios analógicos e contrastes de cores em pratos e móveis para auxiliar a auto-organização visual.',
      'Elimine tapetes soltos, fios aparentes de elétrica ou degraus não demarcados pela casa para reduzir acidentes de locomoção.',
      'Promova conversas significativas calmas, músicas do acervo afetivo e tarefas manuais simples sem focar em erros ou testes de memória estressantes.'
    ],
    videos: [
      {
        id: 'd1',
        title: 'Comunicação Não-Violenta e Redirecionamento Comportamental',
        duration: '15:10',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516307361142-ff5d18153c1e?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_demencia_1',
        description: 'Dicas práticas de como lidar com flutuações, perguntas repetitivas e teimosias sem gerar embates agressivos.',
        audience: 'companion'
      },
      {
        id: 'd2',
        title: 'Minimizando Riscos de Quedas em Ambiente Domiciliar',
        duration: '10:45',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_demencia_2',
        description: 'Tour por residência mostrando adaptações econômicas cruciais no banheiro, quarto e sala para dar total segurança.',
        audience: 'companion'
      },
      {
        id: 'd3',
        title: 'Exercícios Livres para Estimulação Cognitiva Leve',
        duration: '08:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_demencia_3',
        description: 'Atividades guiadas lúdicas, músicas e quebra-cabeças visuais simples que o paciente pode desfrutar em fases iniciais.',
        audience: 'patient'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  Epilepsia: {
    id: 'Epilepsia',
    title: 'Plano de Cuidados e Controle de Crises de Epilepsia',
    subtitle: 'Adesão medicamentosa estrita e segurança',
    description: 'Orientado para a vigilância de sintomas prodrômicos de crises, manutenção de controle absoluto de dosagens plasmáticas de anticonvulsivantes, além de ações mitigadoras contra privação de sono.',
    guidelines: [
      'Tome as medicações antiepilépticas em horários super precisos. O esquecimento é o principal gatilho do estado de mal epiléptico.',
      'Mantenha absoluto rigor sobre suas horas de sono: a privação ou disrupção grave do sono age desestabilizando as redes corticais cranianas.',
      'Evite o consumo de bebidas alcoólicas e o uso recreativo de estimulantes (cafeína em excesso ou energéticos).',
      'Deixe pessoas próximas e equipe de trabalho alertadas sobre os primeiros socorros em crise (ex: deitar de lado, proteger a cabeça).',
      'Evite atividades de mergulho sem vigilância direta ativa e isole adequadamente quinas de móveis no seu quarto.'
    ],
    videos: [
      {
        id: 'ep1',
        title: 'Protocolos de Segurança e Primeiros Socorros na Epilepsia',
        duration: '09:12',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_epilepsia_1',
        description: 'Orientações claras para familiares e cuidadores sobre o que fazer e o que não fazer durante uma crise convulsiva tônico-clônica.',
        audience: 'companion'
      },
      {
        id: 'ep2',
        title: 'Fatores Desencadeantes e Higiene do Sono',
        duration: '12:05',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_epilepsia_2',
        description: 'Esclarecimento detalhado de gatilhos como estresse agudo, febre corporal elevada e privações persistentes do descanso.',
        audience: 'patient'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  Espasticidade: {
    id: 'Espasticidade',
    title: 'Plano de Manejo e Alongamento para Espasticidade',
    subtitle: 'Prevenção de contraturas e rigidez patológica',
    description: 'Plano com foco no sequenciamento diário de alongamentos passivos e ativos recomendados para pacientes com comprometimento motor superior secundário a AVC ou trauma, prevenindo anquiloses.',
    guidelines: [
      'Realize os alongamentos prescritos pelo menos 2 vezes ao dia com velocidade lenta de estiramento para não disparar o reflexo miotático.',
      'Atente-se à integridade da pele em pregas articulares e pontos de pressão de órteses de posicionamento ou calçados.',
      'Sincronize as sessões de cinesioterapia intensa com o pico de ação das medicações orais miorrelaxantes ou pós-bloqueios.',
      'Previna episódios de dor crônica, infecções urinárias ou constipação grave, pois esses estímulos nocivos exacerbam a espasticidade.',
      'Use órteses posicionadoras noturnas de acordo com a prescrição médica para conter o padrão flexor ou extensor reflexo habitual.'
    ],
    videos: [
      {
        id: 'es1',
        title: 'Alongamentos e Posicionamento Terapêutico Preventivo',
        duration: '13:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_espasticidade_1',
        description: 'Guia visual demonstrando o correto posicionamento e manuseio delicado das articulações espásticas para evitar dor.',
        audience: 'companion'
      },
      {
        id: 'es2',
        title: 'Exercícios de Alongamento Ativo para Autonomia',
        duration: '09:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_espasticidade_2',
        description: 'Sequência leve de movimentos ativos que o paciente pode tentar realizar de forma independente para aliviar a tensão diária.',
        audience: 'patient'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  Bruxismo: {
    id: 'Bruxismo',
    title: 'Plano de Alívio de Bruxismo e Tensão de ATM',
    subtitle: 'Desprogramação neuromuscular e alívio mastigatório',
    description: 'Enfoca no controle do apertamento dentário diurno involuntário (bruxismo em vigília) bem como no uso correto e conservação de placas oclusais noturnas rígidas de acrílico miorrelaxantes.',
    guidelines: [
      'Adote lembretes diários (alertas no celular) para monitorar sua mandíbula: "Dentes juntos: nunca! Lábios selados, dentes afastados".',
      'Mantenha a placa de mordida cirúrgica higienizada e utilize-a todas as noites de sono sem exceção para blindar as articulações temporomandibulares.',
      'Pratique a auto-massagem na musculatura extrínseca da mastigação (masseter e temporal) por 3 minutos antes de deitar.',
      'Evite comer alimentos muito rígidos (torradas grossas, chicletes, caramelo duro) que requeiram excessivo esforço de trituração.',
      'Aplique compressas mornas úmidas na região pré-auricular em dias de fadiga intensa ou dor na abertura da boca.'
    ],
    videos: [
      {
        id: 'b1',
        title: 'Técnicas de Auto-Massagem e Auto-Liberação de Masseter',
        duration: '07:44',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_bruxismo_1',
        description: 'Sequência anatômica de deslizamento digital e pontos de pressão miorisofasciais para desprogramar a musculatura de ATM.',
        audience: 'patient'
      },
      {
        id: 'b2',
        title: 'Alívio de Pontos de Gatilho e Massagem no Pescoço para Familiares',
        duration: '06:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_bruxismo_2',
        description: 'Massagem terapêutica complementar que familiares podem aplicar na região cervical para amortecer dores de cabeça tensionais secundárias ao bruxismo.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  'Distonia cervical': {
    id: 'Distonia cervical',
    title: 'Plano de Cuidado para Distonia Cervical (Torcicolo Espasmódico)',
    subtitle: 'Alívio postural, gestos antagônicos e alongamentos',
    description: 'Instruções para reconhecimento tátil de gestos de alívio (truques sensoriais), alongamento simétrico da coluna cervical e potencialização dos ciclos de ação da toxina botulínica terapêutica.',
    guidelines: [
      'Estude e aplique seus "truques sensoriais" individuais (ex: toque leve no queixo ou lateral do pescoço) para reverter o espasmo postural.',
      'Implemente 10 de minutos de alongamentos cervicais extremamente suaves focando na amplitude respiratória e sem forçar o espasmo.',
      'Apoie a cabeça em encostos firmes simétricos durante o repouso para que a musculatura dorsal relaxe sem lutar contra a gravidade.',
      'Monitore o gráfico de eficácia da sua reabilitação nas semanas subsequentes às aplicações clínicas de toxina botulínica.',
      'Faça pausas de 5 minutos a cada hora de uso contínuo de telas ou direção veicular, mudando os pontos focais do seu pescoço.'
    ],
    videos: [
      {
        id: 'dc1',
        title: 'Gestos Antagônicos e Truques Sensoriais Clínicos',
        duration: '10:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_c_1',
        description: 'Estudos de caso reais de pacientes mostrando como mecanismos táteis corretivos aliviam temporariamente desvios posturais.',
        audience: 'patient'
      },
      {
        id: 'dc2',
        title: 'Adaptação Ergonômica Domiciliar e Suportes de Pescoço',
        duration: '08:40',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_c_2',
        description: 'Guia para acompanhantes sobre posicionamento confortável de travesseiros, apoios de nuca e ergonomia ideal de descanso para o familiar.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  'Distonia de face': {
    id: 'Distonia de face',
    title: 'Plano de Manejo para Distonia de Face e Blefaroespasmo',
    subtitle: 'Controle de fadiga muscular e estimulação do pestanejo',
    description: 'Diretrizes focadas em abrandar espasmos orbiculares, técnicas de pestanejo protetivo, fotoproteção intensa ocular e redução da fadiga de mímica social.',
    guidelines: [
      'Use óculos escuros com boa proteção UV de forma rigorosa em ambientes externos ou com fortes luzes LED fluorescentes artificiais.',
      'Utilize lubrificantes oculares em gotas estéreis conforme prescrição para evitar ressecamento e aumento reflexo do blefaroespasmo.',
      'Aprenda a aplicar truques sensoriais leves como falar pausadamente, cantarolar ou tocar a testa para mitigar o fechamento ocular.',
      'Tire micro-descansos de 3 minutos de pálpebras fechadas em momentos onde o espasmo esteja interferindo nas atividades funcionais.',
      'Execute massagem supraorbital suave para aliviar a exaustão acumulada nos músculos da testa e ao redor dos olhos.'
    ],
    videos: [
      {
        id: 'df1',
        title: 'Manejo de Blefaroespasmo e Alívio de Espasmos Faciais',
        duration: '08:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_f_1',
        description: 'Técnicas de modulação sensorial orbitária e fotoproteção para otimizar os períodos funcionais palpebrais.',
        audience: 'patient'
      },
      {
        id: 'df2',
        title: 'Como Apoiar na Comunicação sem Constrangimento Social',
        duration: '07:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516307361142-ff5d18153c1e?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_f_2',
        description: 'Conselhos práticos detalhando como familiares e parceiros podem auxiliar a socialização sem julgamentos ou pressão conversacional.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  'Distonia focal': {
    id: 'Distonia focal',
    title: 'Plano de Reabilitação para Distonia Focal da Mão',
    subtitle: 'Reeducação motora fina e de tarefas específicas',
    description: 'Direcionado a profissionais e músicos com padrões de perda de controle motor fino isolado (ex: cãibra do escrivão, distonia do músico), empregando relaxamento segmentar e barreira tátil.',
    guidelines: [
      'Suspenda imediatamente a atividade repetitiva no momento exato em que o padrão distônico/flexão do membro iniciar.',
      'Utilize adaptações de diâmetro macias em canetas, talheres ou ferramentas para modular o toque e a pressão proprioceptiva da mão.',
      'Exercite movimentos lentos conscientes no ar (sem fazer contato com papel ou teclado) para reeducar o plano de movimento motor.',
      'Desenvolva exercícios de isolamento sensitivo usando luvas finas de algodão ou texturas diferenciadas antes de praticar suas tarefas.',
      'Evite treinar persistindo por cima da distonia, o que apenas reforça o trajeto sináptico errôneo no córtex motor cortical.'
    ],
    videos: [
      {
        id: 'dfoc1',
        title: 'Princípios da Reeducação Sensório-Motora da Mão',
        duration: '14:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_foc_1',
        description: 'Estratégias inovadoras baseadas em desvinculação cortical e reprogramação de movimentos isolados sem co-contração.',
        audience: 'patient'
      },
      {
        id: 'dfoc2',
        title: 'Desenvolvimento e Fixação de Engrossadores de Utensílios',
        duration: '07:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_distonia_foc_2',
        description: 'Ideias criativas e baratas de como familiares podem adaptar talheres, copos e canetas com espuma para reduzir a carga proprioceptiva na mão afetada.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  },
  Sialorreia: {
    id: 'Sialorreia',
    title: 'Plano de Controle de Salivação Excessiva (Sialorreia)',
    subtitle: 'Facilitação deglutitória e vigilância de barreira cutânea',
    description: 'Plano para treinamento postural da cabeça, controle de vedamento labial, reforço do ritmo voluntário de deglutição salivar e profiláxia dermatológica perioral.',
    guidelines: [
      'Monitore e treine o posicionamento verticalizado do pescoço; a flexão anterior de cabeça favorece o escape passivo de saliva.',
      'Utilize alarmes discretos de vibração para recondicionar o ato regular e constante de deglutir saliva voluntariamente.',
      'Mantenha a pele perioral limpa e protegida com barreiras protetoras dermatológicas calmantes para evitar estomatites ou fissuras cutâneas.',
      'Realize exercícios de fortalecimento isométrico labial (manter lábios fechados segurando um depressor de língua de madeira leve).',
      'Monitore sinais de desidratação secundária ou alterações fonoaudiológicas persistentes na ingestão ou engasgos alimentares.'
    ],
    videos: [
      {
        id: 'sial1',
        title: 'Estratégias de Deglutição Ativa e Controle Labial',
        duration: '09:40',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516307361142-ff5d18153c1e?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_sialorreia_1',
        description: 'Métodos recomendados por fonoaudiólogos especializados para sincronizar engolir voluntariamente com alarmes discretos silenciosos.',
        audience: 'patient'
      },
      {
        id: 'sial2',
        title: 'Cuidados com a Barreira de Pele Perioral e Higiene Nutricional',
        duration: '08:10',
        thumbnailUrl: 'https://images.unsplash.com/photo-1573884199692-66176a00c4b3?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_sialorreia_2',
        description: 'Orientações práticas para familiares limparem e protegerem a zona perioral com pomadas de barreira, prevenindo inflamações incômodas.',
        audience: 'companion'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Salvar Registro Clínico Diario',
      fields: []
    }
  }
};
