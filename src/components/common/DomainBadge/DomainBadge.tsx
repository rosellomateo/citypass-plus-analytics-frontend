// src/components/common/DomainBadge/DomainBadge.tsx
import type { Domain } from '../../../types';
import { DOMAIN_CONFIG } from '../../../config/domains';
import styles from './DomainBadge.module.css';

interface DomainBadgeProps {
  domain: Domain;
}

export function DomainBadge({ domain }: DomainBadgeProps) {
  const config = DOMAIN_CONFIG[domain];
  if (!config) return <span>{domain}</span>;

  return (
    <span
      className={styles.badge}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {config.label}
    </span>
  );
}
