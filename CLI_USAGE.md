# Streamock CLI Usage Guide

## 📚 命令列表

Streamock 现在支持完整的进程管理命令：

### 🚀 `start` - 启动服务器（默认命令）

```bash
# 前台启动（推荐用于开发）
streamock start
# 或
streamock

# 指定端口
streamock start -p 8080

# 后台启动（daemon 模式）
streamock start -d
# 或
streamock start --daemon
```

**选项：**
- `-p, --port <number>` - 指定端口（默认: 3001）
- `-d, --daemon` - 以后台模式运行

**说明：**
- 前台模式：按 `Ctrl+C` 停止服务器
- 后台模式：服务器在后台运行，日志保存在 `/tmp/streamock-{port}.log`

---

### 🛑 `kill` / `stop` - 停止服务器

```bash
# 停止服务器
streamock kill
# 或使用别名
streamock stop

# 停止特定端口的服务器
streamock kill -p 8080
```

**选项：**
- `-p, --port <number>` - 指定要停止的端口（默认: 3001）

**说明：**
- 会尝试通过保存的 PID 停止服务器
- 如果 PID 无效，会尝试通过端口查找并停止进程
- 优雅退出（SIGTERM），如果失败则强制退出（SIGKILL）

---

### 🔄 `restart` - 重启服务器

```bash
# 重启服务器
streamock restart

# 重启并指定端口
streamock restart -p 8080
```

**选项：**
- `-p, --port <number>` - 指定端口（默认: 3001）

**说明：**
- 自动停止现有服务器
- 以后台模式重新启动
- 适合在修改代码后快速重启

---

### 📊 `status` - 查看服务器状态

```bash
# 查看服务器运行状态
streamock status
```

**输出示例：**

```bash
# 运行中
📊 Server Status:
────────────────────────────────────────
🟢 Status: Running
📍 PID: 12345
💡 Use "streamock kill" to stop

# 未运行
📊 Server Status:
────────────────────────────────────────
🔴 Status: Not running
💡 Use "streamock start" to start
```

---

## 🎯 使用场景

### 开发环境

```bash
# 启动开发服务器（前台模式，便于查看日志）
streamock start

# 或使用 npm script
npm run dev
```

### 生产环境

```bash
# 以后台模式启动
streamock start -d

# 查看状态
streamock status

# 查看日志
tail -f /tmp/streamock-3001.log

# 重启服务器（例如部署更新后）
streamock restart

# 停止服务器
streamock kill
```

### 测试环境

```bash
# 使用不同端口
streamock start -p 8080 -d

# 运行测试...

# 测试完成后停止
streamock kill -p 8080
```

---

## 💡 提示

1. **查看日志**：后台模式的日志保存在 `/tmp/streamock-{port}.log`
   ```bash
   tail -f /tmp/streamock-3001.log
   ```

2. **PID 文件位置**：`/tmp/streamock.pid`

3. **多端口支持**：可以同时运行多个不同端口的服务器实例
   ```bash
   streamock start -p 3001 -d
   streamock start -p 3002 -d
   streamock start -p 3003 -d
   ```

4. **快速重启**：修改代码后使用 `restart` 命令快速重启
   ```bash
   streamock restart
   ```

5. **检查端口占用**：
   ```bash
   lsof -i :3001
   ```

---

## 🔧 故障排查

### 服务器无法启动

```bash
# 检查端口是否被占用
lsof -i :3001

# 强制停止占用端口的进程
streamock kill -p 3001

# 或手动杀死进程
lsof -ti :3001 | xargs kill -9
```

### 状态显示运行但实际未运行

```bash
# 清理 PID 文件
rm /tmp/streamock.pid

# 重新启动
streamock start -d
```

### 查看详细错误日志

```bash
# 前台模式运行以查看实时日志
streamock start

# 或查看后台日志
tail -100 /tmp/streamock-3001.log
```

---

## 📝 完整示例

```bash
# 1. 启动服务器（后台）
$ streamock start -d
🚀 Starting server in daemon mode...
✅ Server started in background (PID: 12345)
🌐 Server running at http://localhost:3001
📝 Logs: /tmp/streamock-3001.log
💡 Use "streamock kill" to stop the server

# 2. 检查状态
$ streamock status
📊 Server Status:
────────────────────────────────────────
🟢 Status: Running
📍 PID: 12345
💡 Use "streamock kill" to stop

# 3. 重启服务器
$ streamock restart
🔄 Restarting server...
🛑 Stopping server (PID: 12345)...
🚀 Starting server...
✅ Server restarted (PID: 12346)
🌐 Server running at http://localhost:3001
📝 Logs: /tmp/streamock-3001.log

# 4. 停止服务器
$ streamock kill
🛑 Stopping server...
📍 Found running server (PID: 12346)
✅ Server stopped successfully
```

