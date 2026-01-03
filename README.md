# picorules-compiler-js-eadv-mocker

Mock EADV data generator for Picorules testing. Generates synthetic clinical data based on compiled ruleblocks.

## Installation

```bash
npm install picorules-compiler-js-eadv-mocker
```

## Usage

### Basic Usage

```typescript
import { generateMockData } from 'picorules-compiler-js-eadv-mocker';

const result = generateMockData({
  ruleblocks: [
    {
      name: 'ckd',
      text: `
        egfr_last => eadv.lab_bld_egfr.val.last();
        has_ckd : {egfr_last < 60 => 1}, {=> 0};
      `,
      isActive: true,
    }
  ]
});

console.log(result.eadv);
// [
//   { eid: 1001, att: 'lab_bld_egfr', dt: '2024-12-01', val: 45.2 },
//   { eid: 1001, att: 'lab_bld_egfr', dt: '2024-11-15', val: 52.8 },
//   ...
// ]
```

### With Custom Options

```typescript
const result = generateMockData({
  ruleblocks: [...],
  options: {
    entityCount: 5,              // Generate 5 patients
    entityIdStart: 2000,         // Start IDs at 2000
    observationsPerEntity: 4,    // 4 observations per attribute
    dateRange: {
      start: '2023-01-01',
      end: '2024-12-31',
    },
    seed: 12345,                 // Reproducible random data
  }
});
```

### With Custom Value Generators

```typescript
import {
  generateMockData,
  clinicalValueGenerators,
  createRangeGenerator
} from 'picorules-compiler-js-eadv-mocker';

const result = generateMockData({
  ruleblocks: [...],
  options: {
    valueGenerators: {
      // Use built-in clinical generators
      ...clinicalValueGenerators,
      // Or create custom ones
      'my_custom_attr': createRangeGenerator(0, 100, 1),
    },
  }
});
```

### With Bind Dependencies

For ruleblocks that reference other ruleblocks via bind statements:

```typescript
const result = generateMockData({
  ruleblocks: [
    {
      name: 'monitoring',
      text: `
        ckd => rout_ckd.ckd.val.bind();
        egfr => eadv.lab_bld_egfr.val.last();
        needs_monitoring : {ckd = 1 and egfr < 45 => 1}, {=> 0};
      `,
      isActive: true,
    }
  ],
  options: {
    bindTableValues: {
      'rout_ckd': {
        'ckd': () => Math.random() > 0.5 ? 1 : 0,
      }
    }
  }
});

console.log(result.routTables);
// {
//   'rout_ckd': [
//     { eid: 1001, ckd: 1 },
//     { eid: 1002, ckd: 0 },
//     { eid: 1003, ckd: 1 }
//   ]
// }
```

## API

### `generateMockData(input)`

Main entry point. Parses ruleblocks and generates mock data.

**Parameters:**
- `input.ruleblocks` - Array of ruleblock inputs
- `input.options` - Optional MockerOptions

**Returns:** `MockDataResult`

### `generateMockDataFromParsed(parsed, options)`

Generate mock data from already-parsed ruleblocks.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entityCount` | number | 3 | Number of patients to generate |
| `entityIdStart` | number | 1001 | Starting entity ID |
| `observationsPerEntity` | number | 3 | Observations per attribute per entity |
| `dateRange` | object | Last year | Date range for observations |
| `dateFormat` | string | 'iso' | Date format: 'iso', 'oracle', 'mssql' |
| `dateDistribution` | string | 'uniform' | Date distribution mode (see below) |
| `valueGenerators` | object | {} | Custom generators per attribute |
| `defaultValueGenerator` | function | random 0-100 | Default value generator |
| `includeMockBindTables` | boolean | true | Generate rout_* tables for binds |
| `bindTableValues` | object | {} | Custom generators for bind tables |
| `seed` | number | Date.now() | Random seed for reproducibility |

## Date Distributions

The mocker supports three date distribution modes to simulate realistic clinical patterns:

### `'uniform'` (default)
Dates are evenly distributed across the date range with some jitter.

```
|-------|-------|-------|
   ×        ×       ×
```

### `'recent-weighted'`
More observations cluster toward recent dates using exponential decay. Simulates typical clinical scenarios where recent visits are more frequent.

```typescript
const result = generateMockData({
  ruleblocks: [...],
  options: {
    dateDistribution: 'recent-weighted',
  }
});
```

```
|-------|-------|-------|
                × ×× ×××
```

### `'clustered'`
Observations group into 1-3 episodes, simulating hospital stays or illness episodes where multiple tests are ordered together.

```typescript
const result = generateMockData({
  ruleblocks: [...],
  options: {
    dateDistribution: 'clustered',
  }
});
```

```
|-------|-------|-------|
   ×××            ××
```

## Built-in Value Generators

The package includes clinical value generators for common attributes:

```typescript
import { clinicalValueGenerators } from 'picorules-compiler-js-eadv-mocker';

// Available generators:
// - lab_bld_egfr (15-120)
// - lab_bld_haemoglobin (80-180)
// - lab_bld_hba1c (4-12)
// - lab_bld_glucose (3-20)
// - lab_bld_potassium (3-6)
// - ... and many more
```

## License

MIT
