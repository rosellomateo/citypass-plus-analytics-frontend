import { Select } from '@mantine/core';
import { PART2_CASES } from '../../config/crossModuleMetrics';
import { selectDemoScenario, useDemoScenario } from '../../data/mocks/demoScenario';

const options = PART2_CASES.map((label, index) => ({ label: `${index + 1}. ${label}`, value: String(index + 1) }));

export function DemoScenarioSelect() {
  const scenario = useDemoScenario();
  return <Select
    aria-label="Simular escenario"
    placeholder="Simular escenario"
    data={options}
    value={scenario === null ? null : String(scenario)}
    onChange={(value) => selectDemoScenario(value === null ? null : Number(value))}
    clearable
    size="xs"
    w={280}
    comboboxProps={{ width: 350, position: 'bottom-end' }}
  />;
}
