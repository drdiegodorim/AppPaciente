/**
 * Curated Care Plans for Neurological/Clinical Conditions - Only Chronic Migraine
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
      buttonLabel: 'Registrar Sintomas de Enxaqueca Crônica',
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
  }
};
