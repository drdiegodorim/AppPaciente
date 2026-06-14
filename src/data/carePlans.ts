/**
 * Curated Care Plans for the 10 Neurological/Clinical Conditions
 */

import { CarePlanContent } from '../types';

export const CLINICAL_CARE_PLANS: Record<string, CarePlanContent> = {
  Enxaqueca: {
    id: 'Enxaqueca',
    title: 'Plano de Cuidado para Enxaqueca',
    subtitle: 'Controle de gatilhos e diário de dor',
    description: 'Este plano é focado no mapeamento detalhado de crises de cefaleia, identificação rápida de gatilhos alimentares, comportamentais e de sono, além do registro rigoroso de analgésicos para prevenir a cefaleia por rebote.',
    guidelines: [
      'Mantenha rotinas de sono super regulares, inclusive aos finais de semana (evite dormir demais ou de menos).',
      'Registre os alimentos consumidos 12 horas antes do início de qualquer crise (ex: queijos amarelos, embutidos, chocolate, adoçantes).',
      'Hidrate-se com constância: beba de 2.5L a 3L de água ao longo de todo o dia.',
      'Limite o uso de analgésicos comuns a no máximo 2 dias por semana para evitar o ciclo de cefaleia crônica medicamentosa.',
      'Pratique atividades aeróbicas leves de forma consistente (mínimo 3 vezes por semana, fora dos momentos de crise intensa).'
    ],
    videos: [
      {
        id: '1',
        title: 'Entendo a Fisiologia da Enxaqueca e suas Fases',
        duration: '12:45',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_1',
        description: 'Aprenda sobre o pródromo, aura, fase de dor e pósdromo, e como atuar em cada uma delas para mitigar os sintomas.'
      },
      {
        id: '2',
        title: 'Alongamentos Cervicais e Técnicas de Relaxamento',
        duration: '08:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_2',
        description: 'Exercícios específicos guiados para liberar a musculatura do trapézio e suboccipitais, que frequentemente agravam crises.'
      },
      {
        id: '3',
        title: 'Higiene do Sono para Enxaqueca Crônica',
        duration: '10:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_migraine_3',
        description: 'Passo a passo prático para criar um ritual de desaceleração noturna e melhorar a estabilidade do limiar da dor.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Sintomas de Enxaqueca',
      fields: [
        {
          id: 'painScale',
          label: 'Intensidade Máxima da Dor Hoje (0 a 10)',
          type: 'scale',
          min: 0,
          max: 10
        },
        {
          id: 'triggers',
          label: 'Gatilhos Prováveis Observados',
          type: 'select',
          options: ['Nenhum', 'Falta de sono', 'Excesso de telas', 'Alimentação específica', 'Estresse/Ansiedade', 'Mudança climática', 'Esforço físico intenso']
        },
        {
          id: 'medicationUsed',
          label: 'Utilizou Medicamento de Resgate Hoje?',
          type: 'boolean'
        },
        {
          id: 'medName',
          label: 'Se sim, qual medicamento e dosagem?',
          type: 'text',
          placeholder: 'Ex: Triptano 80mg, Dipirona 1g...'
        }
      ]
    }
  },
  Parkinson: {
    id: 'Parkinson',
    title: 'Plano de Cuidado para Doença de Parkinson',
    subtitle: 'Mobilidade constante e adesão à medicação',
    description: 'Plano com ênfase na manutenção de marcos motores, estimulação cognitiva direcionada, segurança domiciliar contra quedas e rigidez nas janelas de administração farmacológica (efeitos ON/OFF).',
    guidelines: [
      'Tome a levodopa rigorosamente no horário prescrito. Programe alarmes repetidos no celular.',
      'Substitua tapetes soltos no domicílio por superfícies antiderrapantes e adicione barras de apoio se houver instabilidade postural.',
      'Siga os blocos de exercícios de fisioterapia motora por pelo menos 15 a 20 minutos todos os dias na fase ON.',
      'Evite comer grandes porções de proteínas de origem animal logo no horário de tomar a Levodopa, pois proteínas competem na absorção intestinal.'
    ],
    videos: [
      {
        id: '1',
        title: 'Mecanismo de Ação e Efeito ON/OFF da Medicação',
        duration: '15:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_parkinson_1',
        description: 'Entenda por que manter o horário exato da Levodopa é crítico para evitar períodos de congelamento motor.'
      },
      {
        id: '2',
        title: 'Treino de Marcha e Estratégias contra Frémitos ou Trava (Freezing)',
        duration: '11:10',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_parkinson_2',
        description: 'Dicas visuais e de ritmo sonoro para destravar a caminhada quando os pés parecerem "colados" ao solo.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Evolução de Parkinson',
      fields: [
        {
          id: 'tremorLevel',
          label: 'Intensidade dos Tremores Predominantes Hoje',
          type: 'select',
          options: ['Nenhum / Muito Baixo', 'Leve (intermitente, não bloqueia tarefas)', 'Moderado (sentido em repouso e ação)', 'Grave (impacta alimentação/escrita)']
        },
        {
          id: 'rigidity',
          label: 'Nível de Rigidez ou Sensação de Peso no Corpo',
          type: 'select',
          options: ['Ausente', 'Leve (membros flexíveis, pouca lentidão)', 'Moderada (alguma lentidão nas trocas de postura)', 'Intensa (dificuldade de movimentação de braços ou pernas)']
        },
        {
          id: 'adherence',
          label: 'Tomou todos os comprimidos rigorosamente no horário sugerido?',
          type: 'boolean'
        },
        {
          id: 'freezingIncidents',
          label: 'Teve episódios de congelamento de marcha (freezing) hoje?',
          type: 'boolean'
        }
      ]
    }
  },
  Demencia: {
    id: 'Demencia',
    title: 'Plano de Cuidado para Demências',
    subtitle: 'Estimulação cognitiva de suporte e estabilidade de humor',
    description: 'Um direcionamento voltado a cuidadores e familiares, priorizando a segurança contra desorientação, estimulação da memória recente, exercícios de autonomia estruturados e controle de alterações vespertinas (sinal do pôr do sol).',
    guidelines: [
      'Mantenha o ambiente familiar bem iluminado durante a tarde para amenizar a agitação de fim de tarde (síndrome do pôr do sol).',
      'Use um calendário visível na parede com o dia da semana atualizado em conjunto com o paciente todas as manhãs.',
      'Incentive a autonomia no banheiro e alimentação, oferecendo escolhas simples (ex: oferecer duas opções de camisas, em vez de deixar o guarda-roupa aberto).',
      'Promova atividades físicas leves orientadas ou caminhadas curtas na luz direta do sol nascente para estabilizar o ciclo vigília-sono.'
    ],
    videos: [
      {
        id: '1',
        title: 'Abordagens Não Farmacológicas para Ansiedade e Agitação',
        duration: '18:40',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_dementia_1',
        description: 'Técnicas de comunicação afetiva, validação da memória emocional e interrupção compassiva de ciclos repetitivos de comportamento.'
      },
      {
        id: '2',
        title: 'Atividades Práticas de Estimulação Cognitiva em Casa',
        duration: '14:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_dementia_2',
        description: 'Exercícios práticos envolvendo reminiscência com álbuns de fotos antigos, jogos adaptados de encaixe e música terapêutica.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Diário do Cuidador (Demência)',
      fields: [
        {
          id: 'dominantHumor',
          label: 'Humor/Comportamento Predominante do Paciente Hoje',
          type: 'select',
          options: ['Calmo e Cooperativo', 'Agitado / Irritado', 'Sonolento / Apático', 'Confuso / Desorientado temporariamente', 'Oscilante (agitado no pôr-do-sol)']
        },
        {
          id: 'sleepHours',
          label: 'Qualidade do Sono da Noite Anterior',
          type: 'select',
          options: ['Excelente (dormiu a noite inteira)', 'Regular (acordou de 1 a 2 vezes)', 'Inquieto (trocou o dia pela noite ou perambulou)']
        },
        {
          id: 'cognitiveActivities',
          label: 'Fez algum exercício de memória, pintura ou terapia de reminiscência hoje?',
          type: 'boolean'
        },
        {
          id: 'foodIntake',
          label: 'Alimentação e Hidratação Adequadas?',
          type: 'boolean'
        }
      ]
    }
  },
  Epilepsia: {
    id: 'Epilepsia',
    title: 'Plano de Cuidado para Epilepsia',
    subtitle: 'Controle de crises refratárias e segurança',
    description: 'Este plano fornece diretrizes para registrar adequadamente os episódios de crises parciais ou generalizadas, rastrear privações de sono associadas, monitorar a correta tomada de remédios antiepilépticos e orientar condutas de primeiros socorros.',
    guidelines: [
      'Nunca interrompa abruptamente as doses dos anticonvulsivantes, pois o esquecimento é o maior gatilho para o Status Epilepticus.',
      'Em caso de crise tônico-clônica, os cuidadores devem colocar o paciente de lado (decúbito lateral), proteger a cabeça com algo macio e NUNCA inserir objetos na boca.',
      'Siga um cronograma fixo para dormir. A fadiga do cérebro por noites mal dormidas reduz significativamente o limiar convulsivo.',
      'Mantenha o registro de todos os eventos com indicação de data, hora e duração aproximada.'
    ],
    videos: [
      {
        id: '1',
        title: 'Conduta Imediata de Primeiros Socorros em Crises Convulsivas',
        duration: '09:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_epilepsy_1',
        description: 'Vídeo essencial para familiares e amigos aprenderem a desmistificar a crise convulsiva e agir com máxima segurança.'
      },
      {
        id: '2',
        title: 'Epilepsia e Hábitos: O Impacto Oculto do Sono e Álcool',
        duration: '12:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_epilepsy_2',
        description: 'Discussão detalhada sobre gatilhos neurofisiológicos bizarros e rotina de profilaxia.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Ocorrências de Crises',
      fields: [
        {
          id: 'hadSeizures',
          label: 'Houve Ocorrência de Crise Hoje?',
          type: 'boolean'
        },
        {
          id: 'seizureCount',
          label: 'Se sim, quantas crises observadas?',
          type: 'number',
          placeholder: 'Ex: 1, 2...'
        },
        {
          id: 'crisisDuration',
          label: 'Duração Média das Crises (em minutos ou segundos)',
          type: 'text',
          placeholder: 'Ex: 40 segundos, 2 minutos...'
        },
        {
          id: 'medAdherence',
          label: 'Tomou todos os comprimidos antiepilépticos hoje?',
          type: 'boolean'
        }
      ]
    }
  },
  Espasticidade: {
    id: 'Espasticidade',
    title: 'Plano de Cuidado para Espasticidade',
    subtitle: 'Prevenção de encurtamentos e controle do tônus muscular',
    description: 'Orientado para regulação da rigidez em membros pós-AVC, trauma ou esclerose múltipla, destacando rotinas de alongamento diário, mobilização articular terapêutica e cuidados com posicionamento noturno.',
    guidelines: [
      'Efetue alongamentos passivos e lentos em grupos musculares acometidos, mantendo a postura de estiramento por 30 segundos cada vez.',
      'Sempre monitore as áreas de dobras musculares e pele sensível para verificar o surgimento de úlceras de pressão decorrentes da contração contínua.',
      'Observe se fatores estressores externos como infecções urinárias ou unhas encravadas provocaram um agravamento súbito do tônus (espasmos flexores).',
      'Use órteses posicionadoras (tutor de punho/pé) conforme recomendado, alternando com repouso para evitar rigidez articular fixa.'
    ],
    videos: [
      {
        id: '1',
        title: 'Técnicas de Mobilização Passiva para Espasticidade de Membros',
        duration: '14:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_spas_1',
        description: 'Demonstração para cuidadores sobre como segurar braços e pernas de forma firme mas gentil, evitando traumas de estiramento.'
      },
      {
        id: '2',
        title: 'Sincronização de Órteses e Treinos Posturais',
        duration: '10:05',
        thumbnailUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_spas_2',
        description: 'Melhores práticas no encaixe de calhas e talas com o paciente relaxado.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Nível de Espasticidade',
      fields: [
        {
          id: 'stiffnessLevel',
          label: 'Como avalia a rigidez muscular na maior parte do dia hoje?',
          type: 'select',
          options: ['Leve (membro flexiona com pouco esforço)', 'Moderada (resistência marcante, mas vence-se com calma)', 'Intensa (membro muito rígido ou travado, de difícil manuseio)', 'Contínua / Espasmos dolorosos frequentes']
        },
        {
          id: 'stretchingDone',
          label: 'Fez os blocos descritos de alongamento hoje?',
          type: 'boolean'
        },
        {
          id: 'painImpact',
          label: 'Escala de desconforto ou dor relacionada à espasticidade (0 a 10)',
          type: 'scale',
          min: 0,
          max: 10
        },
        {
          id: 'spasmCount',
          label: 'Teve espasmos ou sobressaltos involuntários intensos hoje?',
          type: 'boolean'
        }
      ]
    }
  },
  Bruxismo: {
    id: 'Bruxismo',
    title: 'Plano de Cuidado para Bruxismo',
    subtitle: 'Descompressão orofacial e controle de apertamento',
    description: 'Plano voltado a evitar desgastes dentários, cefaleia tempero-mandibular episódica e dores faciais diárias decorrentes do apertamento (bruxismo de vigília) e atrito noturno.',
    guidelines: [
      'Ative lembretes visuais ou alarmes no celular ao longo do dia para conferir: "Dentes encostados?". Lembre-se: dentes só se encontram na mastigação.',
      'Higienize e encaixe a placa miorrelaxante todas as noites antes de adormecer. Nunca durma sem ela.',
      'Realize automassagem circular nas laterais da bochecha (músculo masseter) e sêmulas nas têmporas por 2 minutos antes de deitar.',
      'Evite consumir cafeína, bebidas energéticas ou doces muito concentrados após as 18 horas.'
    ],
    videos: [
      {
        id: '1',
        title: 'Automassagem Orofacial para Alívio Descompressivo',
        duration: '07:45',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_brux_1',
        description: 'Técnica passo a passo usando as polpas dos dedos para descolar fibras de masseter e temporal que acumulam tensão.'
      },
      {
        id: '2',
        title: 'O que é o Bruxismo de Vigília e Como Prevenir?',
        duration: '09:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_brux_2',
        description: 'Aprenda estratégias de mindfulness facial e biofeedback ativo para manter os lábios fechados e os dentes separados.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Diário de Tensão Orofacial',
      fields: [
        {
          id: 'morningPain',
          label: 'Acordou hoje com dor, cansaço ou peso na mandíbula / têmporas?',
          type: 'boolean'
        },
        {
          id: 'plateUsed',
          label: 'Usou a placa de mordida durante todo o sono ontem à noite?',
          type: 'boolean'
        },
        {
          id: 'clenchWatch',
          label: 'Se percebeu apertando os dentes durante o período acordado?',
          type: 'select',
          options: ['Não observei em momento algum', 'Poucas vezes e liberei imediatamente', 'Frequentemente durante tarefas estressantes ou telas', 'Forte aperto constante sem perceber']
        },
        {
          id: 'stressLevel',
          label: 'Nível Geral de Estresse / Ansiedade Hoje (0 a 10)',
          type: 'scale',
          min: 0,
          max: 10
        }
      ]
    }
  },
  'Distonia cervical': {
    id: 'Distonia cervical',
    title: 'Plano para Distonia Cervical (Torcicolo Espasmódico)',
    subtitle: 'Reabilitação postural e gestos contornantes',
    description: 'Estratégias específicas para gerenciar torcicolo muscular involuntário com ajuda de feedback sensorial ("truques sensoriais / gestos antagonistas"), relaxamento assistido e monitoramento do cronograma de Toxina Botulínica.',
    guidelines: [
      'Utilize os truques sensoriais recomendados (ex: encostar levemente o indicador no queixo ou lateral do rosto) para atenuar o espasmo de torção.',
      'Evite lutar rigidamente contra o espasmo com força bruta; procure focar na respiração diafragmática para dissipar o calor gerado pela contração.',
      'Siga a cartilha de postura ortostática com apoio pélvico adequado ao se sentar em frente ao computador.',
      'Registre diariamente o grau de controle da cabeça e o impacto da dor nos músculos esplênios e esternocleidomastoideos.'
    ],
    videos: [
      {
        id: '1',
        title: 'Mapeando os Seus Truques Sensoriais (Sensory Tricks)',
        duration: '11:30',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_cervical_1',
        description: 'Como pequenos toques sutis no pescoço ou mandíbula restabelecem momentaneamente a simetria cefálica por reflexos neurológicos.'
      },
      {
        id: '2',
        title: 'Alongamentos Leves para a Cadeia Posterior e Quadrado Lombar',
        duration: '13:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_cervical_2',
        description: 'Preservando a mobilidade do corpo de forma integrada para compensar as assimetrias cervicais.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Status de Controle Cervical',
      fields: [
        {
          id: 'cervicalPain',
          label: 'Escala de Dor Muscular no Pescoço Hoje (0 a 10)',
          type: 'scale',
          min: 0,
          max: 10
        },
        {
          id: 'postureControl',
          label: 'Grau de Alinhamento da Cabeça Hoje',
          type: 'select',
          options: ['Ótimo / Praticamente centralizado', 'Bom (pequena rotação que corrijo com facilidade)', 'Dificultoso (cabeça pende para o lado de forma incômoda)', 'Grave rotação sustentada (espasmo constante)']
        },
        {
          id: 'sensoryTrickWorked',
          label: 'Tentou usar algum toque de escape (truque sensorial) hoje? Funcionou?',
          type: 'select',
          options: ['Não precisei usar', 'Usei e ajudou a acalmar o espasmo temporariamente', 'Usei mas a eficácia foi nula ou muito baixa', 'Não sei aplicar']
        },
        {
          id: 'botoxDays',
          label: 'Há quantos dias ou semanas usou Toxina Botulínica pela última vez? (Escreva livremente)',
          type: 'text',
          placeholder: 'Ex: Aplicado há 2 semanas, há 3 meses...'
        }
      ]
    }
  },
  'Distonia de face': {
    id: 'Distonia de face',
    title: 'Plano de Cuidado para Distonia Facial',
    subtitle: 'Gerenciamento de Blefaroespasmo e Espasmo Hemifacial',
    description: 'Treino e descompressão sensorial com o objetivo de reduzir piscamento forçado crônico e distorções involuntárias dos músculos faciais ou orbicular dos olhos.',
    guidelines: [
      'Use óculos escuros com filtro ultravioleta ao ar livre ou em salas fluorescentes claras, pois a foto-sensibilidade é o principal amplificador do piscamento involuntário.',
      'Se o belfaroespasmo travar suas pálpebras, experimente cantarolizar ou falar em voz alta de forma contínua para inibir o espasmo pelo reflexo motor secundário.',
      'Crie intervalos regulares ao ler ou usar telas, fechando as pálpebras delicadamente com repouso de 1 minuto.',
      'Lubrifique as córneas com lágrima artificial prescrita para mitigar a secura que serve de gatilho mecânico.'
    ],
    videos: [
      {
        id: '1',
        title: 'Manobras de Alívio e Truques Reabilitativos Faciais',
        duration: '09:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_face_1',
        description: 'Vídeo instrutivo sobre manobras de ativação de outros nervos cranianos para interromper ciclos de piscar forçado involuntário.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Diário Facial',
      fields: [
        {
          id: 'spasmFrequency',
          label: 'Frequência dos espasmos faciais ou travamentos palpebrais hoje',
          type: 'select',
          options: ['Raros (ocorreu apenas poucas vezes isoladas)', 'Ocasional (sentidos ao conversar ou ler um pouco)', 'Frequente (atrapalha leitura ou assistir TV por alguns momentos)', 'Grave / Sustentado (impossibilita manter olhos abertos por minutos)']
        },
        {
          id: 'visLightSensitivity',
          label: 'Claridade ou telas prejudicaram muito a visão hoje?',
          type: 'boolean'
        },
        {
          id: 'eyeLubrication',
          label: 'Fez o uso programado de colírios lubrificantes hoje?',
          type: 'boolean'
        }
      ]
    }
  },
  'Distonia focal': {
    id: 'Distonia focal',
    title: 'Plano de Cuidado para Distonia Focal',
    subtitle: 'Reabilitação neuromotora para espasmos ocupacionais',
    description: 'Voltado às distonias focais específicas de tarefas, tais como Câimbra do Escrivão, distonia dos músicos ou esportistas, visando readaptações posturais e descondicionamento sensorial aberrante.',
    guidelines: [
      'Não insista em continuar a treinar sob o efeito claro do espasmo para evitar o reforço da via de conexão patológica no córtex motor.',
      'Utilize acessórios facilitadores se aplicáveis (engrossadores de caneta ergonomicamente moldados, luvas de cetim/toque para músicos, etc.).',
      'Faça exercícios de discriminação tátil ativa (tocar em texturas variadas com os olhos vendados) para restaurar o mapeamento cortical do membro afetado.',
      'Alterne períodos curtos de prática focada (ex: digitar ou tocar por 5 minutos) com alongamentos e relaxamento articular total.'
    ],
    videos: [
      {
        id: '1',
        title: 'Neuropatologia da Distonia de Tarefa Específica e Córtex Motor',
        duration: '13:10',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_focal_1',
        description: 'Uma aula didática de como o cérebro "borra" as bordas de comando muscular e como estratégias de discriminação ajudam.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Sessão de Reabilitação',
      fields: [
        {
          id: 'taskStiffness',
          label: 'Grau de travamento ou espasmo na realização da tarefa alvo',
          type: 'select',
          options: ['Ausente / Permitiu fazer sem barreira importante', 'Leve (espasmo leve, consigo flexionar de forma quase natural)', 'Moderado (perda importante de agilidade, exige pausas)', 'Intenso (membro trava totalmente na tentativa, forçando parada)']
        },
        {
          id: 'rehabTime',
          label: 'Quanto tempo dedicou a rotinas de reabilitação ou tarefas guiadas hoje?',
          type: 'select',
          options: ['Não pratiquei hoje', 'Menos de 15 minutos', 'De 15v a 30 minutos', 'Mais de 30 minutos']
        },
        {
          id: 'handSplintUsed',
          label: 'Usou alguma adaptação física ou truque cinestésico tátil hoje?',
          type: 'boolean'
        }
      ]
    }
  },
  Sialorreia: {
    id: 'Sialorreia',
    title: 'Plano de Cuidado para Sialorréia (Excesso de Salivação)',
    subtitle: 'Exercícios de deglutição, hidratação equilibrada e controle bucal',
    description: 'Orientado para auxiliar pacientes com paralisias, sequelas ou doenças motoras que causam acúmulo excessivo e escape de saliva na cavidade oral, evitando dermatite perioral e riscos de aspiração traqueal.',
    guidelines: [
      'Realize os exercícios programados de deglutição forçada sugeridos pela fonoaudiologia no mínimo 3 vezes ao dia.',
      'Mantenha a cabeça discretamente fletida anteriormente ou com postura alinhada na cadeira para evitar que o acúmulo escorra para a traqueia pela gravidade passiva.',
      'Efetue limpeza da pele ao redor da boca com lenços suaves dando toques, sem esfregar para não irritar ou causar dermatites.',
      'Sipe pequenos goles de água gelada constantemente para estimular a deglutição espontânea.'
    ],
    videos: [
      {
        id: '1',
        title: 'Manobras Fonoaudiológicas Clínicas para Controle de Deglutição',
        duration: '10:50',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=mock_sial_1',
        description: 'Instruções práticas para guiar e fortalecer reflexos palatares e linguais fundamentais para a deglutição.'
      }
    ],
    trackerConfig: {
      buttonLabel: 'Registrar Controle de Salivação',
      fields: [
        {
          id: 'droolingLevel',
          label: 'Como avaliou a gravidade do escape de saliva (babas) hoje?',
          type: 'select',
          options: ['Contido (lábios e pele ficaram totalmente secos hoje)', 'Leve (apenas os lábios levemente úmidos de vez em quando)', 'Moderado (escorreu ocasionalmente para queixo, exigindo lenço)', 'Severo (salivação abundante com roupa ou travesseiro muito molhados)']
        },
        {
          id: 'swallowExercises',
          label: 'Efetuou os exercícios de conscientização de engolimento hoje?',
          type: 'boolean'
        },
        {
          id: 'skinIrritation',
          label: 'Houve feridas ou vermelhidão na região dos cantos da boca hoje?',
          type: 'boolean'
        }
      ]
    }
  }
};
