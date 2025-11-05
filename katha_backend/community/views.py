from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Count, F, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Post, Comment, Vote, SavedPost, Notification, CommentVote, Feedback
from .serializers import PostSerializer, CommentSerializer, UserSerializer, NotificationSerializer, FeedbackSerializer

# --- AUTHENTICATION VIEW ---
class UserRegistrationView(generics.CreateAPIView):
    """API view for user registration."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    """API view to get and update current user details."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- FEEDBACK VIEW ---
class FeedbackView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        # Allow anyone to POST feedback, restrict GET list to admins
        if self.request.method == 'GET':
            return [IsAuthenticated(),]
        return [AllowAny(),]

    def list(self, request, *args, **kwargs):
        # Only allow staff/admin to list feedback
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


# --- SSO/OAuth Views ---
@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth(request):
    """Handle Google OAuth ID token and return JWT tokens."""
    id_token = request.data.get('id_token') or request.data.get('credential') or request.data.get('access_token')
    if not id_token:
        return Response({'error': 'ID token or credential required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        import requests
        import json
        import base64
        
        # Google ID tokens are JWTs - decode to get user info
        # For production, verify with Google's certs, but for now we'll verify via API
        try:
            # Try to decode JWT (ID token format)
            parts = id_token.split('.')
            if len(parts) == 3:
                payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
                # Verify it's a Google token
                if payload.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                    return Response({'error': 'Invalid token issuer'}, status=status.HTTP_401_UNAUTHORIZED)
                
                email = payload.get('email', '')
                google_id = payload.get('sub', '')
                name = payload.get('name', '')
            else:
                # Fallback: treat as access token
                google_response = requests.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {id_token}'}
                )
                if google_response.status_code != 200:
                    return Response({'error': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)
                google_data = google_response.json()
                email = google_data.get('email', '')
                google_id = google_data.get('id', '')
                name = google_data.get('name', '')
        except Exception as decode_error:
            # Fallback: verify via API
            google_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {id_token}'}
            )
            if google_response.status_code != 200:
                return Response({'error': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)
            google_data = google_response.json()
            email = google_data.get('email', '')
            google_id = google_data.get('id', '')
            name = google_data.get('name', '')
        
        if not email:
            return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate username - prefer name, fallback to email
        import re
        
        # Try to use name first (if available and valid)
        if name:
            # Clean name: remove special chars, spaces become underscores, lowercase
            clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', name).lower()
            clean_name = re.sub(r'_+', '_', clean_name).strip('_')
            if clean_name and len(clean_name) >= 3:
                base_username = clean_name[:20]  # Limit length
            else:
                base_username = None
        else:
            base_username = None
        
        # If name didn't work, use email
        if not base_username:
            email_username = email.split('@')[0]
            # Clean email username: remove dots, special chars, make lowercase
            clean_username = re.sub(r'[^a-zA-Z0-9_]', '', email_username).lower()
            # Check if cleaned username is valid (not just digits, at least 3 chars)
            if clean_username and len(clean_username) >= 3 and not clean_username.isdigit():
                base_username = clean_username[:20]
            else:
                # If email username is invalid (just digits or too short), use user + Google ID
                base_username = f"user_{google_id[:8]}"
        
        # Ensure username is unique
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            # Prevent infinite loop
            if counter > 1000:
                username = f"{base_username}_{google_id[:8]}"
                break
        
        # Get or create user by email
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'email': email,
            }
        )
        
        # If user exists but username is invalid (just a number, too short, etc.), update it
        if not created:
            needs_update = False
            if user.username.isdigit() or len(user.username) < 3:
                # Username is invalid (like "4" or "5")
                needs_update = True
            elif user.username == str(user.id) or user.username == google_id:
                # Username is just the user ID or Google ID
                needs_update = True
            elif user.username and user.username.isdigit():
                # Double check: username is just digits
                needs_update = True
            
            if needs_update:
                # Update username if the new one is available
                if not User.objects.filter(username=username).exclude(id=user.id).exists():
                    user.username = username
                    user.save()
                    # Force token refresh by returning updated username
                    # The frontend will get the new token with correct username
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'email': user.email or ''
        })
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'traceback': traceback.format_exc()}, status=status.HTTP_400_BAD_REQUEST)


