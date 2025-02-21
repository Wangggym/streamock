import { Container, interfaces } from 'inversify';
import { DataService } from '@services/DataService';
import { StreamServer } from '@services/StreamServer';
import { IndexHandler } from '@services/handlers/IndexHandler';
import { StreamHandler } from '@services/handlers/StreamHandler';
import { SubmitHandler } from '@services/handlers/SubmitHandler';

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

function configureContainer(container: Container): void {
  // 基础服务
  container.bind(DataService).toSelf().inSingletonScope();
  container.bind(StreamServer).toSelf().inSingletonScope();

  // Handlers
  container.bind(IndexHandler).toSelf().inSingletonScope();
  container.bind(StreamHandler).toSelf().inSingletonScope();
  container.bind(SubmitHandler).toSelf().inSingletonScope();
}

export { getContainer, getIt }; 