"""
Django management command to fix invalid usernames (numeric or too short).

Usage:
    python manage.py fix_usernames
    python manage.py fix_usernames --dry-run  # Preview changes without applying
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import re


class Command(BaseCommand):
    help = 'Fix usernames that are numeric or too short by generating proper usernames'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )

    def generate_username(self, user):
        """Generate a proper username from user's email or name."""
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
                    base_username = f"user_{user.id}"
        else:
            # No email, use user + ID
            base_username = f"user_{user.id}"
        
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
        
        # Find users with invalid usernames
        all_users = User.objects.all()
        invalid_users = []
        
        self.stdout.write(f'Checking {all_users.count()} user(s)...')
        
        for user in all_users:
            username = user.username
            is_invalid = False
            reason = None
            
            # Check if username is just digits
            if username.isdigit():
                is_invalid = True
                reason = 'numeric'
            # Check if username is too short
            elif len(username) < 3:
                is_invalid = True
                reason = 'too short'
            # Check if username is just the user ID
            elif username == str(user.id):
                is_invalid = True
                reason = 'matches user ID'
            
            if is_invalid:
                invalid_users.append((user, reason))
        
        if not invalid_users:
            self.stdout.write(self.style.SUCCESS('No users with invalid usernames found!'))
            # Show all usernames for debugging
            if all_users.count() > 0:
                self.stdout.write('\nCurrent usernames:')
                for user in all_users:
                    self.stdout.write(f'  User {user.id}: "{user.username}" (email: {user.email or "N/A"})')
            return
        
        self.stdout.write(f'\nFound {len(invalid_users)} user(s) with invalid usernames:')
        self.stdout.write('')
        
        for user, reason in invalid_users:
            new_username = self.generate_username(user)
            self.stdout.write(f'  User ID {user.id}: "{user.username}" → "{new_username}" (Reason: {reason})')
            if user.email:
                self.stdout.write(f'    Email: {user.email}')
            self.stdout.write('')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No changes made. Remove --dry-run to apply changes.'))
            return
        
        # Apply changes
        self.stdout.write('Applying changes...')
        updated_count = 0
        
        for user, reason in invalid_users:
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

