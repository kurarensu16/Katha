from django.contrib import admin
from .models import Post, Comment, Vote, SavedPost, Notification, CommentVote, Feedback


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'votes', 'created_at', 'is_edited')
    search_fields = ('title', 'content', 'author__username')
    list_filter = ('created_at', 'is_edited')
    ordering = ('-created_at',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'author', 'created_at', 'is_edited', 'parent')
    search_fields = ('text', 'author__username', 'post__title')
    list_filter = ('created_at', 'is_edited')
    ordering = ('-created_at',)


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'value', 'created_at')
    list_filter = ('value', 'created_at')
    search_fields = ('user__username', 'post__title')
    ordering = ('-created_at',)


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'saved_at')
    search_fields = ('user__username', 'post__title')
    ordering = ('-saved_at',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type', 'post', 'comment', 'actor', 'read', 'created_at')
    list_filter = ('notification_type', 'read', 'created_at')
    search_fields = ('user__username', 'actor__username', 'post__title')
    ordering = ('-created_at',)


@admin.register(CommentVote)
class CommentVoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'comment', 'value', 'created_at')
    list_filter = ('value', 'created_at')
    search_fields = ('user__username', 'comment__id')
    ordering = ('-created_at',)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'user', 'email', 'subject', 'short_message', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('subject', 'message', 'email', 'user__username')
    ordering = ('-created_at',)

    def short_message(self, obj):
        if not obj.message:
            return ''
        preview = obj.message.strip()
        return (preview[:120] + '…') if len(preview) > 120 else preview
    short_message.short_description = 'Message'
