/**
 * Script to update all API routes to use static data
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'app/api/afes/route.ts',
    from: "import { getAFEs } from '@/lib/queries';",
    to: "import { getStaticAFEs } from '@/lib/static-data';",
    from2: 'const afes = await getAFEs();',
    to2: 'const afes = getStaticAFEs();',
  },
  {
    file: 'app/api/afes/[id]/route.ts',
    from: "import { getAFEById } from '@/lib/queries';",
    to: "import { getStaticAFEById } from '@/lib/static-data';",
    from2: 'const afe = await getAFEById(params.id);',
    to2: 'const afe = getStaticAFEById(params.id);',
  },
  {
    file: 'app/api/decks/route.ts',
    from: "import { getDeckSpending } from '@/lib/queries';",
    to: "import { getStaticDecks } from '@/lib/static-data';",
    from2: 'const decks = await getDeckSpending();',
    to2: 'const decks = getStaticDecks();',
  },
  {
    file: 'app/api/owners/route.ts',
    from: "import { getOwnerAllocations } from '@/lib/queries';",
    to: "import { getStaticOwners } from '@/lib/static-data';",
    from2: 'const owners = await getOwnerAllocations();',
    to2: 'const owners = getStaticOwners();',
  },
  {
    file: 'app/api/flow/route.ts',
    from: "import { getFinancialFlow } from '@/lib/queries';",
    to: "import { getStaticFlowData } from '@/lib/static-data';",
    from2: 'const flowData = await getFinancialFlow(dateFrom, dateTo);',
    to2: 'const flowData = getStaticFlowData();',
  },
  {
    file: 'app/api/graph/network/route.ts',
    from: "import { getNetworkData } from '@/lib/queries';",
    to: "import { getStaticNetworkData } from '@/lib/static-data';",
    from2: 'const networkData = await getNetworkData(centerNode, depth);',
    to2: 'const networkData = getStaticNetworkData();',
  },
  {
    file: 'app/api/transactions/[id]/route.ts',
    from: "import { getTransactionById } from '@/lib/queries';",
    to: "import { getStaticTransactionById } from '@/lib/static-data';",
    from2: 'const transaction = await getTransactionById(params.id);',
    to2: 'const transaction = getStaticTransactionById(params.id);',
  },
];

replacements.forEach(({ file, from, to, from2, to2 }) => {
  const filepath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠ Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');

  if (content.includes(from)) {
    content = content.replace(from, to);
    if (from2 && to2) {
      content = content.replace(from2, to2);
    }
    fs.writeFileSync(filepath, content);
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`⚠ ${file} already updated or pattern not found`);
  }
});

console.log('\n✅ API routes updated!');
