import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SecomDataService } from './core/secom-data.service';
import { BinomialLabComponent } from './features/binomial-lab/binomial-lab.component';
import { HypothesisOneComponent } from './features/hypothesis-one/hypothesis-one.component';
import { HypothesisTwoComponent } from './features/hypothesis-two/hypothesis-two.component';
import { OverviewComponent } from './features/overview/overview.component';
import { ResultsTableComponent } from './features/results-table/results-table.component';
import { SamplingComponent } from './features/sampling/sampling.component';
import { SensorsComponent } from './features/sensors/sensors.component';

@Component({
  selector: 'app-root',
  imports: [
    OverviewComponent,
    BinomialLabComponent,
    ResultsTableComponent,
    SamplingComponent,
    HypothesisOneComponent,
    HypothesisTwoComponent,
    SensorsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly data = inject(SecomDataService).data;

  protected readonly sections = [
    { id: 'datos', label: 'Datos' },
    { id: 'laboratorio', label: 'Laboratorio' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'muestreo', label: 'Muestreo real' },
    { id: 'h1', label: 'Hipótesis 1' },
    { id: 'h2', label: 'Hipótesis 2' },
    { id: 'sensores', label: 'Sensores' },
  ];

  protected readonly authors = [
    'Jefferson Yassell Rodríguez Restrepo',
    'Carlos Alfredo Moreno Rojas',
    'Jhon Freddy Ñañez Guaca',
    'Daniel Camilo Parada Velandia',
  ];
}
