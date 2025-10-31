# 模板变量功能使用指南

## 🎯 功能概述

Streamock 支持模板变量功能，可以在 mock 数据中使用占位符语法 `{{variable_name}}`，在流式输出时自动替换为实际值。

---

## ✨ 新增功能：自动生成随机变量

当点击以下按钮时，系统会**自动为 `auto` 类型的变量生成随机值**：
- ✅ **Start Streaming** 按钮
- ✅ **Open Streaming in New Window** 按钮

这样你无需手动传参，就能测试模板变量功能！

---

## 📖 使用步骤

### 1. 在 Mock 数据中使用模板变量

```json
data: {"session_id": "{{session_id}}", "query": "{{query}}", "action": "chat"}

data: {"session_id": "{{session_id}}", "status": "completed"}
```

### 2. 系统自动检测变量

输入数据后，系统会自动检测到模板变量并显示：

```
▶ Variables (2 detected) 💡
```

### 3. 配置变量（可选）

点击展开变量配置区域：

| 变量名 | 来源 | 值 |
|--------|------|-----|
| session_id | Auto | (从请求中提取或自动生成) |
| query | Auto | (从请求中提取或自动生成) |

**变量来源选项：**
- **Auto**：自动处理
  - 从请求中提取（API 调用时）
  - 自动生成随机值（UI 按钮点击时）
- **Fixed**：使用固定值

### 4. 提交数据

点击 **Submit Data** 保存配置。

### 5. 测试

#### 方式 A：通过 UI 按钮测试（自动生成）

##### **Start Streaming 按钮**
1. 点击 **Start Streaming**
2. 系统自动生成随机变量值
3. 在右侧面板看到生成的变量值（蓝色提示框）
4. 查看流式输出，变量已被替换

示例输出：
```
🎲 Generated variables: {
  "session_id": "a8c4f2e5-1234-4xyz-b789-0123456789ab",
  "query": "buy me a tv"
}

data: {"session_id": "a8c4f2e5-1234-4xyz-b789-0123456789ab", "query": "buy me a tv", "action": "chat"}
...
```

##### **Open Streaming in New Window 按钮**
1. 点击 **Open Streaming in New Window**
2. 系统自动生成随机变量值并添加到 URL
3. 打开新窗口，URL 类似：
   ```
   http://localhost:3001/api/stream?session_id=...&query=...
   ```

#### 方式 B：通过 API 调用测试（手动传参）

##### 使用 Query Parameters：
```bash
curl "http://localhost:3001/api/stream?session_id=test-123&query=buy+me+a+tv"
```

##### 使用 POST Body（推荐）：
```bash
curl -X POST "http://localhost:3001/api/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5e0d8868-9ccf-42a4-b76f-d43e01556b3e",
    "query": "buy me a tv"
  }'
```

---

## 🎲 自动生成规则

系统根据变量名智能生成随机值：

| 变量名包含 | 生成规则 | 示例 |
|-----------|---------|------|
| `id`, `session` | UUID v4 格式 | `a8c4f2e5-1234-4xyz-b789-0123456789ab` |
| `query`, `text` | 随机示例查询 | `buy me a tv`, `find a restaurant` |
| `user` | 用户 ID | `user_1234`, `user_5678` |
| 其他 | 通用随机值 | `value_1234` |

**示例查询池：**
- `buy me a tv`
- `find a restaurant`
- `book a flight`
- `search for hotels`

---

## 💡 使用场景

### 开发测试

快速测试模板变量功能，无需手动构造参数：

1. 在 UI 中输入包含模板变量的数据
2. 点击 **Start Streaming**
3. 立即看到变量替换效果

### API 集成测试

模拟真实 API 调用场景：

```bash
# 模拟 Brain API 的请求
curl -X POST "http://localhost:3001/api/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5e0d8868-9ccf-42a4-b76f-d43e01556b3e",
    "query": "buy me a tv",
    "stream": true
  }'
```

### 前端开发

在新窗口中测试流式输出，查看实际效果：

1. 配置好 mock 数据
2. 点击 **Open Streaming in New Window**
3. 在独立窗口中查看流式数据

---

## 🔧 高级用法

### 混合使用 Auto 和 Fixed 变量

```
Variables:
  session_id: Auto  (自动生成)
  query: Auto       (自动生成)
  api_key: Fixed    (值: "test-api-key-123")
```

点击 Start Streaming 时：
- `session_id` → 自动生成 UUID
- `query` → 随机选择示例查询
- `api_key` → 使用固定值 `"test-api-key-123"`

### 查看生成的变量值

**浏览器控制台：**
```javascript
🎲 Generated variable values: {
  session_id: "a8c4f2e5-1234-4xyz-b789-0123456789ab",
  query: "buy me a tv"
}
```

**UI 面板：**
蓝色提示框显示生成的变量值

---

## 📊 完整示例

### 1. Mock 数据

```json
data: {"session_id": "{{session_id}}", "screens": [], "action": "chat", "chat": {"title": "", "messages": [{"id": 208008114532368, "role": "user", "content": {"text": "{{query}}"}}]}}

data: {"session_id": "{{session_id}}", "screens": [{"name": "main", "title": "Shopping", "focus": "{{query}}"}], "action": "gen_ui"}
```

### 2. 变量配置

```
▼ Variables (2 detected) 💡
┌────────────┬──────┬────────────────────┐
│ session_id │ Auto │ (From request)     │
│ query      │ Auto │ (From request)     │
└────────────┴──────┴────────────────────┘
```

### 3. 点击 Start Streaming

**生成的变量：**
```json
{
  "session_id": "7b2c8e91-45a6-4f23-9d12-3c5e7f1a8b9d",
  "query": "find a restaurant"
}
```

**输出结果：**
```json
data: {"session_id": "7b2c8e91-45a6-4f23-9d12-3c5e7f1a8b9d", "screens": [], "action": "chat", "chat": {"title": "", "messages": [{"id": 208008114532368, "role": "user", "content": {"text": "find a restaurant"}}]}}

data: {"session_id": "7b2c8e91-45a6-4f23-9d12-3c5e7f1a8b9d", "screens": [{"name": "main", "title": "Shopping", "focus": "find a restaurant"}], "action": "gen_ui"}
```

---

## 🎉 总结

✅ **无需手动传参** - UI 按钮自动生成随机值  
✅ **智能生成** - 根据变量名生成合适的值  
✅ **支持 API 调用** - 仍然可以手动传递参数  
✅ **灵活配置** - Auto 和 Fixed 混合使用  
✅ **实时预览** - 在 UI 中查看生成的值  

**开始使用：**
1. 打开 http://localhost:3001
2. 输入包含 `{{variable}}` 的数据
3. 配置变量（Auto/Fixed）
4. 点击 **Start Streaming** 或 **Open Streaming in New Window**
5. 看到变量自动替换的效果！🚀