# --- POST AND COMMENT VIEWS ---
class PostViewSet(viewsets.ModelViewSet):
    """Provides standard CRUD operations for Post (Katha)."""
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        """Pass request context to serializer for user_vote calculation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """Override queryset to support sorting and filtering."""
        queryset = Post.objects.all().annotate(
            comment_count=Count('comments', filter=Q(comments__parent__isnull=True))
        )

        # Filtering
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author__username__icontains=author)

        date_from = self.request.query_params.get('date_from', None)
        if date_from:
            try:
                from datetime import datetime
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=date_from)
            except (ValueError, AttributeError):
                pass

        date_to = self.request.query_params.get('date_to', None)
        if date_to:
            try:
                from datetime import datetime
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=date_to)
            except (ValueError, AttributeError):
                pass

        # Sorting
        sort_by = self.request.query_params.get('sort', 'newest')
        
        if sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'most_voted':
            queryset = queryset.order_by('-votes', '-created_at')
        elif sort_by == 'most_comments':
            queryset = queryset.order_by('-comment_count', '-created_at')
        elif sort_by == 'trending':
            # Trending: combination of votes, comments, and recency
            # Weight recent posts more heavily (posts from last 7 days get bonus)
            week_ago = timezone.now() - timedelta(days=7)
            queryset = queryset.annotate(
                trending_score=(
                    F('votes') * 2 + 
                    F('comment_count') * 3 + 
                    Case(
                        When(created_at__gte=week_ago, then=5),
                        default=0,
                        output_field=IntegerField()
                    )
                )
            ).order_by('-trending_score', '-created_at')
        else:  # 'newest' or default
            queryset = queryset.order_by('-created_at')

        return queryset

    def perform_create(self, serializer):
        # Automatically set the author of the post to the current logged-in user
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Only allow the author to update their own post
        post = self.get_object()
        if post.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own posts.")
        from django.utils import timezone
        serializer.save(edited_at=timezone.now(), is_edited=True)

    def perform_destroy(self, instance):
        # Only allow the author to delete their own post
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own posts.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """Handle voting on a post. value: 1 for upvote, -1 for downvote, 0 to remove vote."""
        post = self.get_object()
        value = request.data.get('value')
        
        if value not in [1, -1, 0]:
            return Response(
                {'error': 'Invalid vote value. Must be 1 (upvote), -1 (downvote), or 0 (remove vote).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Get or create the vote
            vote, created = Vote.objects.get_or_create(
                user=request.user,
                post=post,
                defaults={'value': value}
            )
            
            if not created:
                # Vote already exists
                if value == 0:
                    # Remove vote
                    old_value = vote.value
                    vote.delete()
                    post.votes -= old_value
                else:
                    # Update vote
                    old_value = vote.value
                    vote.value = value
                    vote.save()
                    post.votes = post.votes - old_value + value
            else:
                # New vote
                post.votes += value
            
            post.save()
            
            # Return updated post data
            serializer = self.get_serializer(post)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def save(self, request, pk=None):
        """Save or unsave a post."""
        post = self.get_object()
        
        saved_post, created = SavedPost.objects.get_or_create(
            user=request.user,
            post=post
        )
        
        if not created:
            # Already saved, so unsave it
            saved_post.delete()
            is_saved = False
        else:
            is_saved = True
        
        # Return updated post data
        serializer = self.get_serializer(post)
        return Response({
            'is_saved': is_saved,
            'post': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def saved(self, request):
        """Get all posts saved by the current user."""
        saved_posts = SavedPost.objects.filter(user=request.user).select_related('post')
        posts = [saved_post.post for saved_post in saved_posts]
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
class CommentViewSet(viewsets.ModelViewSet):
    """Provides standard CRUD operations for Comment (Salaysay)."""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        """Pass request context to serializer for user_vote calculation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        # Automatically set the author of the comment to the current logged-in user
        # The post is already included in the request data, so we just need to save the author
        comment = serializer.save(author=self.request.user)
        
        # Create notifications
        post = comment.post
        parent = comment.parent
        
        if parent:
            # This is a reply to a comment
            # Notify the parent comment author (unless they're replying to themselves)
            if parent.author != self.request.user:
                Notification.objects.create(
                    user=parent.author,
                    notification_type='reply',
                    post=post,
                    comment=comment,
                    actor=self.request.user
                )
        else:
            # This is a top-level comment
            # Notify the post author (unless they're commenting on their own post)
            if post.author != self.request.user:
                Notification.objects.create(
                    user=post.author,
                    notification_type='comment',
                    post=post,
                    comment=comment,
                    actor=self.request.user
                )

    def perform_update(self, serializer):
        # Only allow the author to update their own comment
        comment = self.get_object()
        if comment.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own comments.")
        from django.utils import timezone
        serializer.save(edited_at=timezone.now(), is_edited=True)

    def perform_destroy(self, instance):
        # Only allow the author to delete their own comment
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """Handle voting on a comment. value: 1 for upvote, -1 for downvote, 0 to remove vote."""
        comment = self.get_object()
        value = request.data.get('value')
        
        if value not in [1, -1, 0]:
            return Response(
                {'error': 'Invalid vote value. Must be 1 (upvote), -1 (downvote), or 0 (remove vote).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Get or create the vote
            vote, created = CommentVote.objects.get_or_create(
                user=request.user,
                comment=comment,
                defaults={'value': value}
            )
            
            if not created:
                # Vote already exists
                if value == 0:
                    # Remove vote
                    old_value = vote.value
                    vote.delete()
                    comment.votes -= old_value
                else:
                    # Update vote
                    old_value = vote.value
                    vote.value = value
                    vote.save()
                    comment.votes = comment.votes - old_value + value
            else:
                # New vote
                comment.votes += value
            
            comment.save()
            
            # Return updated comment data
            serializer = self.get_serializer(comment)
            return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return notifications for the current user."""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        if notification.user != request.user:
            return Response(
                {'error': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        notification.read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({'count': count}, status=status.HTTP_200_OK)