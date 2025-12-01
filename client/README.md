# Hybrid Chat Application - React Frontend

React-based web frontend for the hybrid chat application, built with Vite and TypeScript.

## Features

✅ **Implemented:**
- Login screen with user ID validation
- Chat interface with message display
- WebSocket connection management
- Automatic reconnection on connection loss
- Connection status indicator
- Message input with validation
- Responsive UI design

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── LoginScreen.tsx    # User login interface
│   │   └── ChatScreen.tsx     # Main chat interface
│   ├── utils/
│   │   └── websocket.ts       # WebSocket connection manager
│   ├── test/
│   │   ├── setup.ts           # Test configuration
│   │   └── login-connection.test.tsx  # Property-based tests
│   ├── types.ts               # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── vitest.config.ts           # Vitest configuration
└── package.json
```

## Installation

```bash
cd client
npm install
```

## Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Building

```bash
npm run build
```

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Property-Based Tests

The project includes property-based tests using fast-check to verify correctness properties:

✅ **Property 2: Empty user ID is rejected** - Validates that whitespace-only user IDs are rejected (Requirements 1.4)
✅ **Property 3: Connection loss triggers reconnection** - Validates automatic reconnection (Requirements 1.5)
⚠️ **Property 1: Login establishes connection and sends correct message** - In progress (Requirements 1.1, 1.2)

## Configuration

Create a `.env` file based on `.env.example`:

```bash
VITE_WS_URL=ws://localhost:8080
```

## WebSocket Protocol

The frontend communicates with the WebSocket server using JSON messages:

### LOGIN Message
```json
{
  "type": "LOGIN",
  "userId": "user_123"
}
```

### TEXT Message
```json
{
  "type": "TEXT",
  "id": "uuid-timestamp",
  "senderId": "user_123",
  "content": "Hello, World!",
  "timestamp": 1716283992000
}
```

### GET_HISTORY Request
```json
{
  "type": "GET_HISTORY",
  "lastMessageId": "uuid-timestamp",
  "limit": 20
}
```

## Components

### LoginScreen
- User ID input with validation
- Prevents empty/whitespace-only user IDs
- Clean, centered layout

### ChatScreen
- Message list with auto-scroll
- Connection status indicator
- Message input area
- Logout functionality
- Scroll-to-load history (framework in place)

### WebSocketManager
- Connection management
- Automatic reconnection with exponential backoff
- Event-based message handling
- Connection state tracking

## Next Steps

Refer to `.kiro/specs/hybrid-chat-app/tasks.md` for the complete implementation plan.

The next tasks include:
- Task 5: Implement message sending and receiving functionality
- Task 6: Implement history message lazy loading
- Task 7: Implement media message support

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **fast-check** - Property-based testing
- **Testing Library** - Component testing utilities
