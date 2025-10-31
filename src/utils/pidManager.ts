/**
 * PID Manager
 * 管理服务器进程的 PID，支持启动、停止和重启
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export class PidManager {
  private static readonly PID_FILE = join(tmpdir(), 'streamock.pid');

  /**
   * 保存当前进程的 PID
   */
  static savePid(pid: number): void {
    try {
      writeFileSync(this.PID_FILE, pid.toString(), 'utf-8');
    } catch (error) {
      console.error('Failed to save PID:', error);
    }
  }

  /**
   * 读取保存的 PID
   */
  static readPid(): number | null {
    try {
      if (!existsSync(this.PID_FILE)) {
        return null;
      }
      const pid = parseInt(readFileSync(this.PID_FILE, 'utf-8'), 10);
      return isNaN(pid) ? null : pid;
    } catch (error) {
      console.error('Failed to read PID:', error);
      return null;
    }
  }

  /**
   * 删除 PID 文件
   */
  static removePid(): void {
    try {
      if (existsSync(this.PID_FILE)) {
        unlinkSync(this.PID_FILE);
      }
    } catch (error) {
      console.error('Failed to remove PID file:', error);
    }
  }

  /**
   * 检查进程是否正在运行
   */
  static isRunning(pid: number): boolean {
    try {
      // 发送信号 0 来检查进程是否存在
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 杀死进程
   */
  static killProcess(pid: number): boolean {
    try {
      process.kill(pid, 'SIGTERM');
      
      // 等待最多 5 秒让进程优雅退出
      let attempts = 0;
      const maxAttempts = 50; // 5 秒 (50 * 100ms)
      
      while (attempts < maxAttempts && this.isRunning(pid)) {
        Bun.sleepSync(100);
        attempts++;
      }

      // 如果还在运行，强制杀死
      if (this.isRunning(pid)) {
        process.kill(pid, 'SIGKILL');
        Bun.sleepSync(100);
      }

      return !this.isRunning(pid);
    } catch (error) {
      // 进程可能已经不存在了
      return true;
    }
  }

  /**
   * 通过端口查找并杀死进程
   */
  static async killByPort(port: number): Promise<boolean> {
    try {
      // 使用 lsof 查找占用端口的进程
      const proc = Bun.spawn(['lsof', '-ti', `:${port}`], {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      const text = await new Response(proc.stdout).text();
      const pids = text.trim().split('\n').filter(Boolean);

      if (pids.length === 0) {
        return false;
      }

      let killed = false;
      for (const pidStr of pids) {
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid)) {
          if (this.killProcess(pid)) {
            killed = true;
          }
        }
      }

      return killed;
    } catch (error) {
      console.error('Failed to kill process by port:', error);
      return false;
    }
  }

  /**
   * 获取当前运行的服务器状态
   */
  static getStatus(): { running: boolean; pid: number | null; port?: number } {
    const pid = this.readPid();
    
    if (pid === null) {
      return { running: false, pid: null };
    }

    const running = this.isRunning(pid);
    
    if (!running) {
      // 如果进程不存在了，清理 PID 文件
      this.removePid();
    }

    return { running, pid: running ? pid : null };
  }
}

