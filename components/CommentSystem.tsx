import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Date;
  likes: number;
  replies: Comment[];
  isLiked: boolean;
}

interface CommentSystemProps {
  commitmentId: string;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'replies' | 'isLiked'>) => void;
  onLikeComment: (commentId: string) => void;
  currentUserId?: string;
}

export default function CommentSystem({
  commitmentId,
  comments,
  onAddComment,
  onLikeComment,
  currentUserId,
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const commentData = {
      author: 'Current User',
      authorId: currentUserId || 'anonymous',
      content: newComment.trim(),
    };

    if (replyingTo) {
      // Handle reply logic here
      Alert.alert('Reply', 'Reply functionality would be implemented here');
    } else {
      onAddComment(commentData);
    }

    setNewComment('');
    setReplyingTo(null);
    setReplyText('');
  };

  const handleLikeComment = (commentId: string) => {
    onLikeComment(commentId);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderComment = (comment: Comment, isReply = false, depth = 0) => (
    <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{comment.author}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.likeButton, comment.isLiked && styles.likeButtonActive]}
          onPress={() => handleLikeComment(comment.id)}
        >
          <Ionicons
            name={comment.isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={comment.isLiked ? '#ef4444' : '#6b7280'}
          />
          <Text style={[styles.likeCount, comment.isLiked && styles.likeCountActive]}>
            {comment.likes}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setReplyingTo(comment.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
    </View>
  );

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
      </View>

      <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
        {comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
          </View>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </ScrollView>

      {/* Reply Input */}
      {replyingTo && (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyText}>Replying to comment</Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          value={replyingTo ? replyText : newComment}
          onChangeText={replyingTo ? setReplyText : setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.submitButton, (newComment.trim() || replyText.trim()) && styles.submitButtonActive]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() && !replyText.trim()}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  commentContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  replyContainer: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
  },
  likeButtonActive: {
    backgroundColor: '#fef2f2',
  },
  likeCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  likeCountActive: {
    color: '#ef4444',
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  replyContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 40,
    maxHeight: 100,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#6366f1',
  },
});