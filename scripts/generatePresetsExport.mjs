import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { planNetwork } from '../src/lib/engines/networkEngine.js';
import { campusLANPreset } from '../src/lib/presets/campusLAN.js';
import { metroMANPreset } from '../src/lib/presets/metroMAN.js';
import { globalWANPreset } from '../src/lib/presets/globalWAN.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function exportPreset(preset, folderName) {
  const result = planNetwork(preset);
  const outDir = path.join(rootDir, 'exports', folderName);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Write Cisco Configurations
  const configs = result.configurations;
  fs.writeFileSync(path.join(outDir, configs.coreSwitch.filename), configs.coreSwitch.content, 'utf8');
  fs.writeFileSync(path.join(outDir, configs.accessSwitch.filename), configs.accessSwitch.content, 'utf8');
  fs.writeFileSync(path.join(outDir, configs.edgeRouter.filename), configs.edgeRouter.content, 'utf8');
  fs.writeFileSync(path.join(outDir, configs.securityAcl.filename), configs.securityAcl.content, 'utf8');

  // 2. Write VLSM CSV
  let csv = 'Name,VLAN ID,Requested Hosts,CIDR,Network Address,Subnet Mask,Wildcard Mask,First Usable,Last Usable,Broadcast,Default Gateway,Usable Capacity,Utilization %\n';
  result.vlsm.allocatedSubnets.forEach(s => {
    csv += `"${s.name}",${s.vlanId},${s.requestedHosts},"${s.cidr}","${s.networkAddress}","${s.subnetMask}","${s.wildcardMask}","${s.firstUsable}","${s.lastUsable}","${s.broadcastAddress}","${s.defaultGateway}",${s.usableHosts},${s.utilizationPercent}%\n`;
  });
  fs.writeFileSync(path.join(outDir, `${folderName}_VLSM_Subnets.csv`), csv, 'utf8');

  // 3. Write Architectural Decision Record Markdown
  fs.writeFileSync(path.join(outDir, `${folderName}_Architectural_Decisions.md`), result.rawExplanations.exportMarkdown(), 'utf8');

  // 4. Write full scenario export JSON
  fs.writeFileSync(path.join(outDir, `${folderName}_Architecture_Export.json`), JSON.stringify(result, null, 2), 'utf8');

  console.log(`Exported ${folderName} to ${outDir}`);
}

exportPreset(campusLANPreset, 'profile-1-campus-lan');
exportPreset(metroMANPreset, 'profile-2-metro-man');
exportPreset(globalWANPreset, 'profile-3-global-wan');

