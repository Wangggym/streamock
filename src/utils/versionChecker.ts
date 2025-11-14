/**
 * Version Checker Utility
 * Checks if the current CLI version is up-to-date and auto-updates if needed
 */

interface VersionCheckResult {
  needsUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  message?: string;
}

interface NpmRegistryResponse {
  'dist-tags': {
    latest: string;
  };
}

interface UpdateOptions {
  force?: boolean;      // Force update without asking
  silent?: boolean;     // Don't show any messages
  autoUpdate?: boolean; // Automatically update when new version found
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Fetch the latest version from npm registry
 */
async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as NpmRegistryResponse;
    return data['dist-tags']?.latest || null;
  } catch (error) {
    // Silent fail - don't block CLI if registry is unavailable
    return null;
  }
}

/**
 * Check if current version needs update
 */
export async function checkVersion(
  currentVersion: string,
  packageName: string = 'streamock'
): Promise<VersionCheckResult> {
  const latestVersion = await fetchLatestVersion(packageName);
  
  if (!latestVersion) {
    return {
      needsUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      message: 'Unable to check for updates',
    };
  }

  const comparison = compareVersions(latestVersion, currentVersion);
  const needsUpdate = comparison > 0;

  return {
    needsUpdate,
    currentVersion,
    latestVersion,
  };
}

/**
 * Detect package manager
 */
function detectPackageManager(): 'npm' | 'bun' | 'pnpm' | 'yarn' {
  // Check if running with Bun
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  
  // Check npm_config_user_agent
  const userAgent = process.env.npm_config_user_agent || '';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('bun')) return 'bun';
  
  return 'npm';
}

/**
 * Execute package update
 */
async function executeUpdate(packageName: string = 'streamock'): Promise<boolean> {
  // 优先使用 npm 进行全局安装，因为它更稳定
  // Prefer npm for global installation as it's more stable
  let pm = detectPackageManager();
  
  // 如果检测到 bun，改用 npm（全局安装更稳定）
  if (pm === 'bun') {
    pm = 'npm';
  }
  
  console.log(`\n🔄 Updating ${packageName} using ${pm}...`);
  
  try {
    const commands: Record<string, string[]> = {
      npm: ['npm', 'install', '-g', `${packageName}@latest`],
      bun: ['bun', 'add', '-g', `${packageName}@latest`],  // 修正：bun 使用 add 而不是 install
      pnpm: ['pnpm', 'add', '-g', `${packageName}@latest`],
      yarn: ['yarn', 'global', 'add', `${packageName}@latest`],
    };
    
    const cmd = commands[pm];
    
    const proc = Bun.spawn(cmd, {
      stdout: 'inherit',
      stderr: 'inherit',
      stdin: 'inherit',
    });
    
    const exitCode = await proc.exited;
    
    if (exitCode === 0) {
      console.log('\n✅ Update completed successfully!');
      console.log('🔄 Restarting with the new version...\n');
      
      // Restart the current command with the same arguments
      const newProc = Bun.spawn(process.argv, {
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
      });
      
      await newProc.exited;
      process.exit(0);
      return true;
    } else {
      console.error('\n❌ Update failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
    return false;
  }
}

/**
 * Display update message to user
 */
export function displayUpdateMessage(result: VersionCheckResult, force: boolean = false): void {
  if (!result.needsUpdate) {
    return;
  }

  // 使用简单字符避免乱码问题
  console.log('\n' + '='.repeat(60));
  console.log('🔔 New version available!');
  console.log('-'.repeat(60));
  console.log(`   Current version: ${result.currentVersion}`);
  console.log(`   Latest version:  ${result.latestVersion}`);
  console.log('='.repeat(60) + '\n');

  if (force) {
    console.error('❌ Your version is outdated. Please update to continue.');
    process.exit(1);
  }
}

/**
 * Check version and handle update prompts
 * @param currentVersion - Current version of the CLI
 * @param options - Configuration options
 */
export async function checkAndPromptUpdate(
  currentVersion: string,
  options: UpdateOptions = {}
): Promise<void> {
  // Allow disabling version check via environment variable
  if (process.env.STREAMOCK_SKIP_VERSION_CHECK === 'true') {
    return;
  }
  
  // Allow forcing update via environment variable
  const forceUpdate = process.env.STREAMOCK_FORCE_UPDATE === 'true';
  const autoUpdateEnv = process.env.STREAMOCK_AUTO_UPDATE === 'true';
  
  const { 
    force = forceUpdate, 
    silent = false,
    autoUpdate = autoUpdateEnv || true  // 默认启用自动更新
  } = options;
  
  try {
    const result = await checkVersion(currentVersion);
    
    if (!result.needsUpdate) {
      return;
    }
    
    if (silent) {
      return;
    }
    
    // 显示更新信息
    displayUpdateMessage(result, false);
    
    if (autoUpdate) {
      // 直接自动更新，不等待
      const success = await executeUpdate();
      
      if (!success && force) {
        console.error('\n❌ Update failed and force mode is enabled. Exiting...');
        process.exit(1);
      } else if (!success) {
        console.log('\n⚠️  Update failed, but you can continue using the current version.');
        console.log('💡 You can update manually later using:');
        console.log(`   ${detectPackageManager()} install -g streamock@latest\n`);
      }
    } else if (force) {
      // 不自动更新但强制要求更新
      console.error('❌ Your version is outdated. Please update to continue.');
      process.exit(1);
    }
  } catch (error) {
    // Silent fail - don't block CLI functionality
    return;
  }
}

