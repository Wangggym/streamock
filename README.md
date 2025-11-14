# Streamock

A simple data streaming mock server built with Bun + TypeScript.

## Prerequisites

- [Bun](https://bun.sh) installed on your machine

## Installation

You can install Streamock globally using npm:

```bash
npm install -g streamock
```

Or using bun:

```bash
bun install -g streamock
```

## Quick Start

Start the server:

```bash
streamock start
```

This will start a server at `http://localhost:3001`

![streamock](https://github.com/user-attachments/assets/4a2ce079-5fa2-4adf-b11c-7be9d2aaf22e)

## CLI Commands

Streamock provides a complete set of process management commands:

### Basic Commands

```bash
# Start server (foreground)
streamock start
streamock start -p 8080              # Custom port

# Start in background (daemon mode)
streamock start -d

# Stop server
streamock stop
streamock stop -p 8080               # Stop specific port

# Restart server
streamock restart

# Check status
streamock status
```

### Examples

```bash
# Development: Start in foreground
streamock start

# Production: Start in background
streamock start -d

# View logs
tail -f /tmp/streamock-3001.log

# Restart after updates
streamock restart
```

## Template Variables

Streamock supports template variables in your mock data using `{{variable_name}}` syntax:

### Quick Example

**1. Add variables in your data:**
```json
data: {"session_id": "{{session_id}}", "query": "{{query}}", "action": "chat"}
```

**2. System auto-detects variables:**
- Click "Start Streaming" - auto-generates random values
- Or call API with parameters:

```bash
curl -X POST "http://localhost:3001/api/stream" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "query": "buy me a tv"}'
```

### Variable Types

- **Auto**: Automatically extracted from requests or randomly generated
- **Fixed**: Use fixed values

### Auto-Generation Rules

| Variable Name | Generated Value |
|---------------|----------------|
| Contains `id`, `session` | UUID v4 format |
| Contains `query`, `text` | Random example queries |
| Contains `user` | User ID format |
| Others | Generic random values |

## Development

1. Clone the repository:
```bash
git clone https://github.com/Wangggym/streamock.git
cd streamock
```

2. Install dependencies:
```bash
bun install
```

3. Start in development mode:
```bash
bun run dev
```

4. Build the project:
```bash
bun run build
```

5. Run tests:
```bash
# Run all unit tests
bun test

# Test storage location functionality
bun run test:storage
```

For detailed testing information, see [TESTING.md](./TESTING.md)

## Project Structure

```
streamock/
├── src/
│   ├── server.ts      # Main server implementation
│   ├── cli.ts         # CLI implementation
│   └── devServer.ts  # Server runner
├── dist/              # Compiled JavaScript files
├── index.html         # Web interface
└── package.json       # Project configuration
```

## How it Works

1. The server serves a single HTML page with a form and a results area
2. When the user submits data:
   - The form submission is handled via a POST request to `/submit`
   - A Server-Sent Events connection is established via `/stream`
3. The server streams the data back to the client with configurable options:
   - Line combination: Combine multiple lines using specified range
   - Custom separators: Use custom separators between lines
   - Real-time updates: See the streaming data immediately

## Features

- Stream data with customizable delay
- Combine multiple lines with custom separator
- Web interface for data input and streaming
- Real-time data updates
- Support for custom separators and line combinations
- Built with Bun for better performance
- Written in TypeScript for type safety
- **iCloud sync support for Mac users** - automatically sync data across your devices

## Data Storage

### Mac Users (with iCloud)
Your mock data is automatically stored in **iCloud Drive** at:
```
~/Library/Mobile Documents/com~apple~CloudDocs/.streamock-data/
```

This means:
- ✅ Data syncs automatically across all your Mac devices
- ✅ No manual setup required - just sign in to iCloud
- ✅ Your mock data is always backed up
- 💡 If iCloud is unavailable, it automatically falls back to local storage

### Other Systems / Without iCloud
Data is stored locally at:
```
~/.streamock-data/
```

### Viewing Your Storage Location
When you start the server, it will display the storage location:
```bash
streamock start
# Output:
# ✅ Server running at http://localhost:3001
# 💾 Data storage: /Users/yourname/Library/Mobile Documents/com~apple~CloudDocs/.streamock-data
# 💡 Press Ctrl+C to stop the server
```

## API Endpoints

- `GET /`: Serves the web interface
- `POST /submit`: Updates the server's data cache
- `GET /stream`: Streams the data back to the client

## Configuration

The server can be configured with the following options:

```typescript
interface ServerConfig {
  port: number;  // Default: 3001
  // ... other Bun.serve options
}
```

## License

MIT License - see the [LICENSE](LICENSE) file for details

## GitHub Repository

For more information, to report issues, or to contribute, please visit:
https://github.com/Wangggym/streamock
