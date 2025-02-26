import { Container, interfaces } from 'inversify';
import { DataService } from '@services/DataService';
import { StreamServer } from '@services/StreamServer';
import { IndexHandler } from '@services/handlers/IndexHandler';
import { StreamHandler } from '@services/handlers/StreamHandler';
import { SubmitHandler } from '@services/handlers/SubmitHandler';
import { FileSystemAdapter } from '@services/storage/FileSystemAdapter';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

let container: Container | undefined;

function getContainer(): Container {
  if (container) {
    return container;
  }

  container = new Container({
    autoBindInjectable: true,
    defaultScope: "Singleton",
    skipBaseClassChecks: true,
  });

  configureContainer(container);
  return container;
}

function getIt<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
  return getContainer().get<T>(serviceIdentifier);
}

export async function configureContainer(container: Container): Promise<void> {
  // 基础服务
  container.bind(DataService).toSelf().inSingletonScope();
  container.bind(StreamServer).toSelf().inSingletonScope();

  // Handlers
  container.bind(IndexHandler).toSelf().inSingletonScope();
  container.bind(StreamHandler).toSelf().inSingletonScope();
  container.bind(SubmitHandler).toSelf().inSingletonScope();

  // 配置存储适配器
  const storage = new FileSystemAdapter();
  await storage.init();  // 初始化存储
  container.bind('IStorageAdapter').toConstantValue(storage);
  container.bind(StreamDataInfoRepository).toSelf();
}

export { getContainer, getIt }; 