import { Container } from 'inversify';
import { TYPES, IDataService, IStreamServer } from './types';
import { DataService } from './services/DataService';
import { StreamServer } from './services/StreamServer';

const container = new Container();
container.bind<IDataService>(TYPES.DataService).to(DataService).inSingletonScope();
container.bind<IStreamServer>(TYPES.Server).to(StreamServer).inSingletonScope();

export { container }; 