# API Documentation

## Endpoints

### Health Check

- `GET /api/health` - Returns API status

### Authentication

- `GET /api/auth/callback` - OAuth callback handler

### Reviews

- `GET /api/reviews/queue` - Get review queue
- `POST /api/reviews/submit` - Submit review answer
- `GET /api/reviews/upcoming` - Get upcoming reviews

### Lessons

- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/[id]` - Get specific lesson

### User

- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `GET /api/user/stats` - Get user statistics

## Authentication

All protected endpoints require authentication via Supabase Auth.

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```
