# Hairstyle using AI — Backend

Node.js + Express + MongoDB (Mongoose) backend that calls the Google Gemini API
to generate step-by-step hairstyle tutorials based on user preferences.

## Folder Structure

```
backend/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── userController.js   # register / login / profile
│   └── hairstyleController.js  # generate / save / history
├── middleware/
│   ├── auth.js              # JWT "protect" middleware
│   └── errorHandler.js      # ApiError class + centralized error handling
├── models/
│   ├── User.js
│   ├── SavedHairstyle.js
│   └── History.js
├── routes/
│   ├── userRoutes.js
│   └── hairstyleRoutes.js
├── services/
│   └── geminiService.js     # all Gemini API logic lives here
├── utils/
│   └── asyncHandler.js
├── .env.example
├── package.json
└── server.js
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   - Get a free Gemini API key at https://aistudio.google.com/app/apikey
   - Set `MONGO_URI` to your local or Atlas MongoDB connection string
   - Set `JWT_SECRET` to any long random string
3. Run in development (auto-restart with nodemon):
   ```bash
   npm run dev
   ```
4. Server runs at `http://localhost:5000` by default.

## API Endpoints

### Auth
| Method | Endpoint             | Access  | Description                  |
|--------|-----------------------|---------|-------------------------------|
| POST   | /api/users/register   | Public  | Create a new account          |
| POST   | /api/users/login      | Public  | Log in, returns JWT           |
| GET    | /api/users/me         | Private | Get logged-in user's profile  |

All `Private` routes require header: `Authorization: Bearer <token>`

### Hairstyles
| Method | Endpoint                     | Access  | Description                              |
|--------|-------------------------------|---------|--------------------------------------------|
| POST   | /api/hairstyles/generate      | Private | Generate a new AI tutorial (also logs to History) |
| POST   | /api/hairstyles/save          | Private | Save a generated result as a favorite     |
| GET    | /api/hairstyles/saved         | Private | List all saved/favorited hairstyles       |
| DELETE | /api/hairstyles/saved/:id     | Private | Remove a saved hairstyle                  |
| GET    | /api/hairstyles/history       | Private | Paginated generation history (`?page=&limit=`) |

### Example: Generate Request

```json
POST /api/hairstyles/generate
Authorization: Bearer <token>

{
  "occasion": "Wedding",
  "hairType": "Wavy",
  "hairLength": "Long",
  "stylingPreference": "Heatless",
  "timeAvailableMinutes": 15
}
```

### Example: Generate Response

```json
{
  "success": true,
  "data": {
    "historyId": "665f1b2c3a4e5f6a7b8c9d0e",
    "preferences": { "...": "..." },
    "result": {
      "totalTimeMinutes": 14,
      "steps": [
        { "stepNumber": 1, "instruction": "Section hair into...", "durationMinutes": 3 },
        { "stepNumber": 2, "instruction": "Braid each section...", "durationMinutes": 8 }
      ],
      "tips": [
        "Use a lightweight texturizing spray before braiding for extra hold.",
        "Sleep in braids overnight for looser, longer-lasting waves."
      ],
      "youtubeSearchQuery": "heatless wedding wavy hairstyle for long hair tutorial"
    }
  }
}
```

## Notes for the Frontend Team

- All Gemini output is enforced into a strict JSON schema (see `services/geminiService.js`),
  so `result.steps`, `result.tips`, and `result.youtubeSearchQuery` are always present and typed —
  no need to defensively parse free-form text.
- To build a YouTube embed/search link client-side:
  `https://www.youtube.com/results?search_query=${encodeURIComponent(result.youtubeSearchQuery)}`
- Standard response envelope: `{ success: boolean, data?: ..., message?: string }`
