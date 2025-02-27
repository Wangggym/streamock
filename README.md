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
