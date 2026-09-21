// src/data/mocks/mobility.mock.ts
import type {
  StationEntity,
  BikeEntity,
  IncidentTypeEntity,
  BikeIncidentEntity,
  MaintenanceRecordEntity,
  StationAvailabilityHistoryEntity,
  StationPredictionEntity,
  ViajeIniciadoEvent,
  ViajeFinalizadoEvent,
} from '../../types';

import stationsJson from '../../../testingDatos/mobility_stations.json';
import bikesJson from '../../../testingDatos/mobility_bikes.json';
import incidentTypesJson from '../../../testingDatos/mobility_incident_types.json';
import incidentsJson from '../../../testingDatos/mobility_incidents.json';
import maintenanceJson from '../../../testingDatos/mobility_maintenance.json';
import availabilityHistoryJson from '../../../testingDatos/mobility_availability_history.json';
import predictionsJson from '../../../testingDatos/mobility_predictions.json';
import startedJson from '../../../testingDatos/mobility_started.json';
import finishedJson from '../../../testingDatos/mobility_finished.json';

export const mockStationsEntities: StationEntity[] = stationsJson as StationEntity[];
export const mockStations: string[] = mockStationsEntities.map((s) => s.name);
export const mockBikesEntities: BikeEntity[] = bikesJson as unknown as BikeEntity[];
export const mockIncidentTypesEntities: IncidentTypeEntity[] = incidentTypesJson as unknown as IncidentTypeEntity[];
export const mockBikeIncidentsEntities: BikeIncidentEntity[] = incidentsJson as unknown as BikeIncidentEntity[];
export const mockMaintenanceRecordsEntities: MaintenanceRecordEntity[] = maintenanceJson as unknown as MaintenanceRecordEntity[];
export const mockStationAvailabilityHistoryEntities: StationAvailabilityHistoryEntity[] = availabilityHistoryJson as unknown as StationAvailabilityHistoryEntity[];
export const mockStationPredictionsEntities: StationPredictionEntity[] = predictionsJson as unknown as StationPredictionEntity[];
export const mockViajeIniciadoEvents: ViajeIniciadoEvent[] = startedJson as unknown as ViajeIniciadoEvent[];
export const mockViajeFinalizadoEvents: ViajeFinalizadoEvent[] = finishedJson as unknown as ViajeFinalizadoEvent[];
