import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  addComment,
  deleteMyComment,
  fetchComments,
} from "@/services/community";
import { MAX_COMMENT_LENGTH, type CommunityComment } from "@/types/community";
import { formatRelativeTime } from "@/utils/relativeTime";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CommentSheetProps = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  onCountChange?: (delta: number) => void;
};

export default function CommentSheet({
  visible,
  postId,
  onClose,
  onCountChange,
}: CommentSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!postId) {
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchComments(postId);
      setComments(rows);
    } catch {
      showToast(t("community.commentsLoadError"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [postId, showToast, t]);

  useEffect(() => {
    if (visible && postId) {
      void load();
      setBody("");
    }
  }, [visible, postId, load]);

  const handleSend = async () => {
    if (!user || !postId || !body.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const created = await addComment(postId, user.id, body);
      setComments((current) => [...current, created]);
      setBody("");
      onCountChange?.(1);
    } catch {
      showToast(t("community.commentsSendError"), "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) {
      return;
    }

    try {
      await deleteMyComment(commentId, user.id);
      setComments((current) => current.filter((c) => c.id !== commentId));
      onCountChange?.(-1);
      showToast(t("community.commentsDeleteSuccess"), "success");
    } catch {
      showToast(t("community.commentsDeleteError"), "error");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetWrap}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(
                  insets.bottom,
                  Platform.OS === "android" ? 28 : 12,
                ),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("community.commentsTitle")}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={10} testID="comments-close-btn">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={colors.accent} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={
                  comments.length === 0 ? styles.emptyList : undefined
                }
                ListEmptyComponent={
                  <Text style={[styles.empty, { color: colors.textSecondary }]}>
                    {t("community.commentsEmpty")}
                  </Text>
                }
                renderItem={({ item }) => {
                  const isOwner = user?.id === item.author_id;
                  const name =
                    item.author?.display_name?.trim() || t("community.unknownAuthor");

                  return (
                    <View style={styles.commentRow} testID={`comment-${item.id}`}>
                      <View style={styles.commentBody}>
                        <Text style={[styles.commentAuthor, { color: colors.text }]}>
                          {name}
                          <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>
                            {"  "}
                            {formatRelativeTime(item.created_at, i18n.language)}
                          </Text>
                        </Text>
                        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                          {item.body}
                        </Text>
                      </View>
                      {isOwner ? (
                        <TouchableOpacity
                          onPress={() => void handleDelete(item.id)}
                          hitSlop={8}
                          testID={`delete-comment-${item.id}`}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.alert} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}

            {user ? (
              <View style={styles.composer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  value={body}
                  onChangeText={(value) => setBody(value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder={t("community.commentsPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  maxLength={MAX_COMMENT_LENGTH}
                  testID="comment-input"
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    { backgroundColor: colors.accent },
                    (!body.trim() || isSending) && styles.sendDisabled,
                  ]}
                  onPress={() => void handleSend()}
                  disabled={!body.trim() || isSending}
                  testID="comment-send-btn"
                >
                  {isSending ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.background} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.loginHint, { color: colors.textSecondary }]}>
                {t("community.commentsLoginHint")}
              </Text>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheetWrap: {
      width: "100%",
      maxHeight: "80%",
    },
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 14,
      minHeight: 320,
      maxHeight: "100%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    title: {
      fontSize: 17,
      fontWeight: "800",
    },
    list: {
      flexGrow: 0,
      maxHeight: 360,
    },
    emptyList: {
      paddingVertical: 28,
      alignItems: "center",
    },
    empty: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "500",
    },
    commentRow: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBorder,
    },
    commentBody: {
      flex: 1,
      gap: 4,
    },
    commentAuthor: {
      fontSize: 13,
      fontWeight: "700",
    },
    commentText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    composer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      minHeight: 46,
    },
    sendBtn: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: {
      opacity: 0.5,
    },
    loginHint: {
      textAlign: "center",
      marginTop: 12,
      marginBottom: 4,
      fontSize: 13,
      fontWeight: "500",
    },
  });
}
