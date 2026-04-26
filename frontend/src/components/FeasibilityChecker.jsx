'use client'

import { useState, useEffect } from 'react'
import styles from './FeasibilityChecker.module.css'

export default function FeasibilityChecker({ projectId, onClose }) {
  const [feasibilityData, setFeasibilityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkFeasibility()
  }, [projectId])

  const checkFeasibility = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/feasibility`)
      if (!response.ok) {
        throw new Error('Failed to check project feasibility')
      }
      const data = await response.json()
      setFeasibilityData(data)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>⏳ Checking feasibility...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
        <button className={styles.retryBtn} onClick={checkFeasibility}>
          Retry
        </button>
      </div>
    )
  }

  if (!feasibilityData) return null

  const statusConfig = {
    FEASIBLE: { emoji: '✅', color: '#52B788', bg: 'rgba(82, 183, 136, 0.1)' },
    RISKY: { emoji: '⚠️', color: '#F0A500', bg: 'rgba(240, 165, 0, 0.1)' },
    NOT_FEASIBLE: { emoji: '❌', color: '#E84040', bg: 'rgba(232, 64, 64, 0.1)' },
  }

  const status = feasibilityData.feasibility_status
  const config = statusConfig[status] || statusConfig.RISKY

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Feasibility Analysis</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className={styles.statusBadge} style={{ borderColor: config.color, backgroundColor: config.bg }}>
        <span className={styles.statusEmoji}>{config.emoji}</span>
        <span className={styles.statusText}>{status}</span>
      </div>

      {/* Project Info */}
      <div className={styles.projectInfo}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Project:</span>
          <span className={styles.value}>{feasibilityData.project_name}</span>
        </div>
        {feasibilityData.project_status && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value}>{feasibilityData.project_status}</span>
          </div>
        )}
        {feasibilityData.project_priority && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Priority:</span>
            <span className={styles.value}>{'⭐'.repeat(feasibilityData.project_priority)}</span>
          </div>
        )}
      </div>

      {/* Required Materials */}
      {feasibilityData.required_items && feasibilityData.required_items.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            📋 Required Materials ({feasibilityData.required_items.length})
          </h3>
          <div className={styles.itemsList}>
            {feasibilityData.required_items.map((item) => (
              <div key={item.inventory_id} className={styles.item}>
                <div className={styles.itemName}>{item.item_name}</div>
                <div className={styles.itemDetails}>
                  <span className={styles.required}>
                    Need: {item.required_quantity} {item.unit}
                  </span>
                  <span className={styles.available}>
                    Have: {item.available_quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Materials */}
      {feasibilityData.missing_items && feasibilityData.missing_items.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            ❌ Missing Materials ({feasibilityData.missing_items.length})
          </h3>
          <div className={styles.itemsList}>
            {feasibilityData.missing_items.map((item) => (
              <div key={item.inventory_id} className={`${styles.item} ${styles.missing}`}>
                <div className={styles.itemName}>{item.item_name}</div>
                <div className={styles.itemDetails}>
                  <span className={styles.missing}>
                    Missing: {item.missing_quantity} {item.unit}
                  </span>
                  <span className={styles.available}>
                    Available: {item.available_quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risky Materials */}
      {feasibilityData.risky_items && feasibilityData.risky_items.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            ⚠️ Low Stock After Use ({feasibilityData.risky_items.length})
          </h3>
          <div className={styles.itemsList}>
            {feasibilityData.risky_items.map((item) => (
              <div key={item.inventory_id} className={`${styles.item} ${styles.risky}`}>
                <div className={styles.itemName}>{item.item_name}</div>
                <div className={styles.itemDetails}>
                  <span className={styles.neutral}>
                    After use: {item.remaining_after_use} {item.unit}
                  </span>
                  <span className={styles.neutral}>
                    Min required: {item.min_required_in_stock} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Action */}
      {feasibilityData.suggested_action && (
        <div className={styles.actionBox}>
          <div className={styles.actionLabel}>📌 Suggested Action:</div>
          <div className={styles.actionText}>{feasibilityData.suggested_action}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button className={styles.refreshBtn} onClick={checkFeasibility}>
          🔄 Refresh
        </button>
        {onClose && (
          <button className={styles.closeActionBtn} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
