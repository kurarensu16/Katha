from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Vote, SavedPost, Notification, CommentVote, Feedback
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions

# --- AUTHENTICATION SERIALIZER ---
class UserSerializer(serializers.ModelSerializer):
    """Serializer for User registration and updates."""
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'date_joined')
        read_only_fields = ('id', 'date_joined')
    
    def validate_username(self, value):
        """Validate username format and uniqueness."""
        import re
        
        # Check length
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if len(value) > 30:
            raise serializers.ValidationError("Username must be 30 characters or less.")
        
        # Check format (only alphanumeric and underscores)
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores.")
        
        # Check if username is just digits (not allowed)
        if value.isdigit():
            raise serializers.ValidationError("Username cannot be just numbers.")
        
        # Check uniqueness (exclude current user if updating)
        user = self.instance
        if user:
            existing = User.objects.filter(username=value).exclude(id=user.id).exists()
        else:
            existing = User.objects.filter(username=value).exists()
        
        if existing:
            raise serializers.ValidationError("This username is already taken.")
        
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=password,
        )
        return user
    
    def update(self, instance, validated_data):
        # Don't update password through this serializer (use separate password change endpoint)
        validated_data.pop('password', None)
        return super().update(instance, validated_data)

    def validate(self, attrs):
        """Run password validators on registration."""
        # Only validate on create (no instance present)
        if self.instance is None:
            password = attrs.get('password')
            if not password:
                raise serializers.ValidationError({'password': 'Password is required when creating a user.'})

            # Build a temporary user object for contextual validators
            temp_user = User(username=attrs.get('username') or '')
            try:
                validate_password(password, user=temp_user)
            except django_exceptions.ValidationError as e:
                raise serializers.ValidationError({'password': list(e.messages)})
        return super().validate(attrs)

# --- POST AND COMMENT SERIALIZERS ---
class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    replies = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_username', 'text', 'created_at', 'edited_at', 'is_edited', 'parent', 'votes', 'user_vote', 'replies']
        read_only_fields = ('author', 'votes', 'user_vote', 'edited_at', 'is_edited', 'created_at')

    def get_replies(self, obj):
        # Recursively serialize replies for nested comments
        replies = obj.replies.all()
        return CommentSerializer(replies, many=True, context=self.context).data
    
    def get_user_vote(self, obj):
        """Returns the current user's vote value (1, -1, or 0 if no vote)."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = CommentVote.objects.get(user=request.user, comment=obj)
                return vote.value
            except CommentVote.DoesNotExist:
                return 0
        return 0
    
    def validate_parent(self, value):
        # Allow parent to be None for top-level comments
        return value


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    comment_count = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_username', 'created_at', 'edited_at', 'is_edited', 'votes', 'comment_count', 'comments', 'user_vote', 'is_saved']
        read_only_fields = ('author', 'votes', 'comment_count', 'user_vote', 'is_saved', 'edited_at', 'is_edited')
    
    def get_comment_count(self, obj):
        # Only count top-level comments for the feed
        return obj.comments.filter(parent__isnull=True).count()

    def get_comments(self, obj):
        # Fetch only top-level comments (parent__isnull=True) for the detail view
        top_level_comments = obj.comments.filter(parent__isnull=True)
        return CommentSerializer(top_level_comments, many=True).data

    def get_user_vote(self, obj):
        """Returns the current user's vote value (1, -1, or 0 if no vote)."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = Vote.objects.get(user=request.user, post=obj)
                return vote.value
            except Vote.DoesNotExist:
                return 0
        return 0

    def get_is_saved(self, obj):
        """Returns whether the current user has saved this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.ReadOnlyField(source='actor.username')
    post_title = serializers.ReadOnlyField(source='post.title')
    post_id = serializers.ReadOnlyField(source='post.id')
    comment_text = serializers.ReadOnlyField(source='comment.text')
    comment_id = serializers.ReadOnlyField(source='comment.id')

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'post_id', 'post_title', 'comment_id', 'comment_text', 'actor_username', 'read', 'created_at']
        read_only_fields = ['id', 'read', 'created_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims:
        token['username'] = user.username
        token['email'] = user.email or ''
        return token

# --- FEEDBACK SERIALIZER ---
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'type', 'subject', 'message', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        return Feedback.objects.create(user=user, **validated_data)