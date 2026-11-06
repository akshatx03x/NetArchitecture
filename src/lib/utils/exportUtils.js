import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Downloads a single text/config file to the client's browser
 */
export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, filename);
}

/**
 * Generates and downloads a ZIP archive containing all Cisco configurations,
 * VLSM allocation CSV, and Architecture Decision Record (ADR)
 */
export async function downloadConfigurationsZip(scenarioResult) {
  const zip = new JSZip();
  const scenarioName = scenarioResult.scenario.name.replace(/\s+/g, '_');
  const folder = zip.folder(`${scenarioName}_Cisco_Configs`);

  // 1. Add Cisco Configurations
  const configs = scenarioResult.configurations;
  if (configs) {
    if (configs.coreSwitch) folder.file(configs.coreSwitch.filename, configs.coreSwitch.content);
    if (configs.accessSwitch) folder.file(configs.accessSwitch.filename, configs.accessSwitch.content);
    if (configs.edgeRouter) folder.file(configs.edgeRouter.filename, configs.edgeRouter.content);
    if (configs.securityAcl) folder.file(configs.securityAcl.filename, configs.securityAcl.content);
  }

  // 2. Add VLSM CSV Report
  const vlsm = scenarioResult.vlsm;
  if (vlsm && vlsm.allocatedSubnets) {
    let csv = 'Name,VLAN ID,Requested Hosts,CIDR,Network Address,Subnet Mask,Wildcard Mask,First Usable,Last Usable,Broadcast,Default Gateway,Usable Capacity,Utilization %\n';
    vlsm.allocatedSubnets.forEach(s => {
      csv += `"${s.name}",${s.vlanId},${s.requestedHosts},"${s.cidr}","${s.networkAddress}","${s.subnetMask}","${s.wildcardMask}","${s.firstUsable}","${s.lastUsable}","${s.broadcastAddress}","${s.defaultGateway}",${s.usableHosts},${s.utilizationPercent}%\n`;
    });
    folder.file(`${scenarioName}_VLSM_Subnets.csv`, csv);
  }

  // 3. Add Architectural Decision Record Markdown
  if (scenarioResult.rawExplanations && scenarioResult.rawExplanations.exportMarkdown) {
    folder.file(`${scenarioName}_Architectural_Decisions.md`, scenarioResult.rawExplanations.exportMarkdown());
  }

  // 4. Add Raw Parameters JSON
  folder.file(`${scenarioName}_Architecture_Export.json`, JSON.stringify(scenarioResult, null, 2));

  // Generate and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${scenarioName}_Network_Architecture_Package.zip`);
}

