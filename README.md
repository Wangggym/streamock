# Streaming Server

This is a simple Node.js server that demonstrates streaming data to a web client based on user queries.

## Prerequisites

- Node.js installed on your machine

## Installation

You can install Streamock globally using npm:

```
npm install -g streamock

streamock start

```

![streamock](https://github.com/user-attachments/assets/4a2ce079-5fa2-4adf-b11c-7be9d2aaf22e)



## Getting Started

1. Clone this repository or download the files to your local machine.

2. Open a terminal and navigate to the project directory.

3. Start the server by running:
   ```
   node server.js
   ```

4. You should see a message in the console saying:
   ```
   Server running at http://localhost:3000
   ```

5. Open a web browser and go to `http://localhost:3000`

6. You will see a simple form where you can enter a query.

7. After submitting the form, you will see the streaming data appear on the same page.

## Files

- `server.js`: The main server file that handles all the logic

## How it works

1. The server serves a single HTML page with a form and a results area.
2. When the user submits a query, JavaScript prevents the default form submission and sends the query to the server via a POST request.
3. Immediately after sending the POST request, the client-side JavaScript sets up a Server-Sent Events connection to the server.
4. The server generates mock responses and sends them to the client, simulating a streaming response.
5. The client receives the streamed data and updates the page in real-time.

## Note

This is a demonstration server and does not actually perform real searches. It generates mock responses based on a fixed example query. In a real-world scenario, you would use the actual user query to generate responses.



## GitHub Repository

For more information, to report issues, or to contribute, please visit the GitHub repository:

https://github.com/Wangggym/node_server_debug
