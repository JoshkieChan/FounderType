import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Commitment } from '../types/commitment';

interface CommitmentCardProps {
  commitment: Commitment;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default React.memo(function CommitmentCard({
  commitment,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}: CommitmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'abandoned':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  const daysLeft = Math.ceil(
    (new Date(commitment.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.commitmentText} numberOfLines={3}>
          {commitment.commitment_text}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(commitment.status) }]}>
          <Text style={styles.statusText}>{getStatusText(commitment.status)}</Text>
        </View>
      </View>

      {commitment.daily_action && (
        <Text style={styles.dailyAction} numberOfLines={2}>
          Daily: {commitment.daily_action}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {commitment.check_ins.length} days checked in
        </Text>
        {commitment.status === 'active' && (
          <Text style={styles.footerText}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
          </Text>
        )}
        <Text style={styles.footerText}>
          {new Date(commitment.created_at).toLocaleDateString()}
        </Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commitmentText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dailyAction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#ff3b30',
  },
});
