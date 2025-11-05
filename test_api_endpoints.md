# Django API Endpoints Guide

## Base URL
`http://127.0.0.1:8000/api/`

## Posts Endpoints

### List All Posts
```bash
# GET request (no authentication needed for viewing)
curl http://127.0.0.1:8000/api/v1/posts/
```

### Get Single Post
```bash
# Replace {id} with actual post ID (e.g., 1, 2, 3)
curl http://127.0.0.1:8000/api/v1/posts/1/
```

### Create Post (requires authentication)
```bash
# First, get a token by logging in
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Then use the access token to create a post
curl -X POST http://127.0.0.1:8000/api/v1/posts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title": "My Post Title", "content": "Post content here"}'
```

### Vote on a Post (requires authentication)
```bash
# value: 1 = upvote, -1 = downvote, 0 = remove vote
curl -X POST http://127.0.0.1:8000/api/v1/posts/1/vote/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"value": 1}'
```

## Other Endpoints

### User Registration
```bash
curl -X POST http://127.0.0.1:8000/api/v1/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "password123", "email": "user@example.com"}'
```

### Login (Get JWT Token)
```bash
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

### Comments
```bash
# List comments for a post (usually fetched with post detail)
curl http://127.0.0.1:8000/api/v1/comments/

# Create a comment (requires authentication)
curl -X POST http://127.0.0.1:8000/api/v1/comments/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"post": 1, "text": "My comment text"}'
```

## Browser Access

Simply open these URLs in your browser (for GET requests):
- All posts: http://127.0.0.1:8000/api/v1/posts/
- Single post: http://127.0.0.1:8000/api/v1/posts/1/

## Using Browser Developer Tools

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Navigate to http://127.0.0.1:8000/api/v1/posts/
4. You'll see the API request and response

## Using Postman or Similar Tools

1. Create a new GET request
2. URL: `http://127.0.0.1:8000/api/v1/posts/`
3. For authenticated requests, add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_ACCESS_TOKEN`

