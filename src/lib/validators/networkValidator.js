import { validateCidr } from './cidrValidator';
import { NetworkValidationError } from '../errors/NetworkErrors';

export function validateNetworkScenario(scenario) {
  const errors = [];
  const warnings = [];

  if (!scenario || typeof scenario !== 'object') {
    return { valid: false, errors: ['Scenario parameters must be an object'], warnings: [] };
  }

  // 1. Network Name
  if (!scenario.name || !scenario.name.trim()) {
    errors.push('Network name is required.');
  }

  // 2. Network Type
  const validTypes = ['Campus LAN', 'Metro MAN', 'Global WAN', 'Custom'];
  if (!scenario.networkType || !validTypes.includes(scenario.networkType)) {
    errors.push(`Network type must be one of: ${validTypes.join(', ')}`);
  }

  // 3. Endpoints
  const endpoints = Number(scenario.endpoints);
  if (isNaN(endpoints)) {
    errors.push('Endpoints must be a valid number.');
  } else if (endpoints <= 0) {
    errors.push('Endpoints must be strictly greater than 0.');
  }

  // 4. Buildings & Sites
  const buildings = Number(scenario.buildingsCount ?? 1);
  if (isNaN(buildings) || buildings < 1) {
    errors.push('Number of buildings must be at least 1.');
  }

  const sites = Number(scenario.sitesCount ?? 1);
  if (isNaN(sites) || sites < 1) {
    errors.push('Number of sites must be at least 1.');
  }

  // 5. Distance
  const distance = Number(scenario.distanceMeters);
  if (isNaN(distance)) {
    errors.push('Link distance must be a valid number in meters.');
  } else if (distance < 0) {
    errors.push('Link distance cannot be negative.');
  } else if (scenario.requestedMedium?.toLowerCase() === 'copper' && distance > 100) {
    errors.push(`Copper medium requested for ${distance}m exceeds maximum standard 100m channel limit.`);
  }

  // 6. Root CIDR Validation
  const cidrCheck = validateCidr(scenario.rootCidr);
  if (!cidrCheck.valid) {
    errors.push(`Root IPv4 CIDR Error: ${cidrCheck.error}`);
  }

  // 7. Departments & Host Allocations
  if (!Array.isArray(scenario.departments) || scenario.departments.length === 0) {
    errors.push('At least one department or subnet requirement must be provided.');
  } else {
    let sumHosts = 0;
    scenario.departments.forEach((dept, index) => {
      const idx = index + 1;
      if (!dept.name || !dept.name.trim()) {
        errors.push(`Department #${idx} name cannot be empty.`);
      }
      const hosts = Number(dept.hosts);
      if (isNaN(hosts) || hosts <= 0 || !Number.isInteger(hosts)) {
        errors.push(`Department "${dept.name || `#${idx}`}" requires an integer host count > 0.`);
      } else {
        sumHosts += hosts;
      }
    });

    // Check theoretical sum against root network capacity
    if (cidrCheck.valid && cidrCheck.parsed) {
      const totalRootAddresses = cidrCheck.parsed.totalAddresses;
      if (sumHosts > totalRootAddresses) {
        errors.push(
          `Contradictory network requirements: Total requested hosts (${sumHosts}) exceeds total available IPv4 addresses (${totalRootAddresses}) in root network ${scenario.rootCidr}.`
        );
      }
    }
  }

  // 8. Scenario Logical Consistency Checks
  if (scenario.networkType === 'Campus LAN' && sites > 1) {
    warnings.push('Campus LAN typically operates within a single geographic site; multiple sites indicated.');
  }
  if (scenario.networkType === 'Global WAN' && sites < 2) {
    warnings.push('Global WAN designated with only 1 site; multiple sites recommended for intercontinental architecture.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

