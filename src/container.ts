import { Container } from 'inversify';
import { TYPES } from './types';
import { IDataService } from './types';
import { DataService } from './services/DataService';
import { StreamServer } from './server';

const container = new Container();
container.bind<IDataService>(TYPES.DataService).to(DataService).inSingletonScope();
container.bind<StreamServer>(TYPES.Server).to(StreamServer).inSingletonScope();

export { container }; 