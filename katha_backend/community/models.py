from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone

# --- The Post (Katha) Model ---
class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True, help_text='Timestamp when post was last edited')
    is_edited = models.BooleanField(default=False, help_text='Whether the post has been edited')
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    votes = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Katha Post"
        verbose_name_plural = "Katha Posts"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:  # Handle empty titles
                base_slug = 'post'
            
            # Handle duplicate slugs by appending a number
            slug = base_slug
            counter = 1
            
            # Check for existing slugs (exclude current post if updating)
            queryset = Post.objects.filter(slug=slug)
            if self.pk:
                queryset = queryset.exclude(pk=self.pk)
            
            while queryset.exists():
                # Append counter to make it unique
                slug = f"{base_slug}-{counter}"
                counter += 1
                # Prevent infinite loop if slug gets too long
                if len(slug) > 200:
                    # Fallback: use timestamp if slug gets too long
                    from django.utils import timezone
                    slug = f"post-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    break
                # Update queryset for new slug
                queryset = Post.objects.filter(slug=slug)
                if self.pk:
                    queryset = queryset.exclude(pk=self.pk)
            
            self.slug = slug
        
        # Track edits (only if this is an update, not a new post)
        if self.pk:
            from django.utils import timezone
            # Check if title or content changed
            if hasattr(self, '_original_title') or hasattr(self, '_original_content'):
                self.is_edited = True
                self.edited_at = timezone.now()
        super().save(*args, **kwargs)

# --- The Comment (Salaysay) Model ---
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True, help_text='Timestamp when comment was last edited')
    is_edited = models.BooleanField(default=False, help_text='Whether the comment has been edited')
    
    # Self-referential Foreign Key for nested comments/replies
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='replies',
        help_text='The parent comment this is replying to (if any).'
    )
    
    votes = models.IntegerField(default=0)

    class Meta:
        ordering = ['created_at']
        verbose_name = "Salaysay Comment"
        verbose_name_plural = "Salaysay Comments"

    def __str__(self):
        return f'Comment by {self.author} on {self.post.title[:30]}...'

# --- The Vote Model ---
class Vote(models.Model):
    """Tracks user votes on posts (upvote: 1, downvote: -1)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_votes')
    value = models.SmallIntegerField(choices=[(1, 'Upvote'), (-1, 'Downvote')])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']  # One vote per user per post
        ordering = ['-created_at']
        verbose_name = "Vote"
        verbose_name_plural = "Votes"

    def __str__(self):
        vote_type = 'Upvote' if self.value == 1 else 'Downvote'
        return f'{vote_type} by {self.user.username} on {self.post.title[:30]}...'

# --- The SavedPost Model ---
class SavedPost(models.Model):
    """Tracks posts saved by users."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']  # One save per user per post
        ordering = ['-saved_at']
        verbose_name = "Saved Post"
        verbose_name_plural = "Saved Posts"

    def __str__(self):
        return f'{self.user.username} saved {self.post.title[:30]}...'

# --- The CommentVote Model ---
class CommentVote(models.Model):
    """Tracks user votes on comments (upvote: 1, downvote: -1)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_votes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_votes')
    value = models.SmallIntegerField(choices=[(1, 'Upvote'), (-1, 'Downvote')])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'comment']  # One vote per user per comment
        ordering = ['-created_at']
        verbose_name = "Comment Vote"
        verbose_name_plural = "Comment Votes"

    def __str__(self):
        vote_type = 'Upvote' if self.value == 1 else 'Downvote'
        return f'{vote_type} by {self.user.username} on comment {self.comment.id}'

# --- The Notification Model ---
class Notification(models.Model):
    """Tracks notifications for users (comments, replies, etc.)."""
    NOTIFICATION_TYPES = [
        ('comment', 'New Comment'),
        ('reply', 'New Reply'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='acted_notifications', help_text='User who triggered the notification')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f'{self.notification_type} notification for {self.user.username}'

# --- The Feedback Model ---
class Feedback(models.Model):
    FEEDBACK_TYPES = [
        ('general', 'General Feedback'),
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('improvement', 'Improvement Suggestion'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    type = models.CharField(max_length=20, choices=FEEDBACK_TYPES, default='general')
    subject = models.CharField(max_length=120, blank=True)
    message = models.TextField()
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedback'

    def __str__(self):
        who = self.user.username if self.user else (self.email or 'Guest')
        return f'Feedback from {who}: {self.type}'