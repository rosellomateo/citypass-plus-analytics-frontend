// src/components/common/AIAnalysisCard/AIAnalysisCard.tsx
import { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Cpu,
  Calendar,
  Layers,
} from 'lucide-react';
import type { AIAnalysisReport, AIAnalysisItem } from '../../../types';
import styles from './AIAnalysisCard.module.css';

interface AIAnalysisCardProps {
  report?: AIAnalysisReport;
  item?: AIAnalysisItem;
  defaultExpanded?: boolean;
}

export function AIAnalysisCard({ report, item: directItem, defaultExpanded = true }: AIAnalysisCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Extract analysis item from report or direct item prop
  const activeItem: AIAnalysisItem | undefined =
    directItem || (report && report.analisis && report.analisis.length > 0 ? report.analisis[0] : undefined);

  if (!activeItem || !activeItem.resumen) {
    return null;
  }

  const { resumen, metadata, semana } = activeItem;
  const llmInfo = metadata?.llm;
  const cifras = metadata?.cifras;
  const semanaDisplay = semana || metadata?.semana_actual || report?.ultima_semana;
  const casoDeUsoDisplay = metadata?.caso_de_uso || report?.caso_de_uso;

  return (
    <div className={styles.container} aria-label="Análisis Sintético de Inteligencia Artificial">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiBadge}>
            <Sparkles className={styles.aiIcon} />
            <span>Análisis IA</span>
          </div>
          <h2 className={styles.title}>
            Reporte de IA {casoDeUsoDisplay ? `— ${casoDeUsoDisplay.toUpperCase()}` : ''}
          </h2>
        </div>

        <div className={styles.headerRight}>
          {semanaDisplay && (
            <span className={styles.metaPill}>
              <Calendar size={12} />
              {semanaDisplay}
            </span>
          )}

          {llmInfo?.deployment && (
            <span className={styles.metaPill}>
              <Cpu size={12} />
              {llmInfo.deployment}
            </span>
          )}

          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Ocultar detalles' : 'Ver análisis completo'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Párrafo Ejecutivo */}
      {resumen.parrafo_ejecutivo && (
        <p className={styles.parrafoEjecutivo}>
          {resumen.parrafo_ejecutivo}
        </p>
      )}

      {/* Secciones detalladas expandibles */}
      {expanded && (
        <>
          <div className={styles.detailsGrid}>
            {/* Puntos destacados */}
            {resumen.puntos_destacados && resumen.puntos_destacados.length > 0 && (
              <div className={styles.sectionBox}>
                <div className={`${styles.sectionHeader} ${styles.highlightsTitle}`}>
                  <CheckCircle2 size={15} />
                  <span>Puntos Destacados</span>
                </div>
                <ul className={styles.list}>
                  {resumen.puntos_destacados.map((itemText, idx) => (
                    <li key={`highlight-${idx}`} className={styles.listItem}>
                      {itemText}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {resumen.recomendaciones && resumen.recomendaciones.length > 0 && (
              <div className={styles.sectionBox}>
                <div className={`${styles.sectionHeader} ${styles.recommendationsTitle}`}>
                  <Lightbulb size={15} />
                  <span>Recomendaciones</span>
                </div>
                <ul className={styles.list}>
                  {resumen.recomendaciones.map((itemText, idx) => (
                    <li key={`recommendation-${idx}`} className={styles.listItem}>
                      {itemText}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Riesgos */}
            {resumen.riesgos && resumen.riesgos.length > 0 && (
              <div className={styles.sectionBox}>
                <div className={`${styles.sectionHeader} ${styles.risksTitle}`}>
                  <AlertTriangle size={15} />
                  <span>Riesgos e Hipótesis</span>
                </div>
                <ul className={styles.list}>
                  {resumen.riesgos.map((itemText, idx) => (
                    <li key={`risk-${idx}`} className={styles.listItem}>
                      {itemText}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Metadatos técnicos */}
          {(metadata?.filas_enviadas !== undefined || metadata?.version_esquema) && (
            <div className={styles.techMetaRow}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                {metadata?.filas_enviadas !== undefined && (
                  <span>
                    <Layers size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                    Filas procesadas: {metadata.filas_enviadas}
                  </span>
                )}
                {metadata?.version_esquema && (
                  <span>Esquema v{metadata.version_esquema}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
