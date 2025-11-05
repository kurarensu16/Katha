"""
Django management command to force fix numeric usernames (4, 5, etc.).

This script specifically targets users with numeric usernames and fixes them.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import re


class Command(BaseCommand):
    help = 'Force fix users with numeric usernames (like "4", "5")'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )

    def generate_username(self, user):
        """Generate a proper username from user's email."""
        import re
        
        # Try to use email first
        if user.email:
            email_username = user.email.split('@')[0]
            # Clean email username: remove dots, special chars, make lowercase
            clean_username = re.sub(r'[^a-zA-Z0-9_]', '', email_username).lower()
            # Check if cleaned username is valid (not just digits, at least 3 chars)
            if clean_username and len(clean_username) >= 3 and not clean_username.isdigit():
                base_username = clean_username[:20]
            else:
                # Fallback to user + first chars of email (but not if it's just digits)
                if email_username and not email_username.isdigit():
                    base_username = f"user_{email_username[:8]}"
                else:
                    base_username = f"google_user_{user.id}"
        else:
            # No email, use user + ID
            base_username = f"google_user_{user.id}"
        
        # Ensure username is unique
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exclude(id=user.id).exists():
            username = f"{base_username}{counter}"
            counter += 1
            if counter > 1000:
                username = f"{base_username}_{user.id}"
                break
        
        return username

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find users with numeric usernames (single digit or multi-digit)
        all_users = User.objects.all()
        numeric_users = []
        
        for user in all_users:
            username = user.username
            # Check if username is just digits (including "4", "5", etc.)
            if username.isdigit():
                numeric_users.append(user)
        
        if not numeric_users:
            self.stdout.write(self.style.SUCCESS('No users with numeric usernames found!'))
            # Show all users for debugging
            if all_users.count() > 0:
                self.stdout.write('\nAll current usernames:')
                for user in all_users:
                    self.stdout.write(f'  User {user.id}: "{user.username}" (email: {user.email or "N/A"})')
            return
        
        self.stdout.write(f'\nFound {len(numeric_users)} user(s) with numeric usernames:')
        self.stdout.write('')
        
        for user in numeric_users:
            new_username = self.generate_username(user)
            self.stdout.write(f'  User ID {user.id}: "{user.username}" → "{new_username}"')
            if user.email:
                self.stdout.write(f'    Email: {user.email}')
            self.stdout.write('')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No changes made. Remove --dry-run to apply changes.'))
            return
        
        # Apply changes
        self.stdout.write('Applying changes...')
        updated_count = 0
        
        for user in numeric_users:
            old_username = user.username
            new_username = self.generate_username(user)
            
            try:
                user.username = new_username
                user.save()
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Updated user {user.id}: "{old_username}" → "{new_username}"'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to update user {user.id}: {e}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} user(s)!'))
        self.stdout.write(self.style.WARNING('\nNote: Users will need to log out and log back in to get new JWT tokens with updated usernames.'))

